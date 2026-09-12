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
require("../js/ns.js");
require("../js/i18n.js");
require("../js/locale-en.js");
require("../js/locale-zh-cn.js");
require("../js/locale-zh-tw.js");
require("../js/locale-zh-hk.js");
require("../js/types.js");
require("../js/items.js");
const types = globalThis.SG.types;

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

/* Choosing a dot never commits on its own: each iteration picks the dot,
   then presses Next to record it and move to the following question. */
async function answerDot(page, value, count) {
  for (let i = 0; i < count; i += 1) {
    await page.click('#q-dots input[value="' + value + '"]');
    await page.click("#btn-next");
  }
}

/* Dot 4 is "Somewhere in between": a real answer that lands dead centre, not a skip. */
async function answerNeutral(page, count) {
  await answerDot(page, 4, count);
}

/* Balanced keying means dot 7 is not the same answer twice running. On an item
   that shows its second pole, dot 7 is Strongly disagree and records the FIRST
   pole. A run that wants one consistent pole therefore has to ask which dot
   means that pole on the question actually on screen, rather than pressing the
   same number thirty-six times. Dot 4 needs no such care: the middle is the
   middle either way, which is why answerNeutral above is still a plain loop. */
const FLIPPED_TEXT = new Set(
  globalThis.SG.items.core
    .concat(globalThis.SG.items.tiebreak)
    .filter((it) => it.show === "b")
    .map((it) => it.b)
);

async function answerAtPole(page, pole, count) {
  for (let i = 0; i < count; i += 1) {
    const shown = (await page.textContent("#q-statement")).trim();
    const dot = FLIPPED_TEXT.has(shown) ? 8 - pole : pole;
    await page.click('#q-dots input[value="' + dot + '"]');
    await page.click("#btn-next");
  }
}

async function answerDecisive(page, count) {
  await answerAtPole(page, 7, count);
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
  /* redirect: "manual", so a 3xx is visible. fetch follows redirects by
     default, which is how the site shipped with every canonical, every
     sitemap entry and every gallery href pointing at a URL that 308s
     elsewhere: /enfj answered 200 to a following request the whole time.
     A canonical that does not resolve to itself is the one thing this piece
     exists to get right, so assert the status code the crawler sees. */
  const root = await fetch(site.url + "/", { redirect: "manual" });
  assert.strictEqual(root.status, 200, "/ must be 200 directly, not a redirect");

  const type = await fetch(site.url + "/enfj", { redirect: "manual" });
  assert.strictEqual(type.status, 200, "/enfj must be its own document, reached with no redirect");

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
  /* One root plus sixteen types, once per locale a search engine is told
     about. Derived rather than hard-coded: this number is meant to move the
     day a locale's meta.complete flips, and it must not move on any other
     day. */
  const want = globalThis.SG.i18n.completed().length * 17;
  assert.strictEqual((xml.match(/<loc>/g) || []).length, want,
    "sitemap must list seventeen URLs for each of the " +
    globalThis.SG.i18n.completed().length + " indexed locales");
});

