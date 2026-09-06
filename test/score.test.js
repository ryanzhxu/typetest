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

test("unanimous answers still carry a band, never zero width", () => {
  const r = score.axisResult([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.ok(r.half >= score.HALF_MIN, "half should respect the floor");
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

test("skipped answers widen the band", () => {
  const full = score.axisResult([2, 2, 2, 2, 2, 2, 2, 2, 2]);
  const some = score.axisResult([2, 2, 2, 2, 2, 2, null, null, null]);
  assert.ok(some.half > full.half, "skips must widen, got " + some.half + " vs " + full.half);
});

test("all skipped is maximally uncertain and centred", () => {
  const r = score.axisResult([null, null, null, null, null, null, null, null, null]);
  assert.strictEqual(r.est, 50);
  assert.strictEqual(r.half, score.HALF_MAX);
  assert.strictEqual(r.close, true);
});

test("more items narrow the band", () => {
  const nine = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2]);
  const seventeen = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2]);
  assert.ok(seventeen.half < nine.half, "more evidence must narrow the band");
});

test("the band is clamped to the axis", () => {
  const r = score.axisResult([1, 7, 1, 7, 1, 7, 1, 7, 1]);
  assert.ok(r.half <= score.HALF_MAX);
});
