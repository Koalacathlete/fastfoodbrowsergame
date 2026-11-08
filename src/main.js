import "./style.css";
import "./counter.css";
import {
  SHIFT_SECONDS,
  DAILY_RENT,
  INGREDIENTS,
  UPGRADES,
  money,
  initialState,
  parseMoney,
  itemCost,
  demand,
  updateItem,
  buyUpgrade,
  startShift,
  tick,
  serveOrder,
  submitOrderTotal,
  finishShift,
  loadState,
  saveState,
} from "./game.js";
import { icon, burgerArt } from "./art.js";
import {
  counterView,
  registerView,
  queueView,
  speechView,
  guestView,
} from "./counter-view.js";
import { pressKey } from "./cashier.js";

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  };
}
let state = loadState(storage);
let page = "counter";
let editing = null;
let modalFocus = null;
let toastTimeout;
let saved = true;
let cashierDraft = { orderId: null, amount: "" };
let lastTick = performance.now();
let saveElapsed = 0;
const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const timeText = (seconds) =>
  `${Math.floor(Math.ceil(seconds) / 60)}:${String(Math.ceil(seconds) % 60).padStart(2, "0")}`;
const button = (text, action, cls = "btn-primary", extra = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;

function persist() {
  saved = saveState(state, storage);
  const label = document.querySelector("#save-label");
  if (label)
    label.textContent = saved
      ? "Saved on this device"
      : "Playing without a save";
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.innerHTML = `${icon("check")}<span>${esc(message)}</span>`;
  el.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("visible"), 3800);
}

