"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/score.js");
const score = globalThis.SG.score;

test("all answers at the first pole put the estimate at the low end", () => {
  const r = score.axisResult([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.ok(r.est < 10, "est should be near 0, got " + r.est);
  assert.strictEqual(r.letterIndex, 0);
  assert.strictEqual(r.close, false);
});

test("all answers at the second pole put the estimate at the high end", () => {
  const r = score.axisResult([7, 7, 7, 7, 7, 7, 7, 7, 7]);
  assert.ok(r.est > 90, "est should be near 100, got " + r.est);
  assert.strictEqual(r.letterIndex, 1);
  assert.strictEqual(r.close, false);
});

test("the SD floor, not the clamp, is what holds a unanimous band open", () => {
  /* Sample SD is 0 here. Without SD_FLOOR the raw half-width would be 0 and
     only the outer clamp would save it, landing exactly on HALF_MIN. Asserting
     >= HALF_MIN therefore proves nothing: the clamp guarantees it. Assert the
     value the floor actually produces. */
  const r = score.axisResult([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const expected = 50 * 1.96 * (score.SD_FLOOR / Math.sqrt(9));
  assert.ok(Math.abs(r.half - expected) < 0.01,
    "expected ~" + expected.toFixed(2) + ", got " + r.half);
  assert.ok(r.half > score.HALF_MIN, "the floor must beat the clamp minimum");
});

test("dead-centre answers are close", () => {
  const r = score.axisResult([4, 4, 4, 4, 4, 4, 4, 4, 4]);
  assert.strictEqual(r.est, 50);
  assert.strictEqual(r.close, true);
});

test("a mixed axis straddling the midline is close", () => {
  const r = score.axisResult([2, 6, 3, 5, 4, 6, 2, 5, 4]);
  assert.strictEqual(r.close, true);
});

test("an axis with no answers is maximally uncertain and centred", () => {
  /* The flow never produces this, but the early return is what stops the
     maths dividing by zero and handing back NaN for every field. */
  const r = score.axisResult([]);
  assert.strictEqual(r.est, 50);
  assert.strictEqual(r.half, score.HALF_MAX);
  assert.strictEqual(r.close, true);
});

test("more items narrow the band", () => {
  const nine = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2]);
  const seventeen = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2]);
  assert.ok(seventeen.half < nine.half, "more evidence must narrow the band");
});

test("an extreme two-item split is clamped to the axis", () => {
  /* Raw half-width here is ~98, so the clamp genuinely binds. Asserting
     <= HALF_MAX on an input that never exceeds it proves nothing. */
  const r = score.axisResult([1, 7]);
  assert.strictEqual(r.half, score.HALF_MAX);
});

test("a high-variance axis is wide but not clamped", () => {
  const r = score.axisResult([1, 7, 1, 7, 1, 7, 1, 7, 1]);
  assert.ok(r.half > 30 && r.half < score.HALF_MAX,
    "expected a wide unclamped band near 34, got " + r.half);
});
