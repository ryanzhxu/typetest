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

const fs = require("node:fs");
const os = require("node:os");
const serve = require("./serve.js");
const stage = require("../scripts/stage.js");

/* The staged site, built by the same script the deploy uses, served over HTTP.
   file:// cannot answer any of the questions this piece is about: what status
   an unknown path returns, whether /enfj is its own document, or what the
   address bar says after finishing. */
let siteDir = null;
let site = null;

test.before(async () => {
  siteDir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-smoke-"));
  stage.stage(siteDir);
  site = await serve.start(siteDir);
});

test.after(async () => {
  if (site) { await site.close(); }
  if (siteDir) { fs.rmSync(siteDir, { recursive: true, force: true }); }
});

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
  "file://: an all-neutral run reaches the reveal with the second-self card, and the share card draws under it",
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
  "file://: a decisive run reaches the reveal with no second-self card, and the share card draws under it",
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

test("the served site answers the status codes the search engines will see", async () => {
  const root = await fetch(site.url + "/");
  assert.strictEqual(root.status, 200);

  const type = await fetch(site.url + "/enfj");
  assert.strictEqual(type.status, 200, "/enfj must be its own document");

  const missing = await fetch(site.url + "/totally-made-up-path");
  assert.strictEqual(missing.status, 404, "an unknown path must 404, not serve the homepage");

  const deep = await fetch(site.url + "/a/b/c");
  assert.strictEqual(deep.status, 404);

  const robots = await fetch(site.url + "/robots.txt");
  assert.strictEqual(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/personality\.ryanxu\.dev\/sitemap\.xml/);

  const sitemap = await fetch(site.url + "/sitemap.xml");
  assert.strictEqual(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.strictEqual((xml.match(/<loc>/g) || []).length, 17, "sitemap must list seventeen URLs");
});

test("the raw HTML of /enfj carries ENFJ's head and copy, with no JavaScript run", async () => {
  const html = await (await fetch(site.url + "/enfj")).text();

  assert.ok(html.includes("<title>Warm Front (ENFJ)</title>"), "title");
  assert.ok(html.includes('<link rel="canonical" href="https://personality.ryanxu.dev/enfj">'), "canonical");
  assert.ok(html.includes('<meta property="og:title" content="Warm Front (ENFJ)">'), "og:title");
  assert.ok(html.includes("The room gets easier when they walk in."), "the line");
  assert.ok(html.includes("Hosts without trying"), "a chip");
  assert.ok(html.includes("Oprah Winfrey"), "a name");
  assert.ok(html.includes("Not affiliated with or endorsed by The Myers-Briggs Company."), "non-affiliation line");

  /* This is what prevents a flash of the intro: the document arrives with the
     intro already hidden and the type view already shown. A test that only
     checked the rendered page would pass even if the intro painted first. */
  assert.match(html, /<section id="view-intro"[^>]*\shidden[^>]*>/, "intro must arrive hidden");
  assert.ok(!/<section id="view-type"[^>]*\shidden[^>]*>/.test(html), "type view must arrive visible");

  assert.ok(!/myers|briggs|mbti/i.test(html.split("</head>")[0]), "the indicator reached the head");

  /* A page served at /enfj cannot reach a relative app.css. */
  assert.ok(html.includes('href="/app.css"'), "generated pages need absolute asset paths");
  assert.ok(!/src="js\//.test(html), "a relative script path survived into a generated page");
});

test("landing on a type URL shows that type with no intro, and offers the test", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/enfj");

    assert.strictEqual(await page.locator("#view-type").isVisible(), true);
    assert.strictEqual(await page.locator("#view-intro").isHidden(), true);
    assert.strictEqual(await page.textContent("#type-code"), "ENFJ");
    assert.strictEqual(await page.textContent("#type-name"), "Warm Front");
    assert.strictEqual(await page.locator("#type-test-cta").isVisible(), true, "the test offer must show");
    assert.strictEqual(await page.locator("#share-block").isHidden(), true);

    assertNoLeakedNumbers(await page.textContent("body"));

    await page.click("#btn-take-test");
    await page.waitForSelector("#view-question:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/", "starting the test must return to the root URL");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("gallery cards are real links, and clicking one changes the URL without losing the page", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/enfj");

    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");

    const hrefs = await page.locator("#gallery-grid a.gallery-card").evaluateAll(
      (els) => els.map((e) => new URL(e.href).pathname)
    );
    assert.strictEqual(hrefs.length, 16, "all sixteen cards must be anchors");
    assert.ok(hrefs.includes("/infj"), "expected a real /infj href, got " + hrefs.join(","));

    await page.click('#gallery-grid a[href="/infj"]');
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/infj");
    assert.strictEqual(await page.textContent("#type-name"), "The Quiet Read");

    await page.goBack();
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/enfj", "Back must return to the page we arrived on");
    assert.strictEqual(await page.textContent("#type-name"), "Warm Front");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("finishing the test leaves the address bar at the result's own URL", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");

    await page.click("#btn-start");
    await answerDecisive(page, 36);
    await page.waitForSelector("#view-reveal:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/", "the reveal is not a shareable page");

    await page.click("#btn-continue");
    await page.waitForSelector("#view-type:not([hidden])");

    const code = await page.textContent("#type-code");
    assert.match(code, /^[EI][NS][TF][JP]$/);
    assert.strictEqual(new URL(page.url()).pathname, "/" + code.toLowerCase());

    /* replaceState, not push: Back must not walk the reveal again. */
    assert.strictEqual(await page.locator("#share-block").isVisible(), true, "the share block must survive");
    assert.strictEqual(await page.locator("#type-test-cta").isHidden(), true, "no test offer on your own result");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("the 404 page is served for an unknown path and is styled and noindexed", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto(site.url + "/no-such-page");
    assert.strictEqual(response.status(), 404);
    const html = await page.content();
    assert.match(html, /name="robots" content="noindex"/);
    assert.ok((await page.textContent("body")).includes("Not affiliated"), "404 keeps the non-affiliation line");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.notStrictEqual(bg, "rgba(0, 0, 0, 0)", "app.css did not load on the 404 page");

    /* .btn sets min-height: 44px, which does not apply to a non-replaced
       inline box without a display. This is the empirical half of that. */
    const box = await page.locator("a.btn").boundingBox();
    assert.ok(box.height >= 44, "the 404 link must meet the 44px target minimum, got " + box.height);
  } finally {
    await browser.close();
  }
});