function render() {
  if (page === "counter") {
    app.innerHTML = counterPage();
    updateLive();
    return;
  }
  const navItems = [
    ["counter", "counter", "The counter"],
    ["menu", "menu", "Menu builder"],
    ["upgrades", "shop", "Shop upgrades"],
  ];
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar">
      <a href="#" class="brand" data-action="nav" data-page="counter" aria-label="The Daily Bun home"><span class="brand-symbol">${icon("burger", "", 32)}</span><span>the daily bun<span class="brand-sub">A LITTLE BUSINESS. A LOT OF HEART.</span></span></a>
      <span class="sidebar-label">YOUR WORKSPACE</span>
      <nav aria-label="Main navigation">${navItems.map(([id, i, label]) => `<button class="nav-item ${page === id ? "active" : ""}" data-action="nav" data-page="${id}" ${page === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span>${page === id ? '<span class="nav-dot"></span>' : ""}${id === "upgrades" ? '<span class="nav-new">4</span>' : ""}</button>`).join("")}</nav>
      <div class="sidebar-guide"><span class="mini-spark">${icon("spark", "", 23)}</span><h3>Small shop.<br>Big possibilities.</h3><p>Build your menu. Trust your math. Make it your own.</p><button data-action="help">The owner's handbook ${icon("arrow", "", 17)}</button></div>
      <div class="sidebar-bottom"><button class="subtle-button" data-action="help">${icon("help", "", 18)} How to play</button><button class="subtle-button" data-action="reset">${icon("reset", "", 16)} Fresh start</button><div class="sidebar-footer"><span class="status-dot"></span> INDEPENDENTLY OWNED, BY YOU.</div></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div class="breadcrumb">YOUR SHOP <span>/</span> <strong>${page === "counter" ? "THE COUNTER" : page === "menu" ? "MENU BUILDER" : "SHOP UPGRADES"}</strong></div><div class="topbar-right"><span class="save-state">${icon("check", "", 15)}<span id="save-label">${saved ? "Saved on this device" : "Playing without a save"}</span></span><button class="icon-button" data-action="help" aria-label="Open how to play">${icon("help", "", 20)}</button><span class="owner-avatar" title="That's you, the owner">YOU</span></div></header>
      ${page === "counter" ? counterPage() : page === "menu" ? menuPage() : upgradesPage()}
      <footer class="page-footer"><span>${icon("burger", "", 15)} A good day starts with a good bun.</span><span>THE DAILY BUN <span class="footer-separator">·</span> EST. TODAY</span></footer>
    </main>
  </div>`;
  updateLive();
}

function pageHeading(kicker, title, subtitle, aside = "") {
  return `<section class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>${aside}</section>`;
}

function counterPage() {
  return counterView(state, { register: registerContent(), saved });
}

function registerContent() {
  const order = state.shift?.queue[0];
  const key = order ? `${state.day}-${order.id}-${order.stage}` : null;
  if (cashierDraft.orderId !== key) cashierDraft = { orderId: key, amount: "" };
  return registerView(state, cashierDraft);
}

function refreshCounter() {
  if (page !== "counter") return;
  setHTML("register-card", registerContent());
  setHTML("order-speech", speechView(state));
  setHTML("counter-guest", guestView(state));
  setHTML("customer-queue", queueView(state));
  updateLive();
}

function menuPage() {
  const d = demand(state);
  return `${pageHeading("THE SECRET INGREDIENT IS YOU.", "Something for every appetite.", "Choose your ingredients. Find your price. Make a name for yourself.", button(`${icon("plus", "", 18)} Create a burger`, "new-burger", "btn-primary", state.menu.filter((i) => i.kind === "burger").length >= 4 || state.shift ? "disabled" : ""))}
    ${state.shift ? pausedNotice() : ""}
    <div class="menu-strategy"><div class="strategy-icon">${icon("trend", "", 25)}</div><div><h3>A good menu is a balancing act.</h3><p>High margins feel good. Fair prices keep the neighborhood coming back. Ingredients are charged only when you make a sale.</p></div><div class="demand-meter"><span>NEIGHBORHOOD DEMAND</span><strong>${d > 1.15 ? "Looking lively" : d > 0.8 ? "A steady appetite" : "Price-sensitive"}</strong><div><i style="width:${Math.min((d / 1.6) * 100, 100)}%"></i></div></div></div>
    <div class="section-heading"><h2>Your signature burgers</h2><span class="muted">${state.menu.filter((i) => i.kind === "burger").length} of 4 menu slots filled</span></div>
    <div class="recipe-grid">${state.menu
      .filter((i) => i.kind === "burger")
      .map(
        (item, index) =>
          `<article class="recipe-card"><div class="recipe-art art-${index % 4}"><span class="recipe-number">SIGNATURE NO. 0${index + 1}</span>${burgerArt(item, true)}<span class="recipe-price">${money(item.price)}</span></div><div class="recipe-body"><h2>${esc(item.name)}</h2><p>${item.ingredients
            .filter((id) => id !== "bun")
            .map((id) => INGREDIENTS.find((i) => i.id === id).name)
            .join(
              " · ",
            )}</p><div class="recipe-economics"><div><span>Ingredient cost</span><strong>${money(itemCost(item, state))}</strong></div><div><span>Profit per burger</span><strong class="green-text">${money(item.price - itemCost(item, state))}</strong></div><div><span>Margin</span><strong>${Math.round(((item.price - itemCost(item, state)) / item.price) * 100)}%</strong></div></div>${button(`${icon("edit", "", 16)} Edit recipe & price`, "edit", "btn-secondary full-width", `data-id="${esc(item.id)}" ${state.shift ? "disabled" : ""}`)}</div></article>`,
      )
      .join("")}</div>
    <div class="section-heading sides-heading"><div><span class="eyebrow">BETTER TOGETHER</span><h2>A little something on the side</h2></div></div><div class="sides-grid">${state.menu
      .filter((i) => i.kind !== "burger")
      .map(
        (item) =>
          `<article class="side-card"><div class="side-art">${burgerArt(item)}</div><div><h3>${esc(item.name)}</h3><p>${money(itemCost(item, state))} cost <span>·</span> ${money(item.price - itemCost(item, state))} profit</p><strong>${money(item.price)}</strong></div><button class="icon-button" data-action="edit" data-id="${item.id}" aria-label="Edit ${esc(item.name)} price" ${state.shift ? "disabled" : ""}>${icon("edit", "", 19)}</button></article>`,
      )
      .join("")}</div>`;
}

function pausedNotice() {
  return `<div class="notice">${icon("pause", "", 18)} Your shift is paused. Menu changes and upgrades are available between shifts.<button data-action="nav" data-page="counter">Back to the counter ${icon("arrow", "", 16)}</button></div>`;
}

function upgradesPage() {
  return `${pageHeading("REINVEST IN YOUR LITTLE EMPIRE.", "Make this place your place.", "Small improvements. Happier customers. A shop worth coming back to.", `<div class="available-funds"><span>AVAILABLE TO INVEST</span><strong>${money(state.balance)}</strong></div>`)}${state.shift ? pausedNotice() : ""}<div class="upgrade-banner"><div><span class="eyebrow">A BUSINESS WITH ROOM TO GROW</span><h2>Good things grow<br>one upgrade at a time.</h2><p>Every upgrade sticks around for future days.<br>Start small, and make every dollar work harder.</p></div><div class="banner-plant">${icon("plant", "", 130)}</div><span class="banner-caption">YOUR NEXT CHAPTER, GROWING.</span></div><div class="upgrades-grid">${UPGRADES.map(
    (u, index) => {
      const level = state.upgrades[u.id];
      const maxed = level === 3;
      const price = u.prices[level];
      return `<article class="upgrade-card"><div class="upgrade-card-top"><div class="upgrade-art upgrade-art-${index}">${icon(u.icon, "", 48)}</div><div class="upgrade-level"><span>LEVEL ${level} / 3</span><div>${[1, 2, 3].map((i) => `<i class="${i <= level ? "filled" : ""}"></i>`).join("")}</div></div></div><h2>${u.name}</h2><p>${u.description}</p><div class="upgrade-effect">${icon("plus", "", 15)} ${u.effect}</div><div class="upgrade-purchase"><span>${maxed ? "The best on the block" : `Next: level ${level + 1}`}<strong>${maxed ? "Fully upgraded" : money(price)}</strong></span>${button(maxed ? `${icon("check", "", 16)} Maxed out` : `Upgrade ${icon("arrow", "", 16)}`, "buy", maxed ? "btn-secondary" : "btn-primary", `data-id="${u.id}" ${maxed || state.balance < price || state.shift ? "disabled" : ""}`)}</div>${!maxed && state.balance < price ? `<span class="funding-note">${money(price - state.balance)} more to make it yours</span>` : ""}</article>`;
    },
  ).join("")}</div>`;
}

function updateLive() {
  const shift = state.shift;
  if (!shift || page !== "counter") return;
  setText("stat-balance", money(state.balance));
  setText("stat-sales", money(shift.revenue));
  setHTML("stat-served", String(shift.served));
  setHTML(
    "stat-streak",
    String(Math.max(state.lifetime.bestStreak, shift.bestStreak)),
  );
  setText("shift-time", timeText(shift.remaining));
  setHTML(
    "shift-detail",
    `${shift.served} served <span>·</span> ${shift.lost} walked away`,
  );
  const track = document.querySelector("#shift-progress");
  if (track) track.style.width = `${(shift.remaining / SHIFT_SECONDS) * 100}%`;
  const order = shift.queue[0];
  if (order) {
    setText("patience-label", `${Math.ceil(order.patience)}s`);
    const patience = document.querySelector("#patience-progress");
    if (patience) {
      patience.style.width = `${(order.patience / order.maxPatience) * 100}%`;
      patience.classList.toggle("urgent", order.patience < 10);
    }
    document
      .querySelector("#patience-label")
      ?.classList.toggle("urgent-text", order.patience < 10);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function modal(content, cls = "") {
  modalFocus = document.activeElement;
  modalRoot.innerHTML = `<dialog class="modal ${cls}" aria-labelledby="modal-title"><button class="modal-close icon-button" data-action="dismiss" aria-label="Close dialog">${icon("close")}</button>${content}</dialog>`;
  const el = modalRoot.querySelector("dialog");
  el.addEventListener("click", (event) => {
    if (
      event.target === el &&
      (event.clientX < el.getBoundingClientRect().left ||
        event.clientX > el.getBoundingClientRect().right ||
        event.clientY < el.getBoundingClientRect().top ||
        event.clientY > el.getBoundingClientRect().bottom)
    )
      closeModal();
  });
  el.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  el.showModal();
}

function closeModal() {
  modalRoot.querySelector("dialog")?.close();
  modalRoot.innerHTML = "";
  editing = null;
  if (modalFocus?.isConnected) modalFocus.focus();
}

function openEditor(id) {
  if (state.shift) {
    toast("Your menu is set for this shift. Make changes after closing.");
    return;
  }
  if (!id && state.menu.filter((i) => i.kind === "burger").length >= 4) return;
  editing = id
    ? structuredClone(state.menu.find((i) => i.id === id))
    : {
        id: `burger-${Date.now()}`,
        name: "Your signature burger",
        kind: "burger",
        price: 700,
        ingredients: ["bun", "beef", "cheese", "lettuce", "sauce"],
      };
  if (!editing) return;
  const burger = editing.kind === "burger";
  modal(
    `<div class="eyebrow">${burger ? "A LITTLE RECIPE FOR SUCCESS" : "THE PERFECT SIDEKICK"}</div><h2 id="modal-title">${id ? "Make it your own." : "Meet your next signature."}</h2><p class="modal-intro">${burger ? "Build a burger worth coming back for. Every ingredient adds up." : "The small things make a meal. Give yours a name and a price."}</p><form id="recipe-form" novalidate><div class="editor-layout"><div class="editor-preview"><div id="editor-art">${burgerArt(editing, true)}</div><div class="editor-economics"><span>INGREDIENT COST<strong id="editor-cost">${money(itemCost(editing, state))}</strong></span><span>PROFIT PER SALE<strong id="editor-profit" class="green-text">${money(editing.price - itemCost(editing, state))}</strong></span></div><p>Charged per sale. No upfront stock costs.</p></div><div class="editor-fields"><label for="recipe-name">On the menu as<input class="text-input" id="recipe-name" name="name" maxlength="24" value="${esc(editing.name)}" required /></label>${
      burger
        ? `<fieldset class="ingredient-fieldset"><legend>The foundation <span>Choose one patty</span></legend><div class="fixed-ingredient"><span>${icon("check", "", 15)} Brioche bun</span><strong>${money(INGREDIENTS[0].cost)}</strong></div>${INGREDIENTS.filter(
            (i) => i.group === "protein",
          )
            .map((i) => ingredientOption(i, true))
            .join(
              "",
            )}</fieldset><fieldset class="ingredient-fieldset"><legend>Make it yours <span>Mix & match</span></legend>${INGREDIENTS.filter(
            (i) => i.group === "topping",
          )
            .map((i) => ingredientOption(i, false))
            .join("")}</fieldset>`
        : '<div class="side-editor-note">Your supplier handles the recipe. You handle the price.</div>'
    }<label for="recipe-price">Selling price<div class="money-input editor-price"><span>$</span><input id="recipe-price" name="price" inputmode="decimal" value="${(editing.price / 100).toFixed(2)}" maxlength="6" required /></div></label><p class="field-hint">A higher price means more margin, but fewer customers.</p></div></div><p id="recipe-error" class="form-error" role="status"></p><div class="modal-actions">${id && burger && state.menu.filter((i) => i.kind === "burger").length > 1 ? button("Remove from menu", "delete-recipe", "btn-text danger-text", `data-id="${esc(id)}"`) : "<span></span>"}<div>${button("Cancel", "dismiss", "btn-secondary")}<button class="btn btn-primary" type="submit">${icon("check", "", 17)} Save to menu</button></div></div></form>`,
    "recipe-modal",
  );
}

function ingredientOption(ingredient, radio) {
  return `<label class="ingredient-option"><input type="${radio ? "radio" : "checkbox"}" ${radio ? 'name="protein"' : ""} data-ingredient="${ingredient.id}" ${editing.ingredients.includes(ingredient.id) ? "checked" : ""}/><span class="ingredient-swatch" style="background:${ingredient.color}"></span><span>${ingredient.name}</span><strong>${money(ingredient.cost)}</strong></label>`;
}

function updateEditor() {
  if (!editing) return;
  const cost = itemCost(editing, state);
  setHTML("editor-art", burgerArt(editing, true));
  setText("editor-cost", money(cost));
  setText(
    "editor-profit",
    Number.isInteger(editing.price) ? money(editing.price - cost) : "—",
  );
}

function showHelp() {
  if (state.shift && !state.shift.paused) {
    state.shift.paused = true;
    persist();
    render();
  }
  modal(
    `<span class="handbook-icon">${icon("burger", "", 38)}</span><div class="eyebrow">THE OWNER’S HANDBOOK</div><h2 id="modal-title">A little hustle.<br>A lot of heart.</h2><p class="modal-intro">Welcome to The Daily Bun. Your shop, your menu, your math.</p><div class="handbook-steps"><div><span>01</span><div><h3>Build something delicious.</h3><p>Choose a patty and toppings in Menu builder. Every ingredient has a cost. Set a selling price above that cost, but keep it fair to attract customers.</p></div></div><div><span>02</span><div><h3>Open up. Think on your feet.</h3><p>Each shift lasts 90 seconds. Add up quantities × menu prices, then subtract the total from the cash received to find the change. Enter the total on your register and press TOTAL. Your customer will then hand over cash. Enter their change and press CHANGE to finish the sale.</p><div class="math-example">2 burgers × $6.50 + 1 fries × $2.50 = <strong>$15.50</strong><br>$20.00 cash − $15.50 total = <strong>$4.50 change</strong></div></div></div><div><span>03</span><div><h3>Turn good math into a good business.</h3><p>Ingredients are deducted with each sale; ${money(DAILY_RENT)} overhead is charged at closing. Fast, first-try answers earn a $0.50 tip. Reinvest your profit in upgrades.</p></div></div></div><div class="handbook-note">${icon("clock", "", 18)} Customers in the lineup lose patience too. Pause whenever you need a breather. Progress saves on this device; reloaded shifts resume paused.</div>${button("Let’s make something good " + icon("arrow", "", 17), "dismiss", "btn-primary full-width")}`,
    "help-modal",
  );
}

function showReport() {
  const report = state.lastReport;
  if (!report) return;
  modal(
    `<div class="report-badge">${icon(report.profit >= 0 ? "star" : "sun", "", 38)}</div><div class="eyebrow">DAY ${String(report.day).padStart(2, "0")} · THAT’S A WRAP</div><h2 id="modal-title">${report.served === 0 ? "Tomorrow is a fresh start." : report.profit < 0 ? "A little wiser. A little better." : "Now that’s a good day."}</h2><p class="modal-intro">${report.served === 0 ? "Your next great shift is still ahead of you." : `You fed ${report.served} hungry ${report.served === 1 ? "neighbor" : "neighbors"}. Here’s how it all adds up.`}</p><div class="report-profit ${report.profit < 0 ? "negative" : ""}"><span>NET PROFIT</span><strong>${report.profit >= 0 ? "+" : "−"}${money(Math.abs(report.profit))}</strong><span>After ingredients and daily overhead</span></div><div class="report-ledger"><div><span>Menu sales</span><strong>${money(report.revenue)}</strong></div><div><span>A little extra in tips</span><strong class="green-text">+${money(report.tips)}</strong></div><div><span>Ingredient costs</span><strong>−${money(report.costs)}</strong></div><div><span>Daily overhead</span><strong>−${money(report.rent)}</strong></div></div><div class="report-metrics"><div><strong>${report.served}</strong><span>Served</span></div><div><strong>${report.lost}</strong><span>Walked away</span></div><div><strong>${report.bestStreak}</strong><span>Best streak</span></div><div><strong>${report.mistakes}</strong><span>Math retries</span></div></div><p class="report-balance">Your shop balance <strong>${money(state.balance)}</strong></p><div class="report-actions">${button("Invest in your shop " + icon("arrow", "", 17), "report-upgrades", "btn-primary full-width")}${button("Back to the counter", "dismiss", "btn-text full-width")}</div>`,
    "report-modal",
  );
}

function actionHandler(event) {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  event.preventDefault();
  const action = target.dataset.action;
  if (action === "nav") {
    const next = target.dataset.page;
    if (next !== "counter" && state.shift && !state.shift.paused) {
      state.shift.paused = true;
      persist();
    }
    page = next;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "start") {
    startShift(state);
    lastTick = performance.now();
    persist();
    render();
    document.querySelector("#register-amount")?.focus({ preventScroll: true });
  } else if (action === "pause") {
    if (!state.shift) return;
    state.shift.paused = !state.shift.paused;
    lastTick = performance.now();
    persist();
    render();
    if (!state.shift.paused)
      document
        .querySelector("#register-amount")
        ?.focus({ preventScroll: true });
  } else if (action === "register-key") {
    const input = document.querySelector("#register-amount");
    if (!input || input.disabled) return;
    input.value = pressKey(input.value, target.dataset.key);
    cashierDraft.amount = input.value;
    input.focus({ preventScroll: true });
  } else if (action === "edit") openEditor(target.dataset.id);
  else if (action === "new-burger") openEditor();
  else if (action === "help") showHelp();
  else if (action === "dismiss") closeModal();
  else if (action === "buy") {
    const id = target.dataset.id;
    const error = buyUpgrade(state, id);
    if (error) toast(error);
    else {
      persist();
      render();
      toast(
        `${UPGRADES.find((i) => i.id === id).short} upgraded. Here’s to the next good day!`,
      );
    }
  } else if (action === "delete-recipe") {
    if (
      state.shift ||
      state.menu.filter((i) => i.kind === "burger").length <= 1
    )
      return;
    state.menu = state.menu.filter((i) => i.id !== target.dataset.id);
    persist();
    closeModal();
    render();
    toast("Menu updated. Room for something new.");
  } else if (action === "report-upgrades") {
    closeModal();
    page = "upgrades";
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "close-shift") {
    if (!state.shift) return;
    state.shift.paused = true;
    persist();
    render();
    modal(
      `<div class="eyebrow">CALLING IT A DAY?</div><h2 id="modal-title">Hang up the apron?</h2><p class="modal-intro">Your earnings so far will be kept. Waiting customers will leave, and the ${money(DAILY_RENT)} daily overhead will still be charged.</p><div class="confirm-actions">${button("Keep going", "keep-going", "btn-secondary")}${button("Close the shop", "confirm-close")}</div>`,
      "confirm-modal",
    );
  } else if (action === "keep-going") {
    closeModal();
    if (state.shift) {
      state.shift.paused = false;
      lastTick = performance.now();
      persist();
      render();
    }
  } else if (action === "confirm-close") {
    finishShift(state);
    persist();
    closeModal();
    render();
    showReport();
  } else if (action === "reset") {
    if (state.shift && !state.shift.paused) {
      state.shift.paused = true;
      persist();
      render();
    }
    modal(
      `<div class="eyebrow">A CLEAN SLATE</div><h2 id="modal-title">Start a new little story?</h2><p class="modal-intro">This resets your balance, menu, days, and upgrades on this device. You’ll start again with $120 and a whole lot of possibility.</p><div class="confirm-actions">${button("Keep my shop", "dismiss", "btn-secondary")}${button("Reset my progress", "confirm-reset", "btn-danger")}</div>`,
      "confirm-modal",
    );
  } else if (action === "confirm-reset") {
    state = initialState();
    persist();
    closeModal();
    page = "counter";
    render();
    toast("A fresh start. Make this one yours.");
  }
}
app.addEventListener("click", actionHandler);
modalRoot.addEventListener("click", actionHandler);

app.addEventListener("input", (event) => {
  if (event.target.id === "register-amount")
    cashierDraft.amount = event.target.value;
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "cashier-form") return;
  event.preventDefault();
  const order = state.shift?.queue[0];
  if (!order) return;
  const result =
    order.stage === "total"
      ? submitOrderTotal(state, event.target.elements.amount.value)
      : serveOrder(state, event.target.elements.amount.value);
  if (!result.ok) {
    setText("cashier-feedback", result.message);
    document.querySelector("#cashier-feedback")?.classList.add("error-text");
    document.querySelector("#cashier-form")?.classList.add("has-error");
    setTimeout(
      () =>
        document.querySelector("#cashier-form")?.classList.remove("has-error"),
      400,
    );
    persist();
    return;
  }
  persist();
  refreshCounter();
  if (result.stage !== "change") {
    toast(
      `${result.customer} says thanks! +${money(result.profit)} profit${result.tip ? ` (includes ${money(result.tip)} tip)` : ""}`,
    );
    const register = document.querySelector("#register-card");
    register?.classList.add("drawer-open");
    setTimeout(() => register?.classList.remove("drawer-open"), 900);
  }
  document.querySelector("#register-amount")?.focus({ preventScroll: true });
});

// Physical keyboard entry also works after clicking the shop scenery.
// Native inputs and modal keyboard shortcuts keep their normal behavior.
document.addEventListener("keydown", (event) => {
  if (
    page !== "counter" ||
    !state.shift ||
    state.shift.paused ||
    modalRoot.querySelector("dialog") ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.target.closest("input, textarea, select, button, a")) return;
  const input = document.querySelector("#register-amount");
  if (!input || input.disabled) return;
  if (
    /^[0-9.]$/.test(event.key) ||
    event.key === "Backspace" ||
    event.key === "Delete"
  ) {
    event.preventDefault();
    input.value = pressKey(
      input.value,
      event.key === "Backspace"
        ? "backspace"
        : event.key === "Delete"
          ? "clear"
          : event.key,
    );
    cashierDraft.amount = input.value;
    input.focus({ preventScroll: true });
  } else if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#cashier-form")?.requestSubmit();
  }
});

modalRoot.addEventListener("input", (event) => {
  if (!editing) return;
  const target = event.target;
  if (target.id === "recipe-name") editing.name = target.value;
  if (target.id === "recipe-price") editing.price = parseMoney(target.value);
  if (target.dataset.ingredient) {
    const id = target.dataset.ingredient;
    const ingredient = INGREDIENTS.find((i) => i.id === id);
    if (ingredient.group === "protein")
      editing.ingredients = editing.ingredients
        .filter((i) => INGREDIENTS.find((x) => x.id === i).group !== "protein")
        .concat(id);
    else
      editing.ingredients = target.checked
        ? [...new Set([...editing.ingredients, id])]
        : editing.ingredients.filter((i) => i !== id);
  }
  updateEditor();
});
modalRoot.addEventListener("submit", (event) => {
  if (event.target.id !== "recipe-form" || !editing) return;
  event.preventDefault();
  const error = updateItem(state, editing);
  if (error) {
    setText("recipe-error", error);
    return;
  }
  persist();
  closeModal();
  render();
  toast("Looking delicious. Your menu is updated.");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.shift && !state.shift.paused) {
    state.shift.paused = true;
    persist();
    render();
  }
  lastTick = performance.now();
});
window.addEventListener("pagehide", persist);
setInterval(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTick) / 1000, 2);
  lastTick = now;
  if (!state.shift || state.shift.paused) return;
  const previous = state.shift.queue[0]?.id;
  const events = tick(state, dt);
  if (events.some((i) => i.type === "closed")) {
    persist();
    render();
    showReport();
    return;
  }
  if (events.length && page === "counter") {
    if (previous !== state.shift.queue[0]?.id) refreshCounter();
    else setHTML("customer-queue", queueView(state));
  }
  if (events.some((i) => i.type === "left"))
    toast("A customer had to leave. The next one is a fresh start.");
  updateLive();
  saveElapsed += dt;
  if (saveElapsed > 2) {
    persist();
    saveElapsed = 0;
  }
}, 250);

render();
if (state.shift)
  toast("Welcome back! Your shift is paused and ready when you are.");
