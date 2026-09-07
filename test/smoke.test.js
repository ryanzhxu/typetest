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

  /* This is what prevents a flash of the intro: the document arrives with the
     intro already hidden and the type view already shown. A test that only
     checked the rendered page would pass even if the intro painted first. */
  assert.match(html, /<section id="view-intro"[^>]*\shidden[^>]*>/, "intro must arrive hidden");
  assert.ok(!/<section id="view-type"[^>]*\shidden[^>]*>/.test(html), "type view must arrive visible");

  assert.ok(!/myers|briggs|mbti/i.test(html.split("</head>")[0]), "the indicator reached the head");

  /* A page served at /enfj cannot reach a relative app.css. */
  assert.ok(html.includes('href="/app.css"'), "generated pages need absolute asset paths");
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
     from the filesystem. Generating it must not have changed that. */
  assert.ok(html.includes('href="app.css"'), "the root must keep relative asset paths");
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
      ["H2", "type-name"],
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
    assert.strictEqual(await page.title(), "Warm Front (ENFJ)", "a deep-linked page names its own type");

    await page.click("#btn-nav-sixteen");
    await page.waitForSelector("#view-sixteen:not([hidden])");
    await page.click('#gallery-grid a[href="/infj"]');
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/infj");
    assert.strictEqual(await page.title(), "The Quiet Read (INFJ)", "the title must follow a gallery click");

    await page.goBack();
    await page.waitForSelector("#view-type:not([hidden])");
    assert.strictEqual(new URL(page.url()).pathname, "/enfj");
    assert.strictEqual(await page.title(), "Warm Front (ENFJ)", "Back must restore the title, not only the view");

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
      await page.title(), name + " (" + code + ")",
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
       question view is left sitting under /enfj titled "Warm Front (ENFJ)".
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
