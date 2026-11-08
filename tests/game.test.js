import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  parseMoney,
  itemCost,
  demand,
  activeOrder,
  laneQueue,
  referencePrice,
  updateItem,
  buyUpgrade,
  startShift,
  tick,
  serveOrder,
  submitOrderTotal,
  finishShift,
  loadState,
  saveState,
  SAVE_KEY,
} from "../src/game.js";

const fixed = () => 0.5;
const ringUp = (state) => {
  const order = activeOrder(state);
  const first = submitOrderTotal(state, (order.total / 100).toFixed(2));
  if (!first.ok) return first;
  return serveOrder(state, ((order.cash - order.total) / 100).toFixed(2));
};

test("money is parsed as exact cents and malformed values are rejected", () => {
  for (const [input, expected] of [
    ["6.50", 650],
    ["$0.05", 5],
    ["12", 1200],
    [" 2.5 ", 250],
    ["0", 0],
  ])
    assert.equal(parseMoney(input), expected);
  for (const input of [
    "",
    "-1",
    "1.005",
    "1e2",
    "1.2.3",
    "NaN",
    "Infinity",
    "1,20",
  ])
    assert.equal(parseMoney(input), null);
});

test("ingredient costs, pricing, and demand reflect the actual menu", () => {
  const state = initialState();
  const classic = state.menu[0];
  assert.equal(itemCost(classic, state), 255);
  const originalDemand = demand(state);
  assert.equal(updateItem(state, { ...classic, price: 1000 }), null);
  assert.ok(demand(state) < originalDemand);
  const burgerDemand = demand(state);
  assert.equal(
    updateItem(state, {
      ...state.menu.find((i) => i.id === "lemonade"),
      price: 2000,
    }),
    null,
  );
  assert.ok(
    demand(state) < burgerDemand,
    "overpriced drinks also reduce demand",
  );
  assert.match(updateItem(state, { ...classic, price: 255 }), /above/);
  assert.match(updateItem(state, { ...classic, price: 3001 }), /30.00/);
  assert.match(
    updateItem(state, { ...classic, ingredients: ["bun", "beef", "veggie"] }),
    /one patty/,
  );
  assert.match(
    updateItem(state, { ...classic, ingredients: ["bun", "beef", "beef"] }),
    /only once/,
  );
});

test("cashier accepts the total before revealing payment and only credits correct change", () => {
  const state = initialState();
  startShift(state, fixed);
  const order = structuredClone(state.shift.queue[0]);
  assert.equal(order.stage, "total");
  assert.equal(
    serveOrder(state, "0").ok,
    false,
    "payment cannot skip the total",
  );
  assert.equal(submitOrderTotal(state, "1.00").ok, false);
  assert.equal(state.balance, 12000);
  assert.equal(state.shift.served, 0);
  assert.equal(
    submitOrderTotal(state, (order.total / 100).toFixed(2)).ok,
    true,
  );
  assert.equal(state.shift.queue[0].stage, "change");
  assert.equal(state.shift.queue[0].acceptedTotal, order.total);
  assert.equal(
    state.balance,
    12000,
    "ringing up the total does not credit money",
  );
  assert.equal(state.shift.revenue, 0);
  assert.equal(
    submitOrderTotal(state, "1.00").ok,
    false,
    "accepted total cannot be re-entered",
  );
  assert.equal(serveOrder(state, "0").ok, false);
  assert.equal(state.balance, 12000);
  const result = serveOrder(
    state,
    ((order.cash - order.total) / 100).toFixed(2),
  );
  assert.equal(result.ok, true);
  assert.equal(result.tip, 0, "mistakes forfeit the speed tip");
  assert.equal(state.balance, 12000 + order.total - order.cost);
  assert.equal(state.shift.costs, order.cost);
  assert.equal(state.shift.mistakes, 2);
  assert.equal(state.shift.queue.length, 2);
  assert.equal(
    state.shift.queue.some((item) => item.id === order.id),
    false,
  );
  assert.equal(state.shift.streak, 0);
});

test("a fast, first-try sale earns a tip and perfect streak", () => {
  const state = initialState();
  state.upgrades.plants = 2;
  startShift(state, fixed);
  const result = ringUp(state);
  assert.equal(result.tip, 100);
  assert.equal(state.shift.streak, 1);
  assert.equal(state.shift.bestStreak, 1);
});

test("pause freezes the clock, patience, arrivals, and serving", () => {
  const state = initialState();
  startShift(state, fixed);
  state.shift.paused = true;
  const snapshot = JSON.stringify(state);
  assert.deepEqual(tick(state, 30, fixed), []);
  assert.equal(ringUp(state).ok, false);
  assert.equal(JSON.stringify(state), snapshot);
});

test("waiting customers can leave and each of three lines has at most three people", () => {
  const state = initialState();
  startShift(state, fixed);
  let losses = 0;
  for (let i = 0; i < 170; i++) {
    const events = tick(state, 0.25, fixed);
    losses += events
      .filter((i) => i.type === "left")
      .reduce((sum, e) => sum + e.count, 0);
    assert.ok(state.shift.queue.length <= 9);
    for (let lane = 0; lane < 3; lane++)
      assert.ok(laneQueue(state, lane).length <= 3);
  }
  assert.ok(losses > 0);
  assert.equal(state.shift.lost, losses);
});

