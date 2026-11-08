import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  startShift,
  createOrder,
  tick,
  activeOrder,
  laneQueue,
  selectLane,
  submitOrderTotal,
  serveOrder,
  finishShift,
  referencePrice,
  footTraffic,
  itemCost,
  loadState,
  saveState,
} from "../src/game.js";

const fixed = () => 0.5;
const seed = (value) => () =>
  (value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296;
const priceAt = (state, factor) =>
  state.menu.forEach(
    (item) =>
      (item.price = Math.round((referencePrice(item) * factor) / 25) * 25),
  );
function sample(state, count = 1600) {
  startShift(state, fixed);
  const random = seed(73);
  const result = { bought: 0, units: 0, extras: 0, profiles: {} };
  for (let index = 0; index < count; index++) {
    const order = createOrder(state, random);
    const profile = (result.profiles[order.profile] ??= {
      visitors: 0,
      bought: 0,
    });
    profile.visitors++;
    if (order.stage === "declined") continue;
    result.bought++;
    profile.bought++;
    result.units += order.lines.reduce((sum, line) => sum + line.qty, 0);
    result.extras += order.lines
      .filter((line) => ["fries", "lemonade"].includes(line.id))
      .reduce((sum, line) => sum + line.qty, 0);
  }
  return result;
}

test("three independent FIFO lines can fill to nine people; full lines turn visitors away", () => {
  const state = initialState();
  state.upgrades.seating = 3;
  state.upgrades.sign = 3;
  startShift(state, fixed);
  assert.equal(state.shift.queue.length, 3);
  for (let lane = 0; lane < 3; lane++)
    assert.equal(laneQueue(state, lane).length, 1);
  for (let index = 0; index < 140; index++) {
    tick(state, 0.25, fixed);
    assert.ok(state.shift.queue.length <= 9);
    for (let lane = 0; lane < 3; lane++)
      assert.ok(laneQueue(state, lane).length <= 3);
  }
  assert.equal(state.shift.queue.length, 9);
  assert.ok(state.shift.turnedAway > 0);
});

test("choose any front customer, preserve FIFO, and finish payment before changing lines", () => {
  const state = initialState();
  startShift(state, fixed);
  const firstLane = laneQueue(state, 0)[0];
  state.shift.queue.push(createOrder(state, fixed, 1));
  const secondInLine = laneQueue(state, 1)[1];
  assert.equal(selectLane(state, 1), null);
  const order = activeOrder(state);
  assert.equal(order.lane, 1);
  assert.equal(
    submitOrderTotal(state, (order.total / 100).toFixed(2)).ok,
    true,
  );
  assert.match(selectLane(state, 2), /Finish giving/);
  assert.equal(activeOrder(state).id, order.id);
  assert.equal(
    serveOrder(state, ((order.cash - order.total) / 100).toFixed(2)).ok,
    true,
  );
  assert.equal(activeOrder(state).id, secondInLine.id);
  assert.equal(laneQueue(state, 0)[0].id, firstLane.id);
  state.shift.paused = true;
  assert.match(selectLane(state, 2), /Resume/);
});

test("lower prices raise conversion and units per basket across a seeded customer population", () => {
  const cheap = initialState();
  cheap.day = 4;
  priceAt(cheap, 0.7);
  const ordinary = initialState();
  ordinary.day = 4;
  priceAt(ordinary, 1);
  const premium = initialState();
  premium.day = 4;
  priceAt(premium, 1.8);
  const low = sample(cheap),
    medium = sample(ordinary),
    high = sample(premium);
  assert.ok(low.bought > medium.bought);
  assert.ok(medium.bought > high.bought * 3);
  assert.ok(low.units / low.bought > (medium.units / medium.bought) * 1.25);
  assert.ok(medium.units / medium.bought > high.units / high.bought);
  assert.ok(high.profiles["Treat-yourself"].bought > 0);
  assert.equal(high.profiles["Bargain hunter"].bought, 0);
});

test("expensive sides are skipped even when the burger is affordable", () => {
  const state = initialState();
  priceAt(state, 0.7);
  state.menu
    .filter((item) => item.kind !== "burger")
    .forEach((item) => (item.price = 3000));
  const result = sample(state);
  assert.equal(result.bought, 1600);
  assert.equal(result.extras, 0);
});

test("price refusals are visible briefly and never credit sales or consume ingredients", () => {
  const state = initialState();
  state.menu.forEach((item) => (item.price = 3000));
  startShift(state, fixed);
  assert.ok(state.shift.queue.every((order) => order.stage === "declined"));
  assert.ok(activeOrder(state).quote.includes("I’ll pass"));
  assert.equal(submitOrderTotal(state, "30").ok, false);
  assert.equal(serveOrder(state, "10").ok, false);
  state.shift.paused = true;
  const snapshot = JSON.stringify(state);
  tick(state, 4, fixed);
  assert.equal(JSON.stringify(state), snapshot);
  state.shift.paused = false;
  const events = tick(state, 4, fixed);
  assert.ok(
    events.some((event) => event.type === "rejected" && event.count === 3),
  );
  assert.equal(state.shift.rejected, 3);
  assert.equal(state.shift.lost, 0);
  assert.equal(state.shift.revenue, 0);
  assert.equal(state.shift.costs, 0);
  assert.equal(state.balance, 12000);
  assert.ok(state.shift.notice.text.includes("I’ll pass"));
  const report = finishShift(state);
  assert.equal(report.rejected, 3);
  assert.equal(report.lost, 0);
  assert.equal(report.profit, -1200);
});

test("closing distinguishes visible refusals from customers still waiting to reach the menu", () => {
  const state = initialState();
  state.menu.forEach((item) => (item.price = 3000));
  startShift(state, fixed);
  state.shift.queue.push(createOrder(state, fixed, 0));
  const report = finishShift(state);
  assert.equal(report.visitors, 4);
  assert.equal(report.rejected, 3);
  assert.equal(report.lost, 1);
  assert.equal(report.served, 0);
});

test("kitchen savings leave willingness to pay unchanged; signs increase actual arrivals", () => {
  const normal = initialState(),
    efficient = initialState();
  efficient.upgrades.kitchen = 3;
  assert.ok(
    itemCost(efficient.menu[0], efficient) < itemCost(normal.menu[0], normal),
  );
  assert.deepEqual(sample(normal), sample(efficient));
  const state = initialState();
  const traffic = footTraffic(state);
  state.upgrades.sign = 1;
  assert.ok(Math.abs(footTraffic(state) / traffic - 1.18) < 1e-10);
  const withSign = initialState();
  withSign.upgrades.sign = 3;
  withSign.upgrades.seating = 3;
  const without = initialState();
  without.upgrades.seating = 3;
  startShift(withSign, fixed);
  startShift(without, fixed);
  for (let i = 0; i < 100; i++) {
    tick(withSign, 0.25, fixed);
    tick(without, 0.25, fixed);
  }
  assert.ok(withSign.shift.arrived > without.shift.arrived);
});

test("daily reports reconcile every visitor and separate price, patience, and capacity losses", () => {
  const state = initialState();
  state.upgrades.sign = 3;
  state.upgrades.seating = 3;
  startShift(state, fixed);
  for (let i = 0; i < 360; i++) tick(state, 0.25, fixed);
  const report = state.lastReport;
  assert.equal(
    report.visitors,
    report.served + report.rejected + report.lost + report.turnedAway,
  );
  assert.ok(report.lost > 0);
  assert.ok(report.turnedAway > 0);
  assert.equal(state.balance, 12000 + report.profit);
});

test("saves keep the selected lane and payment; earlier single-queue saves migrate safely", () => {
  const state = initialState();
  startShift(state, fixed);
  selectLane(state, 2);
  const order = activeOrder(state);
  submitOrderTotal(state, (order.total / 100).toFixed(2));
  const storage = {
    value: "",
    getItem() {
      return this.value;
    },
    setItem(key, value) {
      this.value = value;
    },
  };
  saveState(state, storage);
  let loaded = loadState(storage);
  assert.equal(loaded.shift.activeLane, 2);
  assert.equal(activeOrder(loaded).id, order.id);
  assert.equal(activeOrder(loaded).stage, "change");
  assert.equal(loaded.shift.paused, true);
  const legacy = initialState();
  startShift(legacy, fixed);
  delete legacy.shift.activeLane;
  delete legacy.shift.rejected;
  delete legacy.shift.turnedAway;
  legacy.shift.queue.forEach((item) => delete item.lane);
  saveState(legacy, storage);
  loaded = loadState(storage);
  assert.deepEqual(
    loaded.shift.queue.map((item) => item.lane),
    [0, 1, 2],
  );
  assert.equal(loaded.balance, legacy.balance);
  assert.equal(loaded.shift.rejected, 0);
});
