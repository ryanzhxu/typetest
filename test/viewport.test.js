"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

/* Same optional-require shape as test/smoke.test.js: a bare checkout can still
   run `npm test`, but CI must never wave a page through that nothing measured. */
let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { chromium = null; }

if (!chromium && process.env.CI) {
  throw new Error(
    "playwright's chromium is unavailable under CI. The viewport tests would " +
    "silently skip and the deploy gate would go green without ever measuring " +
    "a phone. Fix the Playwright/Chromium install step rather than let this skip."
  );
}

const PAGE_URL = "file://" + path.resolve(__dirname, "..", "index.html");

/* 320 is the 2016 iPhone SE, the narrowest thing still in the wild. 390 is the
   iPhone 13 Pro the bug was reported on. 375 sits between them and is the most
   common small phone. */
const SIZES = [[320, 568], [375, 667], [390, 844]];

/* Runs in the page. Reports every element inside main that leaves the viewport
   or its own parent. Escaping the parent is the one that matters: the report
   was circles outside the card, which is a parent overflow long before it is a
   page overflow, and a page-only check would have called that view clean. */
function escapes() {
  var bad = [];
  var vw = window.innerWidth;
  var docW = document.documentElement.scrollWidth;
  if (docW > vw) { bad.push("the page overflows by " + (docW - vw) + "px"); }
  Array.prototype.forEach.call(document.querySelectorAll("main *"), function (el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || el.hidden) { return; }
    var cls = String(el.className || "").trim().replace(/\s+/g, ".");
    var name = el.tagName.toLowerCase() + (cls ? "." + cls : "");
    if (r.right > vw + 0.5) {
      bad.push(name + " runs " + Math.round(r.right - vw) + "px past the viewport");
    }
    var p = el.parentElement.getBoundingClientRect();
    if (r.right > p.right + 0.5 || r.left < p.left - 0.5) {
      bad.push(name + " escapes its parent");
    }
  });
  return bad.filter(function (v, i, all) { return all.indexOf(v) === i; });
}

/* Walks all five views and calls back after each one, so a single browser run
   covers the whole site rather than one view per launch. */
async function walkViews(page, after) {
  await page.goto(PAGE_URL);
  await after("intro");

  await page.click("#btn-nav-sixteen");
  await after("sixteen");
  await page.click("#btn-back-flow");

  await page.click("#btn-start");
  await after("question");

  for (let i = 0; i < 40; i += 1) {
    if (!(await page.isVisible("#view-question"))) { break; }
    await page.evaluate(() => document.querySelectorAll("#q-dots input")[1].click());
    await page.click("#btn-next");
  }
  await after("reveal");

  if (await page.isVisible("#btn-keep-both")) { await page.click("#btn-keep-both"); }
  else { await page.click("#btn-continue"); }
  await after("type");
}

SIZES.forEach(function (size) {
  const w = size[0];
  const h = size[1];
  test("nothing escapes the viewport or its card at " + w + "px", { skip: !chromium }, async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const failures = [];
    try {
      await walkViews(page, async (view) => {
        (await page.evaluate(escapes)).forEach((b) => failures.push(view + ": " + b));
      });
    } finally {
      await browser.close();
    }
    assert.deepStrictEqual(failures, [], "\n" + failures.join("\n"));
  });
});
