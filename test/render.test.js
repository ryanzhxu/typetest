"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/render.js");
const render = globalThis.SG.render;

/* js/flow.js and js/score.js speak pole space, where 1 is the first pole and 7
   the second. The screen speaks agreement, where 1 is Strongly agree. On an
   item showing the second pole those two run in opposite directions, and this
   is the only place in the codebase that knows it. */
test("a shown first pole passes straight through", () => {
  const item = { show: "a" };
  [1, 2, 3, 4, 5, 6, 7].forEach((v) => {
    assert.strictEqual(render.flip(v, item), v);
  });
});

test("a shown second pole turns the value over", () => {
  const item = { show: "b" };
  assert.strictEqual(render.flip(1, item), 7, "strongly agreeing with the second pole is the second pole");
  assert.strictEqual(render.flip(7, item), 1);
  assert.strictEqual(render.flip(2, item), 6);
  assert.strictEqual(render.flip(4, item), 4, "the middle is the middle either way");
});

test("turning it over twice returns the value the reader pressed", () => {
  const item = { show: "b" };
  [1, 2, 3, 4, 5, 6, 7].forEach((v) => {
    assert.strictEqual(render.flip(render.flip(v, item), item), v);
  });
});

test("a skip stays a skip", () => {
  assert.strictEqual(render.flip(null, { show: "b" }), null);
  assert.strictEqual(render.flip(null, { show: "a" }), null);
  assert.strictEqual(render.flip(null, null), null);
});
