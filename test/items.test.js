"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/items.js");
const items = globalThis.SG.items;

function countByAxis(bank) {
  const n = {};
  items.AXES.forEach((a) => { n[a] = 0; });
  bank.forEach((it) => { n[it.axis] += 1; });
  return n;
}

test("there are exactly four axes with two poles each", () => {
  assert.deepStrictEqual(items.AXES, ["EI", "SN", "TF", "JP"]);
  items.AXES.forEach((a) => {
    assert.strictEqual(items.POLES[a].length, 2, a + " needs two poles");
  });
});

test("the core bank is 36 items, nine per axis", () => {
  assert.strictEqual(items.core.length, 36);
  const n = countByAxis(items.core);
  items.AXES.forEach((a) => assert.strictEqual(n[a], 9, a + " has " + n[a]));
});

test("the tiebreak bank is 32 items, eight per axis", () => {
  assert.strictEqual(items.tiebreak.length, 32);
  const n = countByAxis(items.tiebreak);
  items.AXES.forEach((a) => assert.strictEqual(n[a], 8, a + " has " + n[a]));
});

test("every item has two non-empty distinct statements", () => {
  items.core.concat(items.tiebreak).forEach((it, i) => {
    assert.ok(it.a && it.a.length > 3, "item " + i + " has no a");
    assert.ok(it.b && it.b.length > 3, "item " + i + " has no b");
    assert.notStrictEqual(it.a, it.b, "item " + i + " has identical poles");
  });
});

test("no statement is reused anywhere in either bank", () => {
  const seen = new Set();
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!seen.has(s), "duplicate statement: " + s);
      seen.add(s);
    });
  });
});

test("no shipped statement contains an em-dash", () => {
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!/[–—]/.test(s), "en/em dash in: " + s);
    });
  });
});

test("no statement names a letter or the four-letter code", () => {
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!/\b[EISNTFJP]{4}\b/.test(s), "type code leaked into: " + s);
    });
  });
});