test("the raw HTML of /enfj carries ENFJ's head and copy, with no JavaScript run", async () => {
  const html = await (await fetch(site.url + "/enfj")).text();

  assert.ok(html.includes("<title>ENFJ (Warm Front)</title>"), "title");
  assert.ok(html.includes('<link rel="canonical" href="https://personality.ryanxu.dev/enfj">'), "canonical");
  assert.ok(html.includes('<meta property="og:title" content="ENFJ (Warm Front)">'), "og:title");
  assert.ok(html.includes("The room gets easier when they walk in."), "the line");
  assert.ok(html.includes("Hosts without trying"), "a chip");
  assert.ok(html.includes("Oprah Winfrey"), "a name");

  /* This is what prevents a flash of the intro: the document arrives with the
     intro already hidden and the type view already shown. A test that only
     checked the rendered page would pass even if the intro painted first. */
  assert.match(html, /<section id="view-intro"[^>]*\shidden[^>]*>/, "intro must arrive hidden");
  assert.ok(!/<section id="view-type"[^>]*\shidden[^>]*>/.test(html), "type view must arrive visible");

  assert.ok(!/myers|briggs|mbti/i.test(html.split("</head>")[0]), "the indicator reached the head");

  /* A page served at /enfj cannot reach a relative app.css. The ?v= is the
     build's own content hash, from scripts/stage.js: it is what stops this
     page ever loading the last build's stylesheet out of the browser cache. */
  assert.match(html, /href="\/app\.css\?v=[0-9a-f]{12}"/, "generated pages need absolute, versioned asset paths");
  assert.ok(!/src="js\//.test(html), "a relative script path survived into a generated page");

  /* A sitemap is a hint. Links are how the sixteen pages actually get
     crawled, and a crawler does not run the gallery-building JavaScript. */
  assert.ok(html.includes('<a class="gallery-card" href="/infj">'), "no crawlable link to /infj");
  assert.strictEqual(
    (html.match(/<a class="gallery-card" href="\/[a-z]{4}">/g) || []).length, 16,
    "every page must link to all sixteen"
  );
});

test("the raw HTML of the root page carries the sixteen links too", async () => {
  const html = await (await fetch(site.url + "/")).text();
  assert.ok(html.includes('<a class="gallery-card" href="/infj">'), "no crawlable link to /infj");
  assert.strictEqual(
    (html.match(/<a class="gallery-card" href="\/[a-z]{4}">/g) || []).length, 16,
    "/ is the page a crawler reaches first and must link to all sixteen"
  );
  /* The root alone keeps relative asset paths, so index.html still opens
     from the filesystem. Generating it must not have changed that. The
     leading slash is the whole point of the assertion, so match on its
     absence rather than on the string: the ?v= build stamp is expected. */
  assert.match(html, /href="app\.css\?v=[0-9a-f]{12}"/, "the root must keep relative asset paths");
  assert.ok(html.includes("<title>Personality</title>"), "the root must keep its own head");
  assert.ok(!html.includes("data-initial-type"), "the root is not a type page");
});

test("landing on a type URL shows that type with no intro, and offers the test", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/enfj");

    /* Nothing changed under the reader, so nothing may take focus. Without
       the first-render guard in render(), focus lands on the h2 on every
       deep-linked load, with no user action at all. */
    assert.strictEqual(
      await page.evaluate(() => document.activeElement.tagName), "BODY",
      "a deep-linked page must not move focus on its first paint"
    );

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
    assert.strictEqual(hrefs.length, 16, "all sixteen cards must be anchors, and only sixteen");
    assert.strictEqual(new Set(hrefs).size, 16, "the static cards and the rendered ones were both kept");
    assert.ok(hrefs.includes("/infj"), "expected a real /infj href, got " + hrefs.join(","));

    /* A plain click on the anchor must be intercepted client-side, not turn
       into a full page load. Now that every type has its own real, correctly
       rendering page, a full reload to /infj would look identical in the
       DOM: same URL, same type shown. The marker is the only thing that
       tells the two apart, because a full load discards window. */
    await page.evaluate(() => { window.__navMarker = 1; });

    await page.click('#gallery-grid a[href="/infj"]');
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/infj");
    assert.strictEqual(await page.textContent("#type-name"), "The Quiet Read");
    assert.strictEqual(
      await page.evaluate(() => window.__navMarker), 1,
      "a plain click must be intercepted and rendered in place, not navigate"
    );

    /* This one IS a view change under the reader, so focus must move. */
    assert.deepStrictEqual(
      await page.evaluate(() => [document.activeElement.tagName, document.activeElement.id]),
      ["H2", "type-code"],
      "a card click must move focus to the new heading"
    );

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

    /* The plan justifies intercepting plain gallery clicks on the grounds
       that a full page load would throw away a finished result and its
       share card. Browse to some other type, then Back, and confirm this is
       still the reader's own result, not a fresh reload of that type. */
    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");
    const otherHref = await page.locator("#gallery-grid a.gallery-card").evaluateAll(
      (els, ownCode) => els.map((e) => new URL(e.href).pathname).find((p) => p !== "/" + ownCode),
      code.toLowerCase()
    );
    await page.click('#gallery-grid a[href="' + otherHref + '"]');
    await page.waitForSelector("#view-type:not([hidden])");

    await page.goBack();
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(await page.textContent("#type-code"), code, "Back must return to the reader's own result");
    assert.strictEqual(await page.locator("#share-block").isVisible(), true, "still their result, share block visible");
    assert.strictEqual(await page.locator("#type-test-cta").isHidden(), true, "still their result, no test offer");

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
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.notStrictEqual(bg, "rgba(0, 0, 0, 0)", "app.css did not load on the 404 page");

    /* This checks the rendered target size, nothing more. It does not and
       cannot prove the `display: inline-block` declaration in .btn: the
       link's parent is a flex container, which already blockifies it. The
       assertion still bites, because a genuinely inline box would report a
       content box of roughly 24px, padding not counting toward its height. */
    const box = await page.locator("a.btn").boundingBox();
    assert.ok(box.height >= 44, "the 404 link must meet the 44px target minimum, got " + box.height);
  } finally {
    await browser.close();
  }
});

