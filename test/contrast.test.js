"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

/* Spec section 6 of the master design requires AA in both themes. Nobody had
   checked it. This reads the shipped values straight out of app.css rather than
   a copy of them, so the check and the site cannot drift apart. */
const css = fs.readFileSync(path.resolve(__dirname, "..", "app.css"), "utf8");

function tokens(selector) {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, "cannot find " + selector + " in app.css");
  const block = css.slice(at, css.indexOf("}", at));
  const out = {};
  block.replace(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g, (m, k, v) => { out[k] = v.toLowerCase(); return m; });
  assert.ok(Object.keys(out).length > 0, selector + " defines no colour tokens");
  return out;
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255)
       + 0.7152 * channel((n >> 8) & 255)
       + 0.0722 * channel(n & 255);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function at(a, b) { return ratio(a, b).toFixed(2); }

/* WCAG AA: 4.5 for body text, 3 for large text and for the boundary of a user
   interface component. */
const TEXT = 4.5;
const UI = 3;

const THEMES = [
  ["dark", tokens(":root {")],
  ["light", tokens(':root[data-theme="light"]')]
];

THEMES.forEach(([name, t]) => {
  test("body text passes AA on both surfaces in the " + name + " theme", () => {
    assert.ok(ratio(t.text, t.ground) >= TEXT, "text on ground is " + at(t.text, t.ground));
    assert.ok(ratio(t.text, t.raised) >= TEXT, "text on raised is " + at(t.text, t.raised));
  });

  test("muted text passes AA on both surfaces in the " + name + " theme", () => {
    assert.ok(ratio(t.muted, t.ground) >= TEXT, "muted on ground is " + at(t.muted, t.ground));
    assert.ok(ratio(t.muted, t.raised) >= TEXT, "muted on raised is " + at(t.muted, t.raised));
  });

  /* Peach and lilac carry the two-types idea and appear as the blend bar and
     the focus ring, which are interface components rather than body text. */
  test("peach and lilac clear the interface threshold in the " + name + " theme", () => {
    ["peach", "lilac"].forEach((k) => {
      assert.ok(ratio(t[k], t.ground) >= UI, k + " on ground is " + at(t[k], t.ground));
      assert.ok(ratio(t[k], t.raised) >= UI, k + " on raised is " + at(t[k], t.raised));
    });
  });

  /* .btn-primary is background: var(--text) with color: var(--ground), so the
     pair runs the other way round from body text. */
  test("the primary button passes AA in the " + name + " theme", () => {
    assert.ok(ratio(t.ground, t.text) >= TEXT, "ground on text is " + at(t.ground, t.text));
  });

  /* The dot marks and the card edges are drawn in border, and an unchosen dot
     is nothing but its border. If that fails, the scale is invisible. */
  test("borders clear the interface threshold in the " + name + " theme", () => {
    assert.ok(ratio(t.border, t.raised) >= UI, "border on raised is " + at(t.border, t.raised));
    assert.ok(ratio(t.border, t.ground) >= UI, "border on ground is " + at(t.border, t.ground));
  });
});

/* The light theme is written twice: once behind prefers-color-scheme for a
   reader who never touches a control, and once behind data-theme. Only one is
   ever exercised by a given reader, so a drift between them would ship
   half-checked. */
test("the two light definitions carry identical values", () => {
  assert.deepStrictEqual(
    tokens(':root:not([data-theme="dark"])'),
    tokens(':root[data-theme="light"]')
  );
});