test("a complete shift reconciles the bank, costs, tips, rent, and lifetime totals once", () => {
  const state = initialState();
  startShift(state, fixed);
  for (let i = 0; i < 360; i++) {
    if (state.shift?.queue.length) assert.equal(ringUp(state).ok, true);
    tick(state, 0.25, fixed);
  }
  assert.equal(state.shift, null);
  assert.equal(state.day, 2);
  const report = state.lastReport;
  assert.ok(
    report.served >= 15,
    "multiple customer orders were actually served",
  );
  assert.equal(
    report.profit,
    report.revenue + report.tips - report.costs - report.rent,
  );
  assert.equal(state.balance, 12000 + report.profit);
  assert.equal(report.lost, 0);
  assert.equal(state.lifetime.revenue, report.revenue);
  assert.equal(state.lifetime.served, report.served);
  assert.equal(finishShift(state), null);
  assert.equal(state.balance, 12000 + report.profit);
});

test("upgrades charge once per level, enforce affordability, and affect gameplay", () => {
  const state = initialState();
  const oldDemand = demand(state);
  assert.equal(buyUpgrade(state, "sign"), null);
  assert.equal(state.balance, 7500);
  assert.ok(demand(state) > oldDemand);
  assert.match(buyUpgrade(state, "sign"), /more orders/);
  state.balance = 100000;
  const demandBeforeKitchen = demand(state);
  assert.equal(buyUpgrade(state, "kitchen"), null);
  assert.equal(itemCost(state.menu[0], state), Math.round(255 * 0.95));
  assert.equal(
    demand(state),
    demandBeforeKitchen,
    "kitchen efficiency must not reduce demand",
  );
  assert.equal(buyUpgrade(state, "seating"), null);
  startShift(state, fixed);
  assert.equal(state.shift.queue[0].maxPatience, 42);
  assert.match(buyUpgrade(state, "seating"), /between shifts/);
  assert.match(
    updateItem(state, { ...state.menu[0], price: 900 }),
    /Finish your shift/,
  );
  finishShift(state);
  assert.equal(buyUpgrade(state, "plants"), null);
  assert.equal(buyUpgrade(state, "plants"), null);
  assert.equal(buyUpgrade(state, "plants"), null);
  assert.match(buyUpgrade(state, "plants"), /maxed/);
});

test("orders snapshot prices and ingredient costs and can include a later-day third item", () => {
  const state = initialState();
  state.day = 4;
  state.menu.forEach(
    (item) => (item.price = Math.round((referencePrice(item) * 0.7) / 25) * 25),
  );
  startShift(state, () => 0.1);
  const order = activeOrder(state);
  assert.equal(order.lines.length, 3);
  assert.ok(order.lines[0].qty >= 2);
  assert.equal(
    order.total,
    order.lines.reduce((s, l) => s + l.price * l.qty, 0),
  );
  const savedTotal = order.total;
  state.menu[0].price = 2000;
  assert.equal(order.total, savedTotal);
  assert.ok(order.cash > order.total);
});

test("saves persist progress and active shifts reload paused without charging overhead", () => {
  const state = initialState();
  const store = new Map();
  const storage = {
    setItem: (key, value) => store.set(key, value),
    getItem: (key) => store.get(key),
  };
  buyUpgrade(state, "plants");
  startShift(state, fixed);
  ringUp(state);
  tick(state, 4, fixed);
  assert.equal(saveState(state, storage), true);
  const loaded = loadState(storage);
  assert.equal(loaded.balance, state.balance);
  assert.equal(loaded.upgrades.plants, 1);
  assert.equal(loaded.shift.remaining, 86);
  assert.equal(loaded.shift.paused, true);
  store.set(SAVE_KEY, "{broken json");
  assert.deepEqual(loadState(storage), initialState());
  store.set(SAVE_KEY, JSON.stringify({ ...state, menu: [] }));
  assert.deepEqual(loadState(storage), initialState());
  assert.equal(
    saveState(state, {
      setItem() {
        throw new Error("disabled");
      },
    }),
    false,
  );
});

test("payment stage survives reload and legacy active orders migrate without losing progress", () => {
  const state = initialState();
  startShift(state, fixed);
  const storage = {
    value: "",
    getItem() {
      return this.value;
    },
    setItem(key, value) {
      this.value = value;
    },
  };
  const order = activeOrder(state);
  submitOrderTotal(state, (order.total / 100).toFixed(2));
  saveState(state, storage);
  let loaded = loadState(storage);
  assert.equal(loaded.shift.queue[0].stage, "change");
  assert.equal(loaded.shift.queue[0].acceptedTotal, order.total);
  assert.equal(loaded.shift.paused, true);
  assert.equal(loaded.balance, 12000);
  delete state.shift.queue[0].stage;
  delete state.shift.queue[0].acceptedTotal;
  saveState(state, storage);
  loaded = loadState(storage);
  assert.equal(loaded.shift.queue[0].stage, "total");
  assert.equal(loaded.shift.queue[0].acceptedTotal, null);
  assert.equal(loaded.balance, 12000);
  state.shift.queue[0].stage = "change";
  state.shift.queue[0].acceptedTotal = 1;
  saveState(state, storage);
  assert.deepEqual(loadState(storage), initialState());
});
