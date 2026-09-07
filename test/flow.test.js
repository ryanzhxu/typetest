"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/score.js");
require("../js/items.js");
require("../js/flow.js");
const flowMod = globalThis.SG.flow;
const items = globalThis.SG.items;
const score = globalThis.SG.score;

/* Answer every question with the same value. */
function runCore(f, value) {
  f.start();
  for (let i = 0; i < items.core.length; i += 1) { f.answer(value); }
}

/* Answer decisively on every axis except the named one, which gets 4s. */
function runCoreCloseOn(f, axis, decisive) {
  f.start();
  for (let i = 0; i < items.core.length; i += 1) {
    const it = f.state().item;
    f.answer(it.axis === axis ? 4 : decisive);
  }
}

test("starts on the intro and moves to the first question", () => {
  const f = flowMod.create();
  assert.strictEqual(f.state().view, "intro");
  f.start();
  assert.strictEqual(f.state().view, "question");
  assert.strictEqual(f.state().index, 0);
  assert.strictEqual(f.state().total, 36);
});

test("thirty-six answers reach the reveal", () => {
  const f = flowMod.create();
  runCore(f, 7);
  assert.strictEqual(f.state().view, "reveal");
});

test("a decisive run produces a four-letter code and no second code", () => {
  const f = flowMod.create();
  runCore(f, 7);
  const r = f.result();
  assert.strictEqual(r.code.length, 4);
  assert.strictEqual(r.secondCode, null);
  assert.strictEqual(r.closeAxis, null);
});

test("answering everything at the first pole gives the first letters", () => {
  const f = flowMod.create();
  runCore(f, 1);
  assert.strictEqual(f.result().code, "ESTJ");
});

test("answering everything at the second pole gives the second letters", () => {
  const f = flowMod.create();
  runCore(f, 7);
  assert.strictEqual(f.result().code, "INFP");
});

test("one indecisive axis becomes the close axis with a second code", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  const r = f.result();
  assert.strictEqual(r.closeAxis, "TF");
  assert.ok(r.secondCode, "expected a second code");
  assert.strictEqual(r.secondCode.length, 4);
  assert.notStrictEqual(r.secondCode, r.code);
  /* The two codes differ in exactly one position. */
  let diff = 0;
  for (let i = 0; i < 4; i += 1) { if (r.code[i] !== r.secondCode[i]) { diff += 1; } }
  assert.strictEqual(diff, 1);
});

test("settling serves eight more items on the close axis only", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  f.settle();
  assert.strictEqual(f.state().view, "question");
  assert.strictEqual(f.state().total, 8);
  for (let i = 0; i < 8; i += 1) {
    assert.strictEqual(f.state().item.axis, "TF", "tiebreak item " + i + " off-axis");
    f.answer(7);
  }
  assert.strictEqual(f.state().view, "reveal");
});

test("a decisive tiebreak clears the close flag", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  f.settle();
  for (let i = 0; i < 8; i += 1) { f.answer(7); }
  const r = f.result();
  assert.strictEqual(r.closeAxis, null);
  assert.strictEqual(r.secondCode, null);
});

test("keeping both preserves the second code and opens the type page", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  const before = f.result().secondCode;
  f.keepBoth();
  assert.strictEqual(f.state().view, "type");
  assert.strictEqual(f.result().secondCode, before);
});

test("a skip records a missing answer, it does not silently drop the item", () => {
  /* Comparing a skipped run against a fully-answered run is NOT enough. The
     band widens merely because n fell from 9 to 8 via se = sd/sqrt(n), so a
     skip() that dropped the item entirely still passes such a test (12.13 vs
     a baseline 11.43). Pin the exact half-width instead: it is reachable only
     if the null was recorded AND SKIP_PENALTY was applied to it. */
  const f = flowMod.create();
  f.start();
  let done = false;
  for (let i = 0; i < items.core.length; i += 1) {
    if (f.state().item.axis === "EI" && !done) { f.skip(); done = true; }
    else { f.answer(7); }
  }
  const r = f.result();

  const expected = 50 * 1.96 * (score.SD_FLOOR / Math.sqrt(8)) + score.SKIP_PENALTY;
  assert.ok(Math.abs(r.axes.EI.half - expected) < 0.01,
    "expected ~" + expected.toFixed(2) + ", got " + r.axes.EI.half +
    "; a dropped skip would give ~" + (expected - score.SKIP_PENALTY).toFixed(2));

  const full = flowMod.create();
  full.start();
  for (let i = 0; i < items.core.length; i += 1) { full.answer(7); }
  assert.strictEqual(r.axes.SN.half, full.result().axes.SN.half,
    "a skip must not touch another axis");
});

