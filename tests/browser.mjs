import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
await server.listen();
const systemChromium =
  process.env.CHROMIUM_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
let browser;
mkdirSync("test-results", { recursive: true });

try {
  browser = await chromium.launch({
    executablePath: systemChromium,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4174");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  assert.match(await page.locator("h1").innerText(), /Good food/);
  assert.equal(await page.locator("#stat-balance").innerText(), "$120.00");

  // Recipe creation, ingredient math, price validation, and persistence.
  await page.locator('nav [data-page="menu"]').click();
  await page.locator('[data-action="edit"][data-id="classic"]').click();
  await page.locator("#recipe-name").fill("The Bacon Standard");
  await page.locator('[data-ingredient="bacon"]').check();
  assert.equal(await page.locator("#editor-cost").innerText(), "$3.25");
  await page.locator("#recipe-price").fill("3.00");
  await page.locator('#recipe-form button[type="submit"]').click();
  assert.match(await page.locator("#recipe-error").innerText(), /above/);
  await page.locator("#recipe-price").fill("8.25");
  await page.locator('#recipe-form button[type="submit"]').click();
  assert.equal(await page.locator(".recipe-card").count(), 3);
  assert.match(
    await page.locator(".recipe-card").first().innerText(),
    /The Bacon Standard/,
  );
  await page.locator('[data-action="new-burger"]').click();
  await page.locator("#recipe-name").fill("The Fourth Wheel");
  await page.locator('#recipe-form button[type="submit"]').click();
  assert.equal(await page.locator(".recipe-card").count(), 4);
  assert.equal(
    await page.locator('[data-action="new-burger"]').isDisabled(),
    true,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/menu.png", fullPage: true });
  await page
    .locator(".recipe-card")
    .last()
    .locator('[data-action="edit"]')
    .click();
  await page.locator('[data-action="delete-recipe"]').click();
  assert.equal(await page.locator(".recipe-card").count(), 3);
  await page.reload();
  await page.locator('nav [data-page="menu"]').click();
  assert.match(
    await page.locator(".recipe-card").first().innerText(),
    /The Bacon Standard/,
  );

  // Upgrades are bought with actual funds and survive a reload.
  await page.locator('nav [data-page="upgrades"]').click();
  await page.locator('[data-action="buy"][data-id="seating"]').click();
  assert.match(await page.locator(".available-funds").innerText(), /85.00/);
  assert.match(
    await page.locator(".upgrade-level").first().innerText(),
    /LEVEL 1/,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/upgrades.png", fullPage: true });
  await page.locator('nav [data-page="counter"]').click();
  assert.equal(await page.locator("#stat-balance").innerText(), "$85.00");

  // The customer is actually served only when BOTH cashier answers are right.
  await page.locator('[data-action="start"]').click();
  await page.locator("#order-total").fill("0");
  await page.locator("#change-due").fill("0");
  await page.locator('#cashier-form button[type="submit"]').click();
  assert.match(
    await page.locator("#cashier-feedback").innerText(),
    /little off/,
  );
  assert.equal(await page.locator("#stat-balance").innerText(), "$85.00");
  const order = await page.evaluate(() => ({
    total: [...document.querySelectorAll(".order-line")].reduce(
      (s, i) => s + Number(i.dataset.price) * Number(i.dataset.qty),
      0,
    ),
    cash: Number(document.querySelector("#cash-received").dataset.cents),
  }));
  await page.locator("#order-total").fill((order.total / 100).toFixed(2));
  await page
    .locator("#change-due")
    .fill(((order.cash - order.total) / 100).toFixed(2));

  // Pausing preserves partially entered math and truly freezes the clock.
  await page.locator('[data-action="pause"]').click();
  const pausedTime = await page.locator("#shift-time").innerText();
  await page.clock.runFor(5000);
  assert.equal(await page.locator("#shift-time").innerText(), pausedTime);
  assert.equal(
    await page.locator("#order-total").inputValue(),
    (order.total / 100).toFixed(2),
  );
  assert.equal(await page.locator("#order-total").isDisabled(), true);
  await page.locator('[data-action="pause"]').click();
  await page.locator("#change-due").press("Enter");
  assert.match(await page.locator("#stat-served").innerText(), /1/);
  assert.notEqual(await page.locator("#stat-balance").innerText(), "$85.00");

  await page.clock.runFor(16000);
  assert.ok((await page.locator(".order-line").count()) > 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/active-shift.png",
    fullPage: true,
  });
  await page.reload();
  assert.match(await page.locator("#shop-status").innerText(), /paused/);
  assert.equal(await page.locator("#order-total").isDisabled(), true);
  await page.locator('[data-action="pause"]').click();

  // Run the real UI timer to automatic closing; inspect the actual daily report.
  await page.clock.runFor(95000);
  assert.equal(await page.locator(".report-modal").count(), 1);
  assert.match(
    await page.locator(".report-ledger").innerText(),
    /Daily overhead/,
  );
  assert.match(await page.locator(".day-card").innerText(), /Day 02/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/day-report.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Back to the counter", exact: true })
    .click();

  // Short shifts still settle expenses, while reset needs an explicit confirmation.
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="close-shift"]').click();
  assert.equal(await page.locator(".confirm-modal").count(), 1);
  await page.locator('[data-action="keep-going"]').click();
  assert.match(await page.locator("#shop-status").innerText(), /Open/);
  await page.locator('[data-action="close-shift"]').click();
  await page.locator('[data-action="confirm-close"]').click();
  assert.match(await page.locator(".day-card").innerText(), /Day 03/);
  await page
    .getByRole("button", { name: "Back to the counter", exact: true })
    .click();
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="confirm-reset"]').click();
  assert.equal(await page.locator("#stat-balance").innerText(), "$120.00");
  assert.match(await page.locator(".day-card").innerText(), /Day 01/);
  await page.locator('[data-action="help"]').first().click();
  assert.match(await page.locator(".help-modal").innerText(), /90 seconds/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").count(), 0);

  // A narrow screen supports the same gameplay and every page without overflow.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto("http://127.0.0.1:4174");
  await mobile.evaluate(() => document.fonts.ready);
  for (const route of ["counter", "menu", "upgrades"]) {
    await mobile.locator(`nav [data-page="${route}"]`).click();
    const widths = await mobile.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    assert.ok(
      widths.content <= widths.viewport,
      `${route} overflows on mobile: ${JSON.stringify(widths)}`,
    );
    await mobile.evaluate(() => window.scrollTo(0, 0));
    await mobile.screenshot({
      path: `test-results/mobile-${route}.png`,
      fullPage: true,
    });
  }
  for (const width of [320, 768, 1024]) {
    await mobile.setViewportSize({ width, height: 900 });
    for (const route of ["counter", "menu", "upgrades"]) {
      await mobile.locator(`nav [data-page="${route}"]`).click();
      const overflowing = await mobile.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(
        overflowing,
        false,
        `${route} must fit a ${width}px viewport`,
      );
    }
  }
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.locator('nav [data-page="counter"]').click();
  await mobile.locator('[data-action="start"]').click();
  assert.equal(
    await mobile.locator(".shop-scene").isVisible(),
    false,
    "mobile play prioritizes the register",
  );
  await mobile.locator("#order-total").fill("1.25");
  assert.equal(await mobile.locator("#order-total").inputValue(), "1.25");
  await mobile.evaluate(() => window.scrollTo(0, 0));
  await mobile.screenshot({
    path: "test-results/mobile-active.png",
    fullPage: true,
  });
  await mobile.locator('[data-action="pause"]').click();
  await mobile.locator('nav [data-page="menu"]').click();
  assert.equal(
    await mobile.locator('[data-action="edit"]').first().isDisabled(),
    true,
  );

  assert.deepEqual(errors, [], "no browser runtime or console errors");
  console.log(
    "PASS: recipe editing, pricing validation, new recipes, upgrades, cashier math, pause, save/resume, automatic closing, reports, early closing, reset, help, and mobile layouts.",
  );
  console.log("Screenshots saved in test-results/.");
} finally {
  if (browser) await browser.close();
  await server.close();
}