test("the tab title travels with the URL", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);

    /* The tab, the bookmark name and every entry in the Back menu are this
       string. A URL that says /infj under a tab that says ENFJ is wrong on
       all three surfaces at once. */
    await page.goto(site.url + "/enfj");
    assert.strictEqual(await page.title(), "ENFJ (Warm Front)", "a deep-linked page names its own type");

    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");
    await page.click('#gallery-grid a[href="/infj"]');
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/infj");
    assert.strictEqual(await page.title(), "INFJ (The Quiet Read)", "the title must follow a gallery click");

    await page.goBack();
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/enfj");
    assert.strictEqual(await page.title(), "ENFJ (Warm Front)", "Back must restore the title, not only the view");

    await page.click("#btn-take-test");
    await page.waitForSelector("#view-question:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/");
    assert.strictEqual(await page.title(), "Personality", "the test itself is the root page");

    await answerDecisive(page, 36);
    await page.waitForSelector("#view-reveal:not([hidden])");
    await page.click("#btn-continue");
    await page.waitForSelector("#view-type:not([hidden])");

    const code = await page.textContent("#type-code");
    const name = await page.textContent("#type-name");
    assert.strictEqual(new URL(page.url()).pathname, "/" + code.toLowerCase());
    assert.strictEqual(
      await page.title(), code + " (" + name + ")",
      "a finished result must name its own type, not the site"
    );
    assert.ok(!/myers|briggs|mbti/i.test(await page.title()), "the indicator reached a title");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("returning to the intro puts the address bar back at the root", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);

    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await answerDecisive(page, 36);
    await page.waitForSelector("#view-reveal:not([hidden])");
    await page.click("#btn-continue");
    await page.waitForSelector("#view-type:not([hidden])");
    const code = await page.textContent("#type-code");
    assert.strictEqual(new URL(page.url()).pathname, "/" + code.toLowerCase());

    /* Back out of the gallery onto a result, which already owns this URL.
       This checks the end state, plus the history length, which is what
       catches a push where a replace belongs.

       It does NOT cover the flow.state().view === "intro" guard in
       btnBackFlow, and no test here does. That guard is reachable, and this
       is the sequence: deep link /enfj, take the test, answer a few, press
       browser Back to return to /enfj, then See all sixteen, then Back. The
       flow is on the question view, so the guard blocks the rewrite and the
       question view is left sitting under /enfj titled "ENFJ (Warm Front)".
       Measured, not reasoned about.

       That mismatch is what btnBackFlow did before this piece touched it, so
       the guard preserves the old behavior on that path rather than adding a
       new fault. It is a known follow-up, and the guard stays because the
       brief specified it. Do not read the assertions below as covering it. */
    const lenOnResult = await page.evaluate(() => history.length);
    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");
    await page.click("#btn-back-flow");
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(
      new URL(page.url()).pathname, "/" + code.toLowerCase(),
      "Back to a result must leave the result's own URL up"
    );
    assert.strictEqual(
      await page.evaluate(() => history.length), lenOnResult,
      "browsing to the gallery and back must not add a history entry"
    );

    /* Start over shows the intro. Leaving /infp up means a reload hands back
       the INFP type page instead of the test the reader just asked for. */
    const lenBefore = await page.evaluate(() => history.length);
    await page.click("#btn-restart");
    await page.waitForSelector("#view-intro:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/", "Start over must not leave the result's URL up");
    assert.strictEqual(await page.title(), "Personality");
    assert.strictEqual(
      await page.evaluate(() => history.length), lenBefore,
      "Start over must replace, not push: Back may not walk into the discarded result"
    );

    /* Same problem by the other route: deep link, gallery, Back. */
    await page.goto(site.url + "/enfj");
    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");
    await page.click("#btn-back-flow");
    await page.waitForSelector("#view-intro:not([hidden])");
    assert.strictEqual(
      new URL(page.url()).pathname, "/",
      "Back out of the gallery to the intro must not leave /enfj up"
    );
    assert.strictEqual(await page.title(), "Personality");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

