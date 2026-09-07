"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

/* Playwright is a pinned devDependency, but stays optional at require-time so
   `npm test` still passes on a bare checkout where `npm install` was never
   run. In CI, though, a missing chromium means the deploy gate is about to
   wave a page through that nothing ever loaded, so that case fails loudly
   instead of skipping. */
let chromium = null;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  chromium = null;
}

if (!chromium && process.env.CI) {
  throw new Error(
    "playwright's chromium is unavailable under CI. The smoke tests would " +
    "silently skip and the deploy gate would go green without ever loading " +
    "the page. Fix the Playwright/Chromium install step rather than let " +
    "this skip."
  );
}

const PAGE_URL = "file://" + path.resolve(__dirname, "..", "index.html");

function trackErrors(page) {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") { errors.push(m.text()); } });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

function assertNoLeakedNumbers(body) {
  assert.ok(!/\d+%/.test(body), "a percentage leaked onto the page");
  assert.ok(!body.includes("±"), "a plus-minus leaked onto the page");
  assert.ok(!/margin/i.test(body), "the word margin leaked onto the page");
}

async function answerNeutral(page, count) {
  for (let i = 0; i < count; i += 1) {
    await page.click("#btn-next");
  }
}

async function answerDecisive(page, count) {
  for (let i = 0; i < count; i += 1) {
    await page.keyboard.press("7");
    await page.click("#btn-next");
  }
}

async function shareCardBlobInfo(page) {
  return page.evaluate(async () => {
    const blob = await window.SG.share.draw(window.__smokeResult);
    return { type: blob.type, size: blob.size };
  });
}

test(
  "an all-neutral run reaches the reveal with the second-self card, and the share card draws under it",
  { skip: !chromium },
  async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const errors = trackErrors(page);

      await page.goto(PAGE_URL);
      /* Capture whatever result renderType() hands to SG.share, without
         touching #btn-share, which would trigger a real download. */
      await page.evaluate(() => {
        const original = window.SG.share.setResult;
        window.SG.share.setResult = function (result) {
          window.__smokeResult = result;
          return original(result);
        };
      });

      await page.click("#btn-start");
      await answerNeutral(page, 36);
      await page.waitForSelector("#view-reveal:not([hidden])");

      const revealBody = await page.textContent("body");
      assertNoLeakedNumbers(revealBody);

      /* Every axis lands dead centre, so the second-self card and both its
         buttons must show, and the plain continue button must not. */
      assert.strictEqual(await page.locator("#second-self-card").isHidden(), false, "expected the second-self card for an all-neutral run");
      assert.strictEqual(await page.locator("#btn-settle").isVisible(), true, "expected the Settle it button");
      assert.strictEqual(await page.locator("#btn-keep-both").isVisible(), true, "expected the Keep both button");
      assert.strictEqual(await page.locator("#btn-continue").isHidden(), true, "continue should be hidden behind the second-self card");

      await page.click("#btn-keep-both");
      await page.waitForSelector("#view-type:not([hidden])");
      const typeBody = await page.textContent("body");
      assertNoLeakedNumbers(typeBody);

      /* This is the branch never exercised outside a Node stub: a real
         canvas drawing the closeAxis split bar, then toBlob producing an
         actual PNG. */
      const blobInfo = await shareCardBlobInfo(page);
      assert.strictEqual(blobInfo.type, "image/png");
      assert.ok(blobInfo.size > 1000, "expected a non-trivial PNG, got " + blobInfo.size + " bytes");

      assert.strictEqual(errors.length, 0, errors.join("\n"));
    } finally {
      await browser.close();
    }
  }
);

test(
  "a decisive run reaches the reveal with no second-self card, and the share card draws under it",
  { skip: !chromium },
  async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const errors = trackErrors(page);

      await page.goto(PAGE_URL);
      await page.evaluate(() => {
        const original = window.SG.share.setResult;
        window.SG.share.setResult = function (result) {
          window.__smokeResult = result;
          return original(result);
        };
      });

      await page.click("#btn-start");
      await answerDecisive(page, 36);
      await page.waitForSelector("#view-reveal:not([hidden])");

      const revealBody = await page.textContent("body");
      assertNoLeakedNumbers(revealBody);

      /* A decisive run must show neither the second-self card nor its two
         buttons, and the plain continue button instead. */
      assert.strictEqual(await page.locator("#second-self-card").isHidden(), true, "did not expect the second-self card for a decisive run");
      assert.strictEqual(await page.locator("#btn-settle").isVisible(), false, "did not expect the Settle it button");
      assert.strictEqual(await page.locator("#btn-keep-both").isVisible(), false, "did not expect the Keep both button");
      assert.strictEqual(await page.locator("#btn-continue").isVisible(), true, "expected the plain continue button");

      await page.click("#btn-continue");
      await page.waitForSelector("#view-type:not([hidden])");
      const typeBody = await page.textContent("body");
      assertNoLeakedNumbers(typeBody);

      /* Same canvas code, but the branch with no closeAxis: no split bar. */
      const blobInfo = await shareCardBlobInfo(page);
      assert.strictEqual(blobInfo.type, "image/png");
      assert.ok(blobInfo.size > 1000, "expected a non-trivial PNG, got " + blobInfo.size + " bytes");

      assert.strictEqual(errors.length, 0, errors.join("\n"));
    } finally {
      await browser.close();
    }
  }
);
