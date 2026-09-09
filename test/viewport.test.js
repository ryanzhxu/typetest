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
   or the card it lives in.

   The card, not the immediate parent. The report was "the circles are out of
   the border", and the border is the card: a page-only check called that view
   clean while the row hung 14px outside the card on an iPhone 13 Pro. Checking
   the immediate parent instead over-reports, because the dot row deliberately
   runs to the card's edges on a phone, where forty pixels of padding is forty
   pixels the seven targets do not get. The card edge is the line that matters
   and the line the reader sees. */
function escapes() {
  var bad = [];
  var vw = window.innerWidth;
  var docW = document.documentElement.scrollWidth;
  if (docW > vw) { bad.push("the page overflows by " + (docW - vw) + "px"); }

  function boundary(el) {
    var node = el.parentElement;
    while (node && node.tagName !== "MAIN") {
      if (/-card$/.test(String(node.className || "").trim().split(/\s+/)[0] || "")) {
        return node;
      }
      node = node.parentElement;
    }
    return node || document.querySelector("main");
  }

  Array.prototype.forEach.call(document.querySelectorAll("main *"), function (el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || el.hidden) { return; }
    var cls = String(el.className || "").trim().replace(/\s+/g, ".");
    var name = el.tagName.toLowerCase() + (cls ? "." + cls : "");
    if (r.right > vw + 0.5) {
      bad.push(name + " runs " + Math.round(r.right - vw) + "px past the viewport");
    }
    var b = boundary(el);
    if (!b) { return; }
    var p = b.getBoundingClientRect();
    if (r.right > p.right + 0.5 || r.left < p.left - 0.5) {
      bad.push(name + " escapes its "
        + (b.tagName === "MAIN" ? "column" : String(b.className).trim().split(/\s+/)[0]));
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

/* The card sat at y=80 in an 844px viewport and was 398px tall, leaving 366px
   of dead space below it and a scale the thumb had to stretch up for.

   The tolerance is not zero and cannot be. The card is centred inside main, but
   main sits below a header and carries more padding at the bottom than the top,
   so the two viewport-relative gaps differ by that much on purpose. What is
   being caught here is 80 against 366, not 46 against 32. */
test("the question card sits in the middle of the screen, not under the header", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(PAGE_URL);
    await page.click("#btn-start");

    const m = await page.evaluate(() => {
      const r = document.querySelector(".question-card").getBoundingClientRect();
      return {
        above: Math.round(r.top),
        below: Math.round(window.innerHeight - r.bottom),
        scrolls: document.documentElement.scrollHeight > window.innerHeight + 1
      };
    });

    assert.ok(!m.scrolls, "centring must not introduce a scrollbar, and it did");
    assert.ok(Math.abs(m.above - m.below) <= 32,
      "card is not centred: " + m.above + "px above, " + m.below + "px below");
  } finally {
    await browser.close();
  }
});

/* The switcher lives in the footer, and every offered locale appears in it
   whether or not its copy is finished. It used to sit in the header, where
   four locale names each carrying a note stood 156px tall at 320px, pushed the
   question card off the bottom of the screen and made the page scroll.

   Measure the real control rather than a synthetic one: it renders on every
   view except the question. */
SIZES.forEach(function (size) {
  const w = size[0];
  const h = size[1];
  test("the language switcher fits at " + w + "px with every locale offered", { skip: !chromium }, async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.goto(PAGE_URL);

      const m = await page.evaluate(() => {
        const I18N = window.SG.i18n;
        const nav = document.getElementById("lang-switch");
        const de = document.documentElement;
        return {
          offered: I18N.offered().length,
          shown: nav.querySelectorAll("a").length,
          hidden: nav.hidden,
          over: de.scrollWidth - de.clientWidth,
          names: Array.prototype.map.call(nav.querySelectorAll("a"), (a) => {
            const r = a.getBoundingClientRect();
            return { text: a.textContent, w: Math.round(r.width), h: Math.round(r.height) };
          })
        };
      });

      assert.strictEqual(m.hidden, false, "the switcher must show on the intro");
      assert.strictEqual(m.shown, m.offered, "every offered locale must appear");
      assert.strictEqual(m.over, 0, "the page overflows by " + m.over + "px");
      /* A name taller than it is wide means the column collapsed and it is
         wrapping one character per line, which fits and is unreadable. */
      m.names.forEach((n) => {
        assert.ok(n.w >= n.h, "the locale name " + n.text + " wrapped into a " +
          n.w + "x" + n.h + " column");
      });
    } finally {
      await browser.close();
    }
  });
});

test("the switcher is gone from the question view, where the card has to stay centred",
  { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.goto(PAGE_URL);
    await page.click("#btn-start");
    assert.strictEqual(await page.locator(".site-footer").isHidden(), true,
      "the footer must not eat the question view's vertical space");
  } finally {
    await browser.close();
  }
});