/* The heading takes focus when a view changes under the reader, and that is
   right. On the very first paint nothing has changed and nobody has acted, so
   the ring drawn there is not focus, it is a mark the reader did not ask for
   and cannot explain. It cleared on their first click, which read as a fault.
   Both the root and a deep-linked type page are checked: the type page had
   this exemption already, the root is the one that regressed. */
test("the first paint of a page never steals focus onto the heading", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    for (const p of ["/", "/enfj"]) {
      const page = await browser.newPage();
      const errors = trackErrors(page);
      await page.goto(site.url + p);
      await page.waitForSelector(".view:not([hidden])");
      assert.strictEqual(
        await page.evaluate(() => document.activeElement.tagName), "BODY",
        p + " moved focus on first paint"
      );
      assert.strictEqual(errors.length, 0, errors.join("\n"));
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

/* The sixteen one-liners are not the same length, so some cards wrap to two
   lines and some do not. Nothing about that should change a card's size. */
test("all sixteen gallery cards render at the same size", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(site.url + "/");
    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");

    const boxes = await page.locator("#gallery-grid a.gallery-card").evaluateAll(
      (els) => els.map((e) => {
        const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
    );
    assert.strictEqual(boxes.length, 16, "expected sixteen cards");

    /* At least one card must wrap, or the test would pass on a page where
       every one-liner happened to fit and prove nothing. */
    const lines = await page.locator("#gallery-grid .gallery-line").evaluateAll(
      (els) => els.map((e) => Math.round(e.getBoundingClientRect().height))
    );
    assert.ok(
      new Set(lines).size > 1,
      "no one-liner wrapped at this width, so this test cannot see the bug it guards"
    );

    const heights = new Set(boxes.map((b) => b.h));
    assert.strictEqual(
      heights.size, 1,
      "cards differ in height: " + Array.from(heights).sort((a, b) => a - b).join(", ")
    );
    const widths = new Set(boxes.map((b) => b.w));
    assert.strictEqual(widths.size, 1, "cards differ in width: " + Array.from(widths).join(", "));
  } finally {
    await browser.close();
  }
});

test("the seven dots only select; Next commits the choice and the progress bar tracks it", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    assert.strictEqual(await page.locator("#q-dots input").count(), 7, "seven dots, one per value");
    assert.deepStrictEqual(
      await page.locator("#q-dots input").evaluateAll((els) => els.map((e) => e.value)),
      ["1", "2", "3", "4", "5", "6", "7"],
      "the dots must carry the same 1-7 the score is written against"
    );
    assert.strictEqual(
      await page.locator("#q-dots input:checked").count(), 0,
      "nothing may be pre-selected: that would leave Next answerable for the reader"
    );
    assert.strictEqual(await page.locator("#btn-next").isDisabled(), true, "Next has nothing to commit yet");

    const first = await page.textContent("#q-statement");
    assert.strictEqual(await page.textContent("#q-progress"), "Zero down, thirty-six to go");
    assert.strictEqual(await page.locator("#q-progress-fill").evaluate((e) => e.style.width), "0%");

    /* Choosing a dot never advances by itself. */
    await page.click('#q-dots input[value="2"]');
    assert.strictEqual(await page.textContent("#q-statement"), first, "a chosen dot must not advance on its own");
    assert.strictEqual(await page.locator("#btn-next").isDisabled(), false, "Next unlocks once a dot is chosen");

    await page.click("#btn-next");
    assert.notStrictEqual(await page.textContent("#q-statement"), first, "Next must advance");
    assert.strictEqual(await page.textContent("#q-progress"), "One down, thirty-five to go");
    const fill = await page.locator("#q-progress-fill").evaluate((e) => e.style.width);
    assert.ok(parseFloat(fill) > 0 && parseFloat(fill) < 100, "progress bar should have moved, got " + fill);

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("Back returns to the previous question with that answer still selected", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    assert.strictEqual(await page.locator("#btn-back").isHidden(), true, "nothing is behind the first question");

    const first = await page.textContent("#q-statement");
    await page.click('#q-dots input[value="6"]');
    await page.click("#btn-next");
    await page.waitForFunction((was) => document.getElementById("q-statement").textContent !== was, first);
    assert.strictEqual(await page.locator("#btn-back").isVisible(), true);

    await page.click("#btn-back");
    assert.strictEqual(await page.textContent("#q-statement"), first, "Back must land on the same question");
    assert.strictEqual(
      await page.locator("#q-dots input:checked").inputValue(), "6",
      "the answer being revised must come back selected"
    );
    assert.strictEqual(await page.textContent("#q-feedback"), "Disagree");
    assert.strictEqual(await page.locator("#btn-back").isHidden(), true, "back to the first question hides Back again");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("an arrow key moves along the dots without committing, Enter commits", { skip: !chromium }, async () => {
  /* Neither a digit nor an arrow key ever advances: only Enter (or clicking
     Next) commits. */
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    const first = await page.textContent("#q-statement");
    await page.keyboard.press("3");
    assert.strictEqual(await page.locator("#q-dots input:checked").inputValue(), "3");
    assert.strictEqual(await page.textContent("#q-statement"), first, "a digit must not advance on its own");

    for (const value of ["4", "5", "6"]) {
      await page.keyboard.press("ArrowRight");
      assert.strictEqual(await page.locator("#q-dots input:checked").inputValue(), value);
      assert.strictEqual(await page.textContent("#q-statement"), first, "an arrow key must not advance");
    }
    await page.keyboard.press("ArrowLeft");
    assert.strictEqual(await page.textContent("#q-feedback"), "Slightly disagree");
    assert.strictEqual(await page.textContent("#q-progress"), "Zero down, thirty-six to go",
      "no arrow key may have recorded anything");

    await page.keyboard.press("Enter");
    await page.waitForFunction((was) => document.getElementById("q-statement").textContent !== was, first);
    assert.strictEqual(await page.textContent("#q-progress"), "One down, thirty-five to go");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("changing the choice before pressing Next replaces it, not adds a second answer", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    const first = await page.textContent("#q-statement");
    await page.click('#q-dots input[value="1"]');
    await page.click('#q-dots input[value="7"]');
    await page.click("#btn-next");
    assert.notStrictEqual(await page.textContent("#q-statement"), first);
    assert.strictEqual(
      await page.textContent("#q-progress"), "One down, thirty-five to go",
      "changing the choice before Next must record one answer, not skip a question"
    );

    await page.click("#btn-back");
    assert.strictEqual(
      await page.locator("#q-dots input:checked").inputValue(), "7",
      "the recorded answer must be the second choice"
    );

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("the question offers two buttons and no third way past it", { skip: !chromium }, async () => {
  /* There is no longer any way to decline a question, so there had better be
     no button offering one. A leftover would record an answer js/score.js no
     longer knows how to read. */
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    assert.strictEqual(await page.locator("#btn-skip").count(), 0, "the skip button must be gone");
    assert.deepStrictEqual(
      await page.locator(".question-actions button:visible").evaluateAll(
        (els) => els.map((e) => e.textContent.trim())
      ),
      ["Next"],
      "the first question has nothing behind it, so Next stands alone"
    );

    await answerNeutral(page, 1);
    assert.deepStrictEqual(
      await page.locator(".question-actions button:visible").evaluateAll(
        (els) => els.map((e) => e.textContent.trim())
      ),
      ["Back", "Next"],
      "from the second question on, both buttons and only those two"
    );

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("the last question names what pressing the button does", { skip: !chromium }, async () => {
  /* The reader has to press to commit the thirty-sixth answer exactly as they
     pressed for the other thirty-five. Only the word changes, so nobody
     presses "Next" and lands somewhere that is not another question. */
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    await answerNeutral(page, 35);
    assert.strictEqual(await page.textContent("#q-progress"), "Thirty-five down, one to go");
    assert.strictEqual(
      (await page.textContent("#btn-next")).trim(), "See your result",
      "the thirty-sixth question does not lead to a thirty-seventh"
    );

    await page.click('#q-dots input[value="4"]');
    await page.click("#btn-next");
    await page.waitForSelector("#view-reveal:not([hidden])");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("a Chinese page is Chinese before any JavaScript runs, and stays in its own locale",
  { skip: !chromium }, async () => {
  /* The generator exists so a crawler, and a reader with no JavaScript, sees
     the copy. That has to hold for the Chinese pages too, and the whole
     path-prefix scheme falls over if a link on one drops the reader back into
     English. */
  const I18N = globalThis.SG.i18n;
  const raw = await (await fetch(site.url + "/zh-hk/isfj")).text();
  assert.ok(raw.includes('<html lang="zh-Hant-HK" data-lang="zh-hk">'), "the raw HTML must declare its language");
  assert.ok(raw.includes("<title>" + I18N.format("seo.title",
    { name: I18N.type("ISFJ", "zh-hk").name, code: "ISFJ" }, "zh-hk") + "</title>"), "Chinese title");
  assert.ok(raw.includes(I18N.t("type.oftenLabel", "zh-hk")), "Chinese chrome in the raw HTML");
  assert.ok(raw.includes('href="/zh-hk/enfj"'), "the gallery must link inside the locale");
  assert.ok(!raw.includes('href="/enfj"'), "a Chinese page must not link at the English pages");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/zh-hk/isfj");
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(await page.getAttribute("html", "lang"), "zh-Hant-HK");
    assert.strictEqual((await page.textContent("#type-name")).trim(), I18N.type("ISFJ", "zh-hk").name);

    /* Browsing to another type must not walk out of the locale. */
    await page.click("#btn-back-gallery");
    await page.click('.gallery-card[href="/zh-hk/intj"]');
    await page.waitForFunction(() => location.pathname === "/zh-hk/intj");
    assert.strictEqual((await page.textContent("#type-name")).trim(), I18N.type("INTJ", "zh-hk").name);
    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("the test itself runs in Chinese, and the address never leaves the locale",
  { skip: !chromium }, async () => {
  const I18N = globalThis.SG.i18n;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/zh-hk/");
    await page.click("#btn-start");
    await page.waitForSelector("#view-question:not([hidden])");

    assert.strictEqual((await page.textContent("#q-progress")).trim(), I18N.progress(0, 36, "zh-hk"));
    assert.match(await page.textContent("#q-progress"), /\d/, "Chinese progress must use digits");
    assert.strictEqual((await page.textContent("#btn-next")).trim(), I18N.t("question.next", "zh-hk"));
    await page.click('#q-dots input[value="1"]');
    assert.strictEqual((await page.textContent("#q-feedback")).trim(), I18N.t("feedback.1", "zh-hk"));

    await answerNeutral(page, 36);
    await page.waitForSelector("#view-reveal:not([hidden])");
    const code = (await page.textContent("#reveal-code")).trim();
    assert.strictEqual((await page.textContent("#reveal-name")).trim(), I18N.type(code, "zh-hk").name);

    await page.click("#btn-keep-both");
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/zh-hk/" + code.toLowerCase(),
      "a Chinese result must get a Chinese address");
    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("an unfinished locale is reachable through the switcher, and offered to nobody else",
  { skip: !chromium }, async () => {
  /* Two questions with different answers. A reader can click to a locale that
     is still being written, because a locale nobody can reach is a locale
     nobody can review, and the review is what finishes it. A search engine is
     told nothing until meta.complete says so. */
  const I18N = globalThis.SG.i18n;
  const unfinished = I18N.SUPPORTED.filter((loc) => !I18N.isComplete(loc));
  const sitemap = await (await fetch(site.url + "/sitemap.xml")).text();
  const root = await (await fetch(site.url + "/")).text();

  unfinished.forEach((loc) => {
    assert.ok(!sitemap.includes("/" + loc + "/"), "the sitemap lists the unfinished " + loc);
    assert.ok(!root.includes('hreflang="' + I18N.HTML_LANG[loc] + '" href='),
      "the root declares an hreflang alternate for the unfinished " + loc);
  });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/");

    /* One control, not a list: it opens on the English slot and its href
       points at the next stop in rotation, English -> Simplified -> Hong
       Kong Traditional -> English. */
    assert.strictEqual((await page.textContent("#lang-switch")).trim(), "EN");
    assert.strictEqual(await page.getAttribute("#lang-switch", "href"), I18N.pathFor("zh-cn", "/"));

    /* And the unfinished notice is on the unfinished page itself, in that
       page's language, not on the switcher. */
    const raw = await (await fetch(site.url + "/")).text();
    assert.ok(/<p id="locale-notice"[^>]*\shidden[^>]*>/.test(raw),
      "English is complete, so its pages must carry no notice");
    for (const loc of unfinished) {
      const page = await (await fetch(site.url + I18N.pathFor(loc, "/isfj"))).text();
      assert.ok(page.includes(">" + I18N.t("lang.unfinished", loc) + "</p>"),
        loc + " does not say that it is unfinished");
      assert.ok(!/<p id="locale-notice"[^>]*\shidden[^>]*>/.test(page),
        loc + " hides the notice it needs to show");
    }

    /* Clicking rotates forward, and a still-unfinished locale stays reachable
       through it and still noindex once there. */
    await page.click("#lang-switch");
    await page.waitForFunction((p) => location.pathname === p, I18N.pathFor("zh-cn", "/"));
    assert.strictEqual(await page.getAttribute("html", "lang"), I18N.HTML_LANG["zh-cn"]);
    assert.strictEqual((await page.textContent("#lang-switch")).trim(), "简");

    await page.click("#lang-switch");
    await page.waitForFunction((p) => location.pathname === p, I18N.pathFor("zh-hk", "/"));
    assert.strictEqual(await page.getAttribute("html", "lang"), I18N.HTML_LANG["zh-hk"]);
    assert.strictEqual((await page.textContent("#lang-switch")).trim(), "繁");
    const res = await fetch(site.url + I18N.pathFor("zh-hk", "/isfj"));
    const zhHkNoindex = (await res.text()).includes('name="robots" content="noindex, follow"');
    assert.strictEqual(zhHkNoindex, unfinished.indexOf("zh-hk") !== -1,
      "zh-hk's noindex state must match whether it is complete");

    /* A full turn returns to English. */
    await page.click("#lang-switch");
    await page.waitForFunction((p) => location.pathname === p, "/");
    assert.strictEqual((await page.textContent("#lang-switch")).trim(), "EN");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("the five long sections are in the raw HTML of a type page, before any JavaScript runs", async () => {
  /* These sections are now most of the copy on a type page, so they are most
     of what a crawler comes for. If they only ever appeared after render.js
     ran, the pages would be near empty to anything that does not run scripts,
     which is the whole reason the generator exists. */
  const html = await (await fetch(site.url + "/infj")).text();

  const infj = types.byCode.INFJ;
  types.SECTIONS.forEach((section) => {
    assert.ok(html.includes("<h3>" + section.heading + "</h3>"), "missing heading: " + section.heading);
    infj[section.key].forEach((paragraph) => {
      assert.ok(
        html.includes('<p class="type-paragraph">' + paragraph + "</p>"),
        section.key + " paragraph missing from the static HTML"
      );
    });
  });

  /* ENFJ's copy must not be on INFJ's page. */
  assert.ok(!html.includes(types.byCode.ENFJ.good[0]), "another type's copy leaked onto this page");
});

test("browsing from one type to another replaces the sections instead of stacking them", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(site.url + "/enfj");
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(await page.locator("#type-sections .type-section").count(), 5);

    await page.click("#btn-nav-sixteen");
    await page.click('#gallery-grid a[href="/infj"]');
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(
      await page.locator("#type-sections .type-section").count(), 5,
      "a second type must replace the sections, not append to them"
    );
    const text = await page.textContent("#type-sections");
    assert.ok(text.includes("You are already at the ceiling there."), "INFJ's copy must be shown");
    assert.ok(!text.includes("Warm Front"), "ENFJ's copy must be gone");

    assert.strictEqual(errors.length, 0, errors.join("\n"));
  } finally {
    await browser.close();
  }
});

/* The bug this guards: Back hands over a value already turned over for an item
   that shows its second pole, so restoring it without turning it back would put
   a different dot under the reader than the one they pressed, silently. The
   flipped items are found by matching the statement on screen against the bank,
   rather than by exposing the flow, so nothing test-only ships. */
test("Back restores the dot the reader actually pressed, on a flipped item", { skip: !chromium }, async () => {
  const items = globalThis.SG.items;
  const flippedText = new Set(
    items.core.filter((it) => it.show === "b").map((it) => it.b)
  );
  assert.ok(flippedText.size > 0, "no flipped items in the core bank");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(PAGE_URL);
    await page.click("#btn-start");

    /* Walk forward until the statement on screen belongs to a flipped item, so
       the inversion is actually exercised rather than assumed. */
    let onFlipped = false;
    for (let i = 0; i < 36 && !onFlipped; i += 1) {
      onFlipped = flippedText.has((await page.textContent("#q-statement")).trim());
      if (!onFlipped) {
        await page.evaluate(() => document.querySelectorAll("#q-dots input")[3].click());
        await page.click("#btn-next");
      }
    }
    assert.ok(onFlipped, "no flipped item was reached in thirty-six questions");

    const statement = (await page.textContent("#q-statement")).trim();
    await page.evaluate(() => document.querySelectorAll("#q-dots input")[1].click());
    await page.click("#btn-next");
    await page.click("#btn-back");

    assert.strictEqual(
      (await page.textContent("#q-statement")).trim(), statement,
      "Back landed on a different question"
    );
    const checked = await page.evaluate(
      () => Array.prototype.findIndex.call(document.querySelectorAll("#q-dots input"), (i) => i.checked)
    );
    assert.strictEqual(checked, 1, "Back put a different dot under the reader");
    assert.strictEqual(await page.textContent("#q-feedback"), "Agree");
  } finally {
    await browser.close();
  }
});
