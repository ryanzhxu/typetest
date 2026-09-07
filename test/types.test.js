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

/* Every string anywhere in a type, found by walking rather than by listing.
   A test that names its fields silently stops covering the next field
   somebody adds, and the five long sections were exactly that: added after
   the em-dash guard was written, and eight thousand words wide. */
function allCopy(value, out) {
  out = out || [];
  if (typeof value === "string") { out.push(value); }
  else if (Array.isArray(value)) { value.forEach((v) => allCopy(v, out)); }
  else if (value && typeof value === "object") {
    Object.keys(value).forEach((k) => allCopy(value[k], out));
  }
  return out;
}

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

test("SECTIONS names five sections, each with a key and a heading", () => {
  assert.strictEqual(types.SECTIONS.length, 5);
  types.SECTIONS.forEach((s) => {
    assert.ok(s.key && /^[a-zA-Z]+$/.test(s.key), "bad section key: " + s.key);
    assert.ok(s.heading && s.heading.length > 3, "bad heading for " + s.key);
  });
  const keys = types.SECTIONS.map((s) => s.key);
  assert.strictEqual(new Set(keys).size, 5, "duplicate section key");
});

test("every type carries every section, three real paragraphs each", () => {
  Object.keys(types.byCode).forEach((code) => {
    const t = types.byCode[code];
    types.SECTIONS.forEach((section) => {
      const paragraphs = t[section.key];
      assert.ok(Array.isArray(paragraphs), code + " has no " + section.key);
      assert.strictEqual(paragraphs.length, 3, code + "." + section.key + " needs three paragraphs");
      paragraphs.forEach((p, i) => {
        assert.strictEqual(typeof p, "string", code + "." + section.key + "[" + i + "] is not a string");
        assert.ok(p.trim().length > 0, code + "." + section.key + "[" + i + "] is empty");
        assert.ok(/[.?!]$/.test(p.trim()), code + "." + section.key + "[" + i + "] does not end a sentence");
      });
    });
  });
});

test("no paragraph is reused between types", () => {
  /* Sixteen pages written from a template would pass every other test here
     and be worthless. Any repeated sentence is a copy-paste that escaped. */
  const seen = new Map();
  Object.keys(types.byCode).forEach((code) => {
    types.SECTIONS.forEach((section) => {
      types.byCode[code][section.key].forEach((p) => {
        const previous = seen.get(p);
        assert.ok(!previous, "duplicate paragraph in " + code + " and " + previous + ": " + p.slice(0, 60));
        seen.set(p, code);
      });
    });
  });
});

test("every type name is unique", () => {
  const names = Object.keys(types.byCode).map((c) => types.byCode[c].name);
  assert.strictEqual(new Set(names).size, names.length, "duplicate type name");
});

test("no shipped type copy contains an em-dash", () => {
  Object.keys(types.byCode).forEach((code) => {
    allCopy(types.byCode[code]).forEach((s) => {
      assert.ok(!/[–—]/.test(s), "en/em dash in " + code + ": " + s);
    });
  });
  types.SECTIONS.forEach((s) => {
    assert.ok(!/[–—]/.test(s.heading), "en/em dash in heading: " + s.heading);
  });
});
