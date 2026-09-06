"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/score.js");
require("../js/items.js");
require("../js/flow.js");
const flowMod = globalThis.SG.flow;
const items = globalThis.SG.items;

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

test("skips are recorded and still advance", () => {
  const f = flowMod.create();
  f.start();
  f.skip();
  assert.strictEqual(f.state().index, 1);
});

test("reset returns to the intro and clears the result", () => {
  const f = flowMod.create();
  runCore(f, 7);
  f.reset();
  assert.strictEqual(f.state().view, "intro");
  assert.strictEqual(f.result(), null);
});
