import test from "node:test";
import assert from "node:assert/strict";
import { pressKey } from "../src/cashier.js";

test("numpad enters dollar amounts and permits a leading decimal", () => {
  const enter = (keys) => keys.reduce(pressKey, "");
  assert.equal(enter(["1", "2", ".", "5", "0"]), "12.50");
  assert.equal(enter([".", "5", "0"]), "0.50");
  assert.equal(enter(["0", "0", "6", ".", "5"]), "6.5");
  assert.equal(enter(["2", "00"]), "200");
});

test("numpad precision is bounded, and clear and backspace can correct entry", () => {
  assert.equal(pressKey("12.50", "1"), "12.50");
  assert.equal(pressKey("12.5", "."), "12.5");
  assert.equal(pressKey("12345", "6"), "12345");
  assert.equal(pressKey("12.50", "backspace"), "12.5");
  assert.equal(pressKey("12.50", "clear"), "");
  assert.equal(pressKey("", "backspace"), "");
});
