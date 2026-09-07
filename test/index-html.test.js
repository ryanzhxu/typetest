"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const HTML = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

/* The generator in scripts/build-types.js rewrites index.html by exact string
   surgery. Every assertion below is a thing it depends on. If one of these
   fails, sixteen pages are about to be emitted wrong, silently. */

test("the head carries exactly one pair of generator markers", () => {
  assert.strictEqual(countOf(HTML, "<!-- BUILD:HEAD:START -->"), 1);
  assert.strictEqual(countOf(HTML, "<!-- BUILD:HEAD:END -->"), 1);
  assert.ok(
    HTML.indexOf("<!-- BUILD:HEAD:START -->") < HTML.indexOf("<!-- BUILD:HEAD:END -->"),
    "the start marker must come before the end marker"
  );
});

test("every per-page meta tag sits between the markers", () => {
  const block = HTML.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
  [
    "<title>",
    'name="description"',
    'rel="canonical"',
    'property="og:type"',
    'property="og:url"',
    'property="og:site_name"',
    'property="og:title"',
    'property="og:description"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"'
  ].forEach((tag) => {
    assert.strictEqual(countOf(block, tag), 1, tag + " must appear exactly once inside the markers");
    assert.strictEqual(countOf(HTML, tag), 1, tag + " must not also appear outside the markers");
  });
});

test("there is exactly one bare body tag for the generator to annotate", () => {
  assert.strictEqual(countOf(HTML, "<body>"), 1);
});

test("every fill target exists and is empty", () => {
  ["type-code", "type-name", "type-opening", "type-best", "type-undone", "type-chips", "type-often"]
    .forEach((id) => {
      const re = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)></\\1>', "g");
      const hits = HTML.match(re) || [];
      assert.strictEqual(hits.length, 1, id + " must appear exactly once as an empty element");
    });
});

test("every hidden-flippable element exists exactly once", () => {
  ["view-intro", "view-type", "btn-back-gallery", "share-block", "btn-restart", "type-test-cta"]
    .forEach((id) => {
      const re = new RegExp('<[a-z0-9]+[^>]*\\sid="' + id + '"[^>]*>', "g");
      const hits = HTML.match(re) || [];
      assert.strictEqual(hits.length, 1, id + " must appear exactly once");
    });
});

test("asset paths are relative and countable, so the generator can absolutise them", () => {
  assert.strictEqual(countOf(HTML, 'href="app.css"'), 1);
  assert.strictEqual(countOf(HTML, 'src="js/'), 8);
  assert.strictEqual(countOf(HTML, 'href="/app.css"'), 0, "the root page keeps relative paths so file:// works");
  assert.strictEqual(countOf(HTML, 'src="/js/'), 0);
});

test("the test call to action exists, is hidden by default, and offers the test", () => {
  assert.match(HTML, /<div id="type-test-cta" class="test-cta" hidden>/);
  assert.match(HTML, /id="btn-take-test"/);
});

test("index.html carries no em-dash", () => {
  assert.ok(!HTML.includes("—"), "an em-dash reached index.html");
});
