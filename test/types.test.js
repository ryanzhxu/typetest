"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/types.js");
const types = globalThis.SG.types;

const ALL_CODES = [
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"
];

test("all sixteen codes are present and nothing else is", () => {
  const expected = ALL_CODES.slice().sort();
  const actual = Object.keys(types.byCode).sort();
  assert.deepStrictEqual(actual, expected);
});

test("every type has all required fields filled", () => {
  Object.keys(types.byCode).forEach((code) => {
    const t = types.byCode[code];
    ["name", "line", "opening", "best", "undone"].forEach((k) => {
      assert.ok(t[k] && t[k].length > 5, code + " has no " + k);
    });
    assert.strictEqual(t.chips.length, 5, code + " needs five chips");
    assert.ok(t.often.length >= 3, code + " needs at least three names");
  });
});

test("every type name is unique", () => {
  const names = Object.keys(types.byCode).map((c) => types.byCode[c].name);
  assert.strictEqual(new Set(names).size, names.length, "duplicate type name");
});

test("no shipped type copy contains an em-dash", () => {
  Object.keys(types.byCode).forEach((code) => {
    const t = types.byCode[code];
    [t.name, t.line, t.opening, t.best, t.undone].concat(t.chips).forEach((s) => {
      assert.ok(!/[–—]/.test(s), "en/em dash in " + code + ": " + s);
    });
  });
});