test("when two axes are close, the one nearer the midline is chosen", () => {
  /* No other test ever makes two axes close at once, so nearest-50 selection
     is otherwise unverified. TF sits exactly on 50, SN is close but offset. */
  const f = flowMod.create();
  f.start();
  const seen = { EI: 0, SN: 0, TF: 0, JP: 0 };
  for (let i = 0; i < items.core.length; i += 1) {
    const axis = f.state().item.axis;
    seen[axis] += 1;
    if (axis === "TF") { f.answer(4); }
    else if (axis === "SN") { f.answer(seen.SN <= 5 ? 4 : 5); }
    else { f.answer(7); }
  }
  const r = f.result();
  assert.ok(r.axes.TF.close && r.axes.SN.close, "both axes must be close here");
  assert.ok(Math.abs(r.axes.SN.est - 50) > Math.abs(r.axes.TF.est - 50),
    "SN must be the further of the two");
  assert.strictEqual(r.closeAxis, "TF");
});

test("an exact tie resolves deterministically to the earlier axis", () => {
  /* Guards the strict `<` in the selection loop. With `<=` the later axis
     would win and every other test would still pass. */
  const f = flowMod.create();
  f.start();
  for (let i = 0; i < items.core.length; i += 1) {
    const axis = f.state().item.axis;
    f.answer(axis === "EI" || axis === "JP" ? 4 : 7);
  }
  const r = f.result();
  assert.ok(r.axes.EI.close && r.axes.JP.close, "both axes must be close here");
  assert.strictEqual(r.axes.EI.est, r.axes.JP.est, "this must be an exact tie");
  assert.strictEqual(r.closeAxis, "EI", "ties go to the earlier entry in AXES");
});

test("reset returns to the intro and clears the result", () => {
  const f = flowMod.create();
  runCore(f, 7);
  f.reset();
  assert.strictEqual(f.state().view, "intro");
  assert.strictEqual(f.result(), null);
});

test("back steps to the previous question and hands over the answer it undid", () => {
  const f = flowMod.create();
  f.start();
  const first = f.state().item;
  f.answer(6);
  assert.strictEqual(f.state().index, 1);

  assert.strictEqual(f.back(), 6, "back must return the answer it removed");
  assert.strictEqual(f.state().index, 0);
  assert.strictEqual(f.state().item, first, "back must land on the same question");
});

test("back on a skipped question returns null, not undefined", () => {
  const f = flowMod.create();
  f.start();
  f.skip();
  assert.strictEqual(f.back(), null);
});

test("there is nothing behind the first question", () => {
  const f = flowMod.create();
  f.start();
  assert.strictEqual(f.canBack(), false);
  assert.strictEqual(f.back(), null);
  assert.strictEqual(f.state().index, 0, "a refused back must not move the index");
});

test("an answer that was taken back does not reach the score", () => {
  /* The whole point of back: the discarded answer must leave no trace. A run
     that answers 1, takes it back and answers 7 must land exactly where a run
     that only ever answered 7 lands. */
  const undone = flowMod.create();
  undone.start();
  for (let i = 0; i < items.core.length - 1; i += 1) {
    undone.answer(1);
    undone.back();
    undone.answer(7);
  }
  undone.answer(7);

  const clean = flowMod.create();
  runCore(clean, 7);

  assert.strictEqual(undone.state().view, "reveal");
  assert.deepStrictEqual(undone.result().axes, clean.result().axes);
  assert.strictEqual(undone.result().code, clean.result().code);
});

test("back cannot walk out of a tiebreak into the finished core run", () => {
  /* The core answers are what the result was computed from. Popping one from
     inside a tiebreak would leave the two disagreeing. */
  const f = flowMod.create();
  runCoreCloseOn(f, "EI", 7);
  assert.strictEqual(f.canSettle(), true);
  f.settle();
  assert.strictEqual(f.state().view, "question");
  assert.strictEqual(f.canBack(), false, "the first tiebreak question has nothing behind it");
  assert.strictEqual(f.back(), null);

  f.answer(7);
  assert.strictEqual(f.canBack(), true, "inside the tiebreak, back works normally");
  assert.strictEqual(f.back(), 7);
});

test("back is refused outside the question view", () => {
  const f = flowMod.create();
  assert.strictEqual(f.canBack(), false, "on the intro");
  runCore(f, 7);
  assert.strictEqual(f.state().view, "reveal");
  assert.strictEqual(f.canBack(), false, "on the reveal");
  assert.strictEqual(f.back(), null);
  assert.strictEqual(f.result().code, "INFP", "back must not disturb a finished result");
});

test("the last answer of a run is final, because it is what computes the result", () => {
  /* Answering the final question moves straight to the reveal, and back is a
     question-view move. Un-computing a finished result to reopen one answer
     would mean the reveal could be entered and left with different numbers
     behind it. The reader can still revise question thirty-six before
     answering it, and start over afterwards. */
  const f = flowMod.create();
  f.start();
  for (let i = 0; i < items.core.length - 1; i += 1) { f.answer(7); }
  assert.strictEqual(f.canBack(), true, "the last question can still be revised before it is answered");

  f.answer(1);
  assert.strictEqual(f.state().view, "reveal");
  assert.strictEqual(f.canBack(), false);
  assert.strictEqual(f.back(), null);
});
