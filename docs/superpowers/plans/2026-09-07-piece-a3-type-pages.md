# Personality — Piece A3: Per-type URLs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the sixteen types its own indexable, shareable URL, so that parent spec §5.4 ("sixteen good pages beats one good quiz for traffic") is actually implemented.

**Architecture:** A deploy-time Node generator reads the single `index.html`, and for each type emits `public/<code>/index.html` with that type's head meta **and** that type's body copy already filled in, the intro view hidden and the type view shown. The shipped JavaScript reads `data-initial-type` on the body and opens the same view it would have opened anyway, so the static page and the live page agree. Gallery cards become real anchors. The result view rewrites the address bar to `/<code>`.

**Tech Stack:** Vanilla HTML/CSS/JS (classic scripts), zero runtime dependencies, `node:test` + `node:assert`, Playwright for browser smoke tests, Cloudflare Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-piece-a3-type-pages.md`
**Parent spec (binding):** `docs/superpowers/specs/2026-09-06-personality-design.md`

---

## Rulings on the three open questions (A3 design §5)

These were open for the implementer. They are now decided, and the tasks below assume these answers.

### §5.1 Gallery links — YES, real anchors, with plain clicks intercepted

`#gallery-grid` cards become `<a class="gallery-card" href="/enfj">` instead of `<button>`.

- A crawler needs internal links to find the sixteen pages. A sitemap alone is a hint; links are how the pages actually get crawled and how any link value flows to them. This is the whole point of the piece.
- Middle-click, cmd-click and "copy link address" start working.

A plain left click is still intercepted (`preventDefault`) and rendered in place, with `history.pushState`. Reason: a full page load would throw away flow state, so someone who finished the test, browsed the gallery and came back would lose their share card. Modified clicks (cmd, ctrl, shift, alt, non-primary button) are never intercepted, so the real `href` serves crawlers, middle-click and right-click.

**The gallery view itself gets no history entry.** There is no `/sixteen` URL in this piece, so pushing one would put a URL in the address bar that does not describe what is on screen. Only real type URLs and `/` get entries. This is deliberate; do not "fix" it.

### §5.2 Type page scope — TYPE FIRST, TEST CALL TO ACTION BELOW

`/enfj` leads with ENFJ's content: code, name, three paragraphs, five chips, five names, the asterisk paragraph. Below that sits a small block offering the test. The header keeps "See all sixteen".

Search wants the page to be about the type. Conversion wants a way in. Putting the type first and the offer last serves both, and it matches what the A3 design recommended.

The call to action shows on **any** read-only type page, whether the visitor deep-linked to it or clicked through from the gallery. One rule, no special case. It is hidden on the result page, where "Start over" and the share block already occupy that slot.

### §5.3 `og:image` — OUT of A3, its own piece

A3 ships `twitter:card: summary` (no image), which unfurls correctly as a text card.

Doing images properly means sixteen real 1200x630 PNGs rendered at deploy time, which means running `js/share.js` under a headless browser in CI, committing or generating binary assets, and verifying against the real unfurl validators. That is its own task list with its own verification story, and it would roughly double this piece. A3 is already six tasks and touches deployment, routing and the 404 behaviour. Ship the URLs first; images are worthless without them, and they are strictly additive afterwards.

### One amendment to the A3 design, §2.4

A3 §2.4 describes the generator as replacing the head block and setting `data-initial-type`, leaving the body copy to JavaScript.

**This plan goes further: the generator also fills the type card's body copy into the static HTML** and flips the view `hidden` attributes, so `/enfj` is a complete, readable ENFJ page with JavaScript switched off.

Two reasons, both required by A3's own success criteria:

1. A3.3 demands "no flash of the intro screen". Scripts are `defer`, so the browser can paint the intro before any JavaScript runs. The only way to guarantee no flash is to emit the page already showing the type view.
2. The thesis is search traffic. A page whose entire content requires JavaScript execution is a page betting on the renderer queue. Static text is not a bet.

Cost is about 25 extra lines in the generator and seven fill targets in `index.html`. `js/render.js` re-renders the same content on mount, so the two never disagree.

---

## Global Constraints

Copied from the parent spec. Every task's requirements implicitly include this section.

- **Never name the well-known indicator** in a page title, `og:title`, `twitter:title`, filename, directory name, domain, or commit message. Sixteen new titles is sixteen new chances to break this. Body copy may reference it nominatively; the existing footer line is the only such reference and is not to be touched.
- **Every page keeps the non-affiliation line.** Including `404.html`.
- **No percentages, no `±`, never the word "margin"** on any user-visible surface.
- **No em-dashes** in any shipped copy, including generated meta descriptions.
- **Zero runtime dependencies.** The generator and the staging script are deploy-time Node, run from the workflow, and ship nothing to the browser.
- **`index.html` must still open by double-clicking from the filesystem** and run the whole test with no console errors and no thrown exceptions. `file://` has an opaque origin, so every `history.pushState`/`replaceState` call must be wrapped and must not throw there.
- **No dev-time build.** A deploy-time generator is permitted (parent spec §10, amended 2026-09-07).
- **Canonical host is `https://personality.ryanxu.dev`**, no trailing slash on type URLs, lowercase paths.
- **The deploy must never publish `docs/`, `test/`, `.github/`, `scripts/`, `package.json`, `.superpowers/` or dotfiles.** This leak was already fixed once. Do not regress it.
- **Smoke tests must genuinely run in CI, never skip.** A green gate that skipped its integration tests is the specific failure this project has already fixed once.

---

## URL scheme (frozen)

```
/                 English landing and test        canonical https://personality.ryanxu.dev/
/enfj             English ENFJ page               canonical https://personality.ryanxu.dev/enfj
/zh-cn/enfj       later, piece B
/robots.txt       points at the sitemap
/sitemap.xml      17 URLs
/404.html         served with HTTP 404 for unknown paths
```

## Per-page head content (frozen)

For type code `INFJ`, name `The Quiet Read`, line `Clocks the room before they are through the door.`:

| Tag | Value |
|---|---|
| `<title>` | `The Quiet Read (INFJ)` |
| `description` | `Clocks the room before they are through the door. What INFJ looks like up close, and the second type that lives in it.` |
| `canonical` | `https://personality.ryanxu.dev/infj` |
| `og:type` | `website` |
| `og:url` | `https://personality.ryanxu.dev/infj` |
| `og:site_name` | `Personality` |
| `og:title` | `The Quiet Read (INFJ)` |
| `og:description` | same as `description` |
| `twitter:card` | `summary` |
| `twitter:title` | `The Quiet Read (INFJ)` |
| `twitter:description` | same as `description` |

The name leads because it is the distinctive half; the code follows because it is the search term. No em-dash, no percentage, no indicator name anywhere in any of these.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `index.html` | Modify | Generator markers, empty fill targets, the test call-to-action block |
| `app.css` | Modify | Gallery card as an anchor, the call-to-action block |
| `js/render.js` | Modify | Deep link, anchor gallery, `pushState`/`replaceState`/`popstate` |
| `scripts/build-types.js` | Create | Emits sixteen `<code>/index.html` files and `sitemap.xml` |
| `scripts/stage.js` | Create | Builds the exact deploy directory; used by CI *and* by the smoke tests |
| `test/build-types.test.js` | Create | Generator unit tests, including must-throw cases |
| `test/serve.js` | Create | Zero-dependency static server that mimics Pages path resolution |
| `test/serve.test.js` | Create | Proves the test server actually resolves and actually 404s |
| `test/stage.test.js` | Create | Proves the deploy directory holds exactly the public files, nothing else |
| `test/smoke.test.js` | Modify | HTTP smoke tests over the real staged site, plus one `file://` test |
| `404.html` | Create | Real 404 page |
| `robots.txt` | Create | Points at the sitemap |
| `.github/workflows/deploy.yml` | Modify | Staging step becomes `node scripts/stage.js public` |
| `package.json` | Modify | Adds `serve` and `stage` scripts |

## Task order and parallelism

```
Wave 1 (parallel, disjoint files):  Task 1  |  Task 4
Wave 2 (parallel, disjoint files):  Task 2  |  Task 3     both need Task 1
Wave 3:                             Task 5              needs 1, 2, 3, 4
Wave 4:                             Task 6              needs 5
```

---

## Task 1: Page contract — markers, fill targets, call to action

The generator and `js/render.js` are both written against `index.html`. This task freezes that contract first so the two can then be built in parallel, and locks it with a test so a later edit to `index.html` cannot silently break the generator.

**Files:**
- Modify: `index.html`
- Modify: `app.css`
- Test: `test/index-html.test.js` (create)

**Interfaces:**
- Produces, for Task 2 (the generator):
  - `<!-- BUILD:HEAD:START -->` and `<!-- BUILD:HEAD:END -->` HTML comments bracketing every per-page meta tag in the head.
  - Exactly one `<body>` opening tag with no attributes.
  - Seven empty fill targets, each matching `<tag ... id="X" ...></tag>`: `type-code`, `type-name`, `type-opening`, `type-best`, `type-undone`, `type-chips`, `type-often`.
  - Six `hidden`-flippable elements with ids: `view-intro`, `view-type`, `btn-back-gallery`, `share-block`, `btn-restart`, `type-test-cta`.
  - `href="app.css"` appearing exactly once, and `src="js/` appearing exactly eight times.
- Produces, for Task 3 (`js/render.js`): element ids `type-test-cta` and `btn-take-test`.

- [ ] **Step 1: Write the failing test**

Create `test/index-html.test.js`:

```javascript
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/index-html.test.js`
Expected: FAIL on the marker test first ("expected 0 to equal 1").

- [ ] **Step 3: Add the head markers to `index.html`**

Wrap the existing per-page meta in markers. The pages.dev explanatory comment stays **above** the start marker, because it explains the canonical policy for the whole site and must not be duplicated sixteen times. Replace the block from `<title>` through the `twitter:description` meta with:

```html
  <!-- Everything between these markers is replaced per type by
       scripts/build-types.js. Keep each tag on one line, exactly once, and
       inside the markers. test/index-html.test.js enforces that. -->
  <!-- BUILD:HEAD:START -->
  <title>Personality</title>
  <meta name="description" content="A four-letter test that tells you which second type is living in your result.">
  <link rel="canonical" href="https://personality.ryanxu.dev/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://personality.ryanxu.dev/">
  <meta property="og:site_name" content="Personality">
  <meta property="og:title" content="Personality">
  <meta property="og:description" content="A four-letter test that tells you which second type is living in your result.">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Personality">
  <meta name="twitter:description" content="A four-letter test that tells you which second type is living in your result.">
  <!-- BUILD:HEAD:END -->
```

The existing comment block explaining the pages.dev canonical must be kept, moved to sit immediately above the `<!-- BUILD:HEAD:START -->` line.

- [ ] **Step 4: Add the call-to-action block to `index.html`**

Inside `#view-type`'s `.type-card`, between the closing `</div>` of `.often-block` and the `<div id="share-block" ...>` line, insert:

```html
        <div id="type-test-cta" class="test-cta" hidden>
          <p class="test-cta-line">Not sure this is you?</p>
          <button type="button" id="btn-take-test" class="btn btn-primary">Take the test</button>
        </div>
```

- [ ] **Step 5: Style the call to action and the anchor gallery card in `app.css`**

After the `.share-label` rule (currently line 466), add:

```css
.test-cta {
  background: var(--raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.test-cta-line { color: var(--muted); font-size: 0.9rem; }
```

In the existing `.gallery-card` rule, the cards become `<a>` elements in Task 3, so add one declaration to that rule so the anchor does not arrive underlined and blue:

```css
  text-decoration: none;
```

Leave every other declaration in `.gallery-card` alone.

Also add one declaration to the existing `.btn` rule (around line 159):

```css
  display: inline-block;
```

`.btn` sets `min-height: 44px`, but `min-height` does not apply to non-replaced inline boxes, and `404.html` styles an `<a>` as a button. Every existing `.btn` is a `<button>`, already `inline-block`, so this is a no-op for them and closes the accessibility gap for the anchor. `a:focus-visible` is already covered by the existing rule at line 104, and `min-height: 44px` already satisfies the target-size constraint.

- [ ] **Step 6: Run the test and the whole suite**

Run: `node --test test/index-html.test.js`
Expected: PASS, 8 tests.

Run: `npm test`
Expected: PASS, 0 failed, 0 skipped. The existing 36 tests must all still pass; the two Playwright smoke tests still run against `file://index.html` and must not have broken.

- [ ] **Step 7: Open the page by hand and confirm nothing moved**

Run: `open index.html` (macOS) and take the test far enough to reach a result. The new call-to-action block must not be visible on the result page (it is `hidden` in source and Task 3 has not run yet).

- [ ] **Step 8: Commit**

```bash
git add index.html app.css test/index-html.test.js
git commit -m "a3: freeze the index.html contract the type-page generator builds on

Head markers, empty fill targets, and a hidden test call-to-action block,
all locked by a test so an edit to index.html cannot silently break the
sixteen generated pages."
```

---

## Task 2: The generator

**Files:**
- Create: `scripts/build-types.js`
- Test: `test/build-types.test.js` (create)
- Reads: `index.html`, `js/ns.js`, `js/types.js`

**Interfaces:**
- Consumes from Task 1: the `index.html` contract (markers, fill targets, hidden-flippable ids, asset path counts).
- Consumes: `require("../js/ns.js"); require("../js/types.js"); globalThis.SG.types.byCode` — a map of sixteen uppercase codes to `{ name, line, opening, best, undone, chips[5], often[5] }`. This is exactly how `test/types.test.js` already loads it.
- Produces, as `module.exports`:
  - `ORIGIN` — the string `"https://personality.ryanxu.dev"`.
  - `titleFor(code, type)` -> `"The Quiet Read (INFJ)"`.
  - `descriptionFor(code, type)` -> the frozen description string.
  - `buildPage(indexHtml, code, type)` -> the full HTML string for that type's page. **Throws** on any missing or ambiguous target.
  - `buildSitemap(codes)` -> the `sitemap.xml` string.
  - `build(outDir)` -> writes `outDir/<lowercase code>/index.html` for all sixteen and `outDir/sitemap.xml`; returns the array of written paths.
- Produces, as a CLI: `node scripts/build-types.js [outDir]`, default `outDir` is `public`.

- [ ] **Step 1: Write the failing test**

Create `test/build-types.test.js`:

```javascript
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const gen = require("../scripts/build-types.js");
require("../js/ns.js");
require("../js/types.js");
const byCode = globalThis.SG.types.byCode;

const INDEX = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const CODES = Object.keys(byCode).sort();

function headOf(html) {
  return html.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
}

function pageFor(code) {
  return gen.buildPage(INDEX, code, byCode[code]);
}

test("the title names the type and its code, and never the indicator", () => {
  assert.strictEqual(gen.titleFor("INFJ", byCode.INFJ), "The Quiet Read (INFJ)");
  CODES.forEach((code) => {
    const title = gen.titleFor(code, byCode[code]);
    assert.ok(title.includes(code), code + " must appear in its own title");
    assert.ok(title.includes(byCode[code].name), code + " must name its type");
    assert.ok(!/myers|briggs|mbti/i.test(title), "the indicator reached a title: " + title);
  });
});

test("all sixteen titles are distinct, and so are all sixteen descriptions", () => {
  const titles = new Set(CODES.map((c) => gen.titleFor(c, byCode[c])));
  const descs = new Set(CODES.map((c) => gen.descriptionFor(c, byCode[c])));
  assert.strictEqual(titles.size, 16);
  assert.strictEqual(descs.size, 16);
});

test("descriptions open with the type's own line and stay inside sane length", () => {
  CODES.forEach((code) => {
    const d = gen.descriptionFor(code, byCode[code]);
    assert.ok(d.startsWith(byCode[code].line), code + " description must open with its line");
    assert.ok(d.includes(code), code + " description must carry the search term");
    assert.ok(d.length >= 90 && d.length <= 170, code + " description length was " + d.length);
  });
});

test("no generated page carries a percentage, a plus-minus, the word margin, or an em-dash", () => {
  CODES.forEach((code) => {
    const html = pageFor(code);
    assert.ok(!/\d+%/.test(html), code + " leaked a percentage");
    assert.ok(!html.includes("±"), code + " leaked a plus-minus");
    assert.ok(!/margin/i.test(html), code + " leaked the word margin");
    assert.ok(!html.includes("—"), code + " leaked an em-dash");
  });
});

test("each page's head is entirely its own type, with no trace of the other fifteen", () => {
  CODES.forEach((code) => {
    const head = headOf(pageFor(code));
    const title = gen.titleFor(code, byCode[code]);
    const desc = gen.descriptionFor(code, byCode[code]);
    const url = gen.ORIGIN + "/" + code.toLowerCase();

    assert.ok(head.includes("<title>" + title + "</title>"), code + " title");
    assert.ok(head.includes('<link rel="canonical" href="' + url + '">'), code + " canonical");
    assert.ok(head.includes('<meta property="og:url" content="' + url + '">'), code + " og:url");
    assert.ok(head.includes('<meta property="og:title" content="' + title + '">'), code + " og:title");
    assert.ok(head.includes('<meta name="twitter:title" content="' + title + '">'), code + " twitter:title");
    assert.ok(head.includes('content="' + desc + '"'), code + " description");
    assert.ok(head.includes('<meta name="twitter:card" content="summary">'), code + " twitter:card");

    CODES.filter((o) => o !== code).forEach((other) => {
      assert.ok(!head.includes(other), code + " head mentions " + other);
      assert.ok(!head.includes(byCode[other].name), code + " head mentions " + byCode[other].name);
    });
  });
});

test("no page is left with the generic homepage head", () => {
  CODES.forEach((code) => {
    const head = headOf(pageFor(code));
    assert.ok(!head.includes("<title>Personality</title>"), code + " kept the homepage title");
    assert.ok(
      !head.includes("A four-letter test that tells you which second type is living in your result."),
      code + " kept the homepage description"
    );
    assert.ok(!head.includes('href="' + gen.ORIGIN + '/">'), code + " kept the homepage canonical");
  });
});

test("each page opens on its own type view, never the intro", () => {
  CODES.forEach((code) => {
    const html = pageFor(code);
    assert.ok(html.includes('<body data-initial-type="' + code + '">'), code + " body attribute");
    assert.match(html, new RegExp('<section id="view-intro"[^>]*\\shidden[^>]*>'), code + " intro must be hidden");
    assert.ok(
      !new RegExp('<section id="view-type"[^>]*\\shidden[^>]*>').test(html),
      code + " type view must not be hidden"
    );
    assert.ok(!new RegExp('<div id="type-test-cta"[^>]*\\shidden[^>]*>').test(html), code + " cta must show");
    assert.ok(!new RegExp('<button[^>]*id="btn-back-gallery"[^>]*\\shidden[^>]*>').test(html), code + " back link must show");
    assert.match(html, new RegExp('<div id="share-block"[^>]*\\shidden[^>]*>'), code + " share block must be hidden");
    assert.match(html, new RegExp('<button[^>]*id="btn-restart"[^>]*\\shidden[^>]*>'), code + " restart must be hidden");
  });
});

test("each page carries its own copy in the static HTML, readable with no JavaScript", () => {
  CODES.forEach((code) => {
    const t = byCode[code];
    const html = pageFor(code);
    assert.ok(html.includes(">" + code + "</p>"), code + " code text");
    assert.ok(html.includes(">" + t.name + "</h2>"), code + " name text");
    assert.ok(html.includes(t.opening), code + " opening paragraph");
    assert.ok(html.includes("You are at your best " + t.best), code + " best paragraph");
    assert.ok(html.includes("You come undone " + t.undone), code + " undone paragraph");
    t.chips.forEach((chip) => assert.ok(html.includes("<li>" + chip + "</li>"), code + " chip " + chip));
    t.often.forEach((name) => assert.ok(html.includes("<li>" + name + "</li>"), code + " name " + name));
  });
});

test("asset paths are absolutised, because a page at /enfj cannot use relative ones", () => {
  const html = pageFor("ENFJ");
  assert.ok(html.includes('href="/app.css"'));
  assert.ok(html.includes('src="/js/ns.js"'));
  assert.ok(html.includes('src="/js/app.js"'));
  assert.ok(!html.includes('href="app.css"'));
  assert.ok(!/src="js\//.test(html));
});

test("the non-affiliation line survives onto every page", () => {
  CODES.forEach((code) => {
    assert.ok(
      pageFor(code).includes("Not affiliated with or endorsed by The Myers-Briggs Company."),
      code + " lost the non-affiliation line"
    );
  });
});

test("attribute and text values are escaped", () => {
  const nasty = {
    name: 'A & B "C" <D>',
    line: "Ampersand & angle < bracket.",
    opening: "Opening & <thing>.",
    best: "best & <thing>.",
    undone: "undone & <thing>.",
    chips: ["a & b", "c < d", "e > f", "g", "h"],
    often: ['X "Y"', "Z & W", "a", "b", "c"]
  };
  const html = gen.buildPage(INDEX, "INFJ", nasty);
  const head = html.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
  assert.ok(
    head.includes(String.raw`content="A &amp; B &quot;C&quot; &lt;D&gt; (INFJ)"`),
    "og:title and twitter:title must be fully escaped inside their attributes"
  );
  assert.ok(head.includes("Ampersand &amp; angle &lt; bracket."), "the description must be escaped");
  assert.ok(html.includes("<li>a &amp; b</li>"), "chip text must escape ampersands");
  assert.ok(html.includes("<li>c &lt; d</li>"), "chip text must escape angle brackets");
  assert.ok(!html.includes("<D>"), "a raw tag was injected from type copy");
});

test("the generator refuses to work on an index.html that lost a marker", () => {
  const broken = INDEX.replace("<!-- BUILD:HEAD:START -->", "");
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /BUILD:HEAD/);
});

test("the generator refuses to work on an index.html that lost a fill target", () => {
  const broken = INDEX.replace(/<ul id="type-chips" class="chip-list"><\/ul>/, "<ul></ul>");
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /type-chips/);
});

test("the generator refuses to work on an index.html that lost a hidden target", () => {
  const broken = INDEX.replace(/<section id="view-intro"/, "<section id=\"view-intro-oops\"");
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /view-intro/);
});

test("the generator refuses an unknown type code", () => {
  assert.throws(() => gen.buildPage(INDEX, "XXXX", byCode.INFJ), /XXXX/);
});

test("the sitemap lists the root plus all sixteen, and nothing else", () => {
  const xml = gen.buildSitemap(CODES);
  const locs = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map((s) => s.slice(5, -6));
  const expected = [gen.ORIGIN + "/"].concat(CODES.map((c) => gen.ORIGIN + "/" + c.toLowerCase()));
  assert.strictEqual(locs.length, 17);
  assert.deepStrictEqual(locs.slice().sort(), expected.slice().sort());
  assert.strictEqual(new Set(locs).size, 17, "duplicate URL in the sitemap");
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(xml.trim().endsWith("</urlset>"));
});

test("build() writes sixteen directories and a sitemap and nothing else", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-build-"));
  try {
    gen.build(dir);
    const entries = fs.readdirSync(dir).sort();
    const expected = CODES.map((c) => c.toLowerCase()).concat(["sitemap.xml"]).sort();
    assert.deepStrictEqual(entries, expected);
    CODES.forEach((code) => {
      const p = path.join(dir, code.toLowerCase(), "index.html");
      assert.ok(fs.existsSync(p), "missing " + p);
      assert.ok(fs.readFileSync(p, "utf8").includes('data-initial-type="' + code + '"'));
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/build-types.test.js`
Expected: FAIL, "Cannot find module '../scripts/build-types.js'".

- [ ] **Step 3: Write the generator**

Create `scripts/build-types.js`:

```javascript
"use strict";
/* Deploy-time only. Reads index.html and emits one page per type, each with
   its own head meta and its own copy already in the HTML. Nothing here ships
   to the browser.

   Every helper below throws rather than guessing. A generator that quietly
   emits sixteen pages with the homepage's title is worse than one that fails
   the build, because nothing downstream would notice. */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://personality.ryanxu.dev";

require(path.join(ROOT, "js", "ns.js"));
require(path.join(ROOT, "js", "types.js"));
const BY_CODE = globalThis.SG.types.byCode;

function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeText(s).replace(/"/g, "&quot;");
}

/* Replace with a function, never a string: a "$&" or "$1" inside type copy
   would otherwise be read as a replacement pattern. */
function replaceOnce(html, re, make, what) {
  const hits = html.match(new RegExp(re.source, re.flags.replace("g", "") + "g")) || [];
  if (hits.length !== 1) {
    throw new Error(
      "build-types: expected exactly one " + what + " in index.html, found " + hits.length +
      ". The page contract in test/index-html.test.js is broken."
    );
  }
  return html.replace(re, make);
}

function fillById(html, id, inner) {
  const re = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)></\\1>');
  return replaceOnce(html, re, (m, tag, attrs) => "<" + tag + attrs + ">" + inner + "</" + tag + ">",
    'empty element with id="' + id + '"');
}

function setHidden(html, id, hidden) {
  const re = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)>');
  return replaceOnce(html, re, (m, tag, attrs) => {
    const bare = attrs.replace(/\s+hidden(?=\s|$)/, "");
    return "<" + tag + bare + (hidden ? " hidden" : "") + ">";
  }, 'element with id="' + id + '"');
}

function titleFor(code, type) {
  return type.name + " (" + code + ")";
}

function descriptionFor(code, type) {
  return type.line + " What " + code +
    " looks like up close, and the second type that lives in it.";
}

function headFor(code, type) {
  const title = escapeAttr(titleFor(code, type));
  const desc = escapeAttr(descriptionFor(code, type));
  const url = ORIGIN + "/" + code.toLowerCase();
  return [
    "  <title>" + escapeText(titleFor(code, type)) + "</title>",
    '  <meta name="description" content="' + desc + '">',
    '  <link rel="canonical" href="' + url + '">',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:url" content="' + url + '">',
    '  <meta property="og:site_name" content="Personality">',
    '  <meta property="og:title" content="' + title + '">',
    '  <meta property="og:description" content="' + desc + '">',
    '  <meta name="twitter:card" content="summary">',
    '  <meta name="twitter:title" content="' + title + '">',
    '  <meta name="twitter:description" content="' + desc + '">'
  ].join("\n");
}

function listItems(values) {
  return values.map((v) => "<li>" + escapeText(v) + "</li>").join("");
}

function buildPage(indexHtml, code, type) {
  if (!/^[A-Z]{4}$/.test(code) || !BY_CODE[code]) {
    throw new Error("build-types: unknown type code " + code);
  }
  let html = indexHtml;

  html = replaceOnce(
    html,
    /<!-- BUILD:HEAD:START -->[\s\S]*?<!-- BUILD:HEAD:END -->/,
    () => "<!-- BUILD:HEAD:START -->\n" + headFor(code, type) + "\n  <!-- BUILD:HEAD:END -->",
    "BUILD:HEAD marker pair"
  );

  /* A page served at /enfj cannot reach a relative app.css. The root page
     keeps relative paths so index.html still opens from the filesystem. */
  html = replaceOnce(html, /href="app\.css"/, () => 'href="/app.css"', 'href="app.css"');
  const jsHits = (html.match(/src="js\//g) || []).length;
  if (jsHits !== 8) {
    throw new Error("build-types: expected 8 script tags, found " + jsHits);
  }
  html = html.replace(/src="js\//g, 'src="/js/');

  html = replaceOnce(html, /<body>/, () => '<body data-initial-type="' + code + '">', "<body> tag");

  html = setHidden(html, "view-intro", true);
  html = setHidden(html, "view-type", false);
  html = setHidden(html, "btn-back-gallery", false);
  html = setHidden(html, "type-test-cta", false);
  html = setHidden(html, "share-block", true);
  html = setHidden(html, "btn-restart", true);

  html = fillById(html, "type-code", escapeText(code));
  html = fillById(html, "type-name", escapeText(type.name));
  html = fillById(html, "type-opening", escapeText(type.opening));
  html = fillById(html, "type-best", escapeText("You are at your best " + type.best));
  html = fillById(html, "type-undone", escapeText("You come undone " + type.undone));
  html = fillById(html, "type-chips", listItems(type.chips));
  html = fillById(html, "type-often", listItems(type.often));

  return html;
}

function buildSitemap(codes) {
  const urls = [ORIGIN + "/"].concat(codes.map((c) => ORIGIN + "/" + c.toLowerCase()));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
    .concat(urls.map((u) => "  <url><loc>" + u + "</loc></url>"))
    .concat(["</urlset>", ""])
    .join("\n");
}

function build(outDir) {
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const codes = Object.keys(BY_CODE).sort();
  if (codes.length !== 16) {
    throw new Error("build-types: expected 16 types, found " + codes.length);
  }
  const written = [];
  codes.forEach((code) => {
    const dir = path.join(outDir, code.toLowerCase());
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "index.html");
    fs.writeFileSync(file, buildPage(indexHtml, code, BY_CODE[code]));
    written.push(file);
  });
  const sitemap = path.join(outDir, "sitemap.xml");
  fs.writeFileSync(sitemap, buildSitemap(codes));
  written.push(sitemap);
  return written;
}

module.exports = { ORIGIN, escapeText, escapeAttr, titleFor, descriptionFor, buildPage, buildSitemap, build };

if (require.main === module) {
  const out = path.resolve(process.argv[2] || "public");
  const written = build(out);
  process.stdout.write("build-types: wrote " + written.length + " files into " + out + "\n");
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test test/build-types.test.js`
Expected: PASS, 16 tests.

If the "no trace of the other fifteen" test fails on a name rather than a code, do not weaken the test. A type name leaking into another type's head means a replacement matched too widely.

- [ ] **Step 5: Generate once by hand and read one page**

```bash
node scripts/build-types.js /tmp/a3-check
sed -n '1,40p' /tmp/a3-check/infj/index.html
grep -c '<loc>' /tmp/a3-check/sitemap.xml
```

Expected: the head shows `<title>The Quiet Read (INFJ)</title>` and a canonical of `https://personality.ryanxu.dev/infj`; the `<loc>` count is 17.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: 0 failed, 0 skipped.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-types.js test/build-types.test.js
git commit -m "a3: generate sixteen per-type pages with their own head and their own copy

Deploy-time only. Each page carries its title, description, canonical and
og tags in the initial response, and its body copy in static HTML, so the
pages are readable and indexable without running any JavaScript."
```

---

## Task 3: Deep link, anchor gallery, and the result URL

**Files:**
- Modify: `js/render.js`

**Interfaces:**
- Consumes from Task 1: `#type-test-cta`, `#btn-take-test`, and the `data-initial-type` body attribute the generator sets.
- Consumes from Task 2: pages served at `/<lowercase code>` with `<body data-initial-type="CODE">`.
- Produces, for Task 5's smoke tests:
  - Landing on `/enfj` shows the type view with ENFJ's content and no intro.
  - `#gallery-grid a.gallery-card` elements with `href="/<lowercase code>"`.
  - Reaching the result type view sets `location.pathname` to `/<lowercase code>`.
  - `#btn-take-test` starts the test and sets `location.pathname` to `/`.

- [ ] **Step 1: Add the history helper and read the initial type**

In `js/render.js`, inside `mount(flow)`, after the `el` object literal, add `typeTestCta` and `btnTakeTest` to it:

```javascript
      typeTestCta: document.getElementById("type-test-cta"),
      btnTakeTest: document.getElementById("btn-take-test"),
```

Then, replacing the current `var nav = null; var navCode = null;` lines:

```javascript
    /* The gallery is a browsing overlay on top of the flow, not a flow state.
       nav is null while the flow drives the view, "gallery" for the grid, or
       "type" while reading one type's page read-only (navCode names it). */
    var nav = null;
    var navCode = null;

    /* Generated per-type pages carry data-initial-type, so /enfj opens on the
       type view. The generator has already flipped the hidden attributes, so
       there is nothing to paint over: this only tells the JS which page it is
       on. An unknown value falls through to the intro rather than throwing. */
    var initialType = document.body.getAttribute("data-initial-type");
    if (initialType && SG.types.byCode[initialType]) {
      nav = "type";
      navCode = initialType;
    }
    var INITIAL_NAV = nav;
    var INITIAL_CODE = navCode;

    var pendingValue = 4;
    var activeView = "intro";
    var firstRender = true;

    /* file:// has an opaque origin, so the History API throws there. The site
       must still open by double-clicking index.html, so every call is wrapped
       and the app carries on without a URL change. */
    function setUrl(pathname, state, replace) {
      try {
        history[replace ? "replaceState" : "pushState"](state, "", pathname);
      } catch (e) {
        /* filesystem or sandboxed origin. The view is already correct. */
      }
    }
```

- [ ] **Step 2: Turn the gallery cards into anchors**

Replace the gallery-building block (the `Object.keys(SG.types.byCode).sort().forEach(...)` loop) with:

```javascript
    /* Real anchors, not buttons. A crawler needs links to find the sixteen
       pages, and middle-click and "copy link address" should work. A plain
       left click is still handled in place, so flow state survives browsing:
       a full page load here would throw away someone's finished result. */
    Object.keys(SG.types.byCode).sort().forEach(function (code) {
      var t = SG.types.byCode[code];
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "gallery-card";
      a.href = "/" + code.toLowerCase();

      var codeEl = document.createElement("span");
      codeEl.className = "gallery-code";
      codeEl.textContent = code;

      var nameEl = document.createElement("span");
      nameEl.className = "gallery-name";
      nameEl.textContent = t.name;

      var lineEl = document.createElement("span");
      lineEl.className = "gallery-line";
      lineEl.textContent = t.line;

      a.appendChild(codeEl);
      a.appendChild(nameEl);
      a.appendChild(lineEl);
      a.addEventListener("click", function (e) {
        /* Never swallow a modified click: those mean "open it properly". */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) { return; }
        e.preventDefault();
        nav = "type";
        navCode = code;
        setUrl("/" + code.toLowerCase(), { view: "type", code: code });
        render();
      });

      li.appendChild(a);
      el.galleryGrid.appendChild(li);
    });
```

- [ ] **Step 3: Show the call to action on read-only type pages, and set the result URL**

Replace `renderType()` with:

```javascript
    function renderType() {
      if (nav === "type") {
        renderTypeContent(navCode);
        el.btnBackGallery.hidden = false;
        el.typeTestCta.hidden = false;
        el.shareBlock.hidden = true;
        el.btnRestart.hidden = true;
        return;
      }
      var result = flow.result();
      if (!result) { return; }
      renderTypeContent(result.code);
      el.btnBackGallery.hidden = true;
      /* Start over and the share card already occupy this slot on a result. */
      el.typeTestCta.hidden = true;
      el.shareBlock.hidden = false;
      el.btnRestart.hidden = false;
      /* The result now has an address worth sending. replaceState, not push,
         so Back does not walk the reveal again. */
      setUrl("/" + result.code.toLowerCase(), { view: "result" }, true);
      if (SG.share && SG.share.setResult) { SG.share.setResult(result); }
    }
```

- [ ] **Step 4: Do not steal focus on the first paint of a deep-linked page**

In `render()`, replace the final `focusView(activeView);` line with:

```javascript
      /* Moving focus is right when a view changes under the reader. It is
         wrong on the very first paint of a deep-linked page, where nothing
         changed and the reader has not acted yet. */
      if (firstRender && INITIAL_NAV === "type") { firstRender = false; return; }
      firstRender = false;
      focusView(activeView);
```

`firstRender` was already declared in step 1.

- [ ] **Step 5: Wire the call to action and the back-navigation**

Add, alongside the other `addEventListener` calls:

```javascript
    el.btnTakeTest.addEventListener("click", function () {
      nav = null;
      navCode = null;
      /* pushState, so Back returns to the type page they came from. */
      setUrl("/", { view: "flow" });
      flow.start();
      render();
    });

    /* The gallery overlay has no URL of its own in this piece, so only real
       type pages and the root create history entries. A null state means the
       entry this page was loaded on. */
    window.addEventListener("popstate", function (e) {
      var s = e.state;
      if (s && s.view === "type") {
        nav = "type";
        navCode = s.code;
      } else if (s && (s.view === "result" || s.view === "flow")) {
        nav = null;
        navCode = null;
      } else {
        nav = INITIAL_NAV;
        navCode = INITIAL_CODE;
      }
      render();
    });
```

- [ ] **Step 6: Verify by hand, from the filesystem, that nothing throws**

Run: `open index.html`, open the browser console, take the test end to end.
Expected: the flow completes, the console is empty. The `SecurityError` that `pushState` raises on `file://` must be swallowed by `setUrl`. If anything reaches the console, the wrapping is wrong.

Then click "See all sixteen" and click a card. Expected: the type renders in place. The address bar does not change under `file://`, which is correct there.

- [ ] **Step 7: Verify by hand, over HTTP, that the URL actually changes**

```bash
node -e "const h=require('node:http'),f=require('node:fs'),p=require('node:path');h.createServer((q,s)=>{let u=q.url.split('?')[0];let fp=p.join(process.cwd(),u==='/'?'index.html':u);let b;try{b=f.readFileSync(fp);}catch(e){s.writeHead(404);s.end('nope');return;}s.writeHead(200,{'content-type':u.endsWith('.css')?'text/css':u.endsWith('.js')?'text/javascript':'text/html'});s.end(b);}).listen(8788,()=>console.log('http://localhost:8788'))"
```

Open `http://localhost:8788`, take the test, and confirm the address bar reads `/<code>` in lowercase on the result page. Then click through to the gallery and a card, and confirm the address bar follows and that browser Back returns you to your result with the share block intact.

Stop the server when done.

- [ ] **Step 8: Run the whole suite**

Run: `npm test`
Expected: 0 failed, 0 skipped. The two existing `file://` smoke tests assert an empty console, so they are the regression guard for step 6.

- [ ] **Step 9: Commit**

```bash
git add js/render.js
git commit -m "a3: open the type view from the URL, and give the result an address

Gallery cards are real anchors now, so crawlers and middle-click work, but a
plain click still renders in place so a finished result is not thrown away.
Every history call is wrapped: file:// has an opaque origin and would throw."
```

---

## Task 4: The 404 page, robots, and a test server that tells the truth

Independent of tasks 1 to 3. Can run at the same time as Task 1.

**Files:**
- Create: `404.html`
- Create: `robots.txt`
- Create: `test/serve.js`
- Test: `test/serve.test.js` (create)

**Interfaces:**
- Produces, for Task 5:
  - `require("./serve.js").start(dir)` -> `Promise<{ url, port, close }>` where `url` is like `http://127.0.0.1:49213` and `close()` returns a Promise.
  - Path resolution matching Cloudflare Pages: `/` serves `index.html`; `/x` serves `x/index.html` if present, else the file `x`; anything else returns HTTP 404 with the body of `404.html`.

- [ ] **Step 1: Write the failing test**

Create `test/serve.test.js`:

```javascript
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const serve = require("./serve.js");

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-serve-"));
  fs.writeFileSync(path.join(dir, "index.html"), "<p>root</p>");
  fs.writeFileSync(path.join(dir, "404.html"), "<p>not here</p>");
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\n");
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset/>");
  fs.writeFileSync(path.join(dir, "app.css"), "body{}");
  fs.mkdirSync(path.join(dir, "enfj"));
  fs.writeFileSync(path.join(dir, "enfj", "index.html"), "<p>enfj</p>");
  return dir;
}

async function get(base, p) {
  const res = await fetch(base + p);
  return { status: res.status, type: res.headers.get("content-type"), body: await res.text() };
}

/* The smoke tests in test/smoke.test.js rest on this server. A server that
   answered 200 to everything would make "a garbage path 404s" vacuous, so
   these four cases are asserted directly rather than assumed. */
test("the test server resolves paths the way Cloudflare Pages does", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    assert.deepStrictEqual(
      (await get(server.url, "/")).body, "<p>root</p>", "/ must serve index.html"
    );
    const type = await get(server.url, "/enfj");
    assert.strictEqual(type.status, 200);
    assert.strictEqual(type.body, "<p>enfj</p>", "/enfj must serve enfj/index.html");

    const robots = await get(server.url, "/robots.txt");
    assert.strictEqual(robots.status, 200);
    assert.match(robots.type, /text\/plain/);

    const sitemap = await get(server.url, "/sitemap.xml");
    assert.strictEqual(sitemap.status, 200);
    assert.match(sitemap.type, /xml/);

    const css = await get(server.url, "/app.css");
    assert.match(css.type, /text\/css/);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the test server returns a real 404, with the 404 page as the body", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const missing = await get(server.url, "/totally-made-up-path");
    assert.strictEqual(missing.status, 404, "an unknown path must not be 200");
    assert.strictEqual(missing.body, "<p>not here</p>");

    const deep = await get(server.url, "/a/b/c");
    assert.strictEqual(deep.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* fetch() runs its path through the WHATWG URL parser, which collapses ".."
   segments before the request is ever sent, so it cannot exercise a traversal
   attempt at all. http.request's `path` option is not normalized: it goes
   over the wire exactly as given. */
function rawGet(port, rawPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path: rawPath }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("the test server refuses to escape its root", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  /* A canary file one directory above root, reachable with a single "..".
     A literal path like "/../../etc/passwd" is not a portable proof: how many
     ".." it takes to reach a real file depends on how deep os.tmpdir() nests.
     A sibling temp directory is exactly one level up on every platform. */
  const canaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-canary-"));
  fs.writeFileSync(path.join(canaryDir, "secret.txt"), "should not be reachable");
  const escapePath = "/../" + path.basename(canaryDir) + "/secret.txt";
  try {
    /* Unit-level proof that the guard fires. An equivalent assertion made
       through fetch() would pass even with the guard clause deleted. */
    assert.strictEqual(
      serve.resolveFile(dir, escapePath), null,
      "resolveFile must not resolve a path outside its root"
    );
    /* Over-the-wire proof, sent unnormalized. */
    const escaped = await rawGet(server.port, escapePath);
    assert.strictEqual(escaped.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(canaryDir, { recursive: true, force: true });
  }
});

test("a malformed percent-encoded path 404s instead of crashing the server", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const malformed = await get(server.url, "/%");
    assert.strictEqual(malformed.status, 404, "malformed percent-encoding must 404, not throw");
    /* The half that matters: the server must still be alive afterward, not
       dead from an uncaught exception in the request callback. */
    const stillAlive = await get(server.url, "/");
    assert.strictEqual(stillAlive.body, "<p>root</p>", "the server must still serve after a malformed request");
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/serve.test.js`
Expected: FAIL, "Cannot find module './serve.js'".

- [ ] **Step 3: Write the server**

Create `test/serve.js`:

```javascript
"use strict";
/* Test and local-preview server. Zero dependencies. It exists because the
   deployed site is served over HTTP at real paths, and a file:// page cannot
   test /enfj, a 404, or the History API.

   It mimics Cloudflare Pages path resolution. That mimicry is an assumption,
   not a proof, which is why the plan also verifies the live site with curl
   after deploying. */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function resolveFile(root, urlPath) {
  const rawPath = urlPath.split("?")[0].split("#")[0];
  let clean;
  /* A stray "%" makes decodeURIComponent throw URIError. This runs
     synchronously inside the request callback, so an uncaught throw here
     kills the whole process instead of 404ing one request. */
  try {
    clean = decodeURIComponent(rawPath);
  } catch (e) {
    if (e instanceof URIError) { return null; }
    throw e;
  }
  const target = path.resolve(root, "." + (clean === "/" ? "/index.html" : clean));
  if (target !== root && !target.startsWith(root + path.sep)) { return null; }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) { return target; }
  const asDir = path.join(target, "index.html");
  if (fs.existsSync(asDir) && fs.statSync(asDir).isFile()) { return asDir; }
  return null;
}

function start(dir) {
  const root = path.resolve(dir);
  const server = http.createServer(function (req, res) {
    const file = resolveFile(root, req.url);
    if (file) {
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
      return;
    }
    const notFound = path.join(root, "404.html");
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found";
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  });

  return new Promise(function (resolve) {
    server.listen(0, "127.0.0.1", function () {
      const port = server.address().port;
      resolve({
        port: port,
        url: "http://127.0.0.1:" + port,
        close: function () {
          return new Promise(function (done) { server.close(done); });
        }
      });
    });
  });
}

module.exports = { start, resolveFile };

if (require.main === module) {
  start(process.argv[2] || "public").then(function (s) {
    process.stdout.write("serving " + path.resolve(process.argv[2] || "public") + " at " + s.url + "\n");
  });
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test test/serve.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the 404 page**

Create `404.html`. It is standalone: no scripts, absolute asset path, `noindex`, and it keeps the non-affiliation line the way every other page does.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not here</title>
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Karla:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/app.css">
</head>
<body>
  <header class="site-header">
    <p class="brand">Personality</p>
  </header>

  <main>
    <section class="view">
      <div class="intro-card">
        <p class="eyebrow">Nothing at this address</p>
        <h1>Not here</h1>
        <p class="lede">That page does not exist. The sixteen type pages live at their own four letters, like /infj, and the test is at the front door.</p>
        <a class="btn btn-primary" href="/">Go to the front page</a>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>Not affiliated with or endorsed by The Myers-Briggs Company.</p>
  </footer>
</body>
</html>
```

- [ ] **Step 6: Write `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://personality.ryanxu.dev/sitemap.xml
```

- [ ] **Step 7: Check the 404 page renders**

Run: `open 404.html`
Expected: it renders with the site's dark palette. The stylesheet is at `/app.css`, so under `file://` it will be unstyled; that is correct and expected, and it is exercised properly by the smoke tests in Task 5. Confirm the text and the link are right.

- [ ] **Step 8: Run the whole suite**

Run: `npm test`
Expected: 0 failed, 0 skipped.

- [ ] **Step 9: Commit**

```bash
git add 404.html robots.txt test/serve.js test/serve.test.js
git commit -m "a3: a real 404 page, robots, and an HTTP test server

Every unknown path on the live site currently returns 200 with the homepage,
which Google reads as duplicate content. The test server exists because a
file:// page cannot exercise /enfj, a 404 status, or the History API."
```

---

## Task 5: Staging script, smoke coverage, and the workflow

**Files:**
- Create: `scripts/stage.js`
- Test: `test/stage.test.js` (create)
- Modify: `test/smoke.test.js`
- Modify: `.github/workflows/deploy.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes from Task 2: `require("../scripts/build-types.js").build(outDir)`.
- Consumes from Task 4: `require("./serve.js").start(dir)`.
- Produces: `require("../scripts/stage.js").stage(outDir)` -> writes the exact deploy directory and returns the list of top-level entries. CLI: `node scripts/stage.js [outDir]`, default `public`.

**Why staging moves out of the YAML:** the smoke tests must exercise the artifact that actually gets deployed. If the test builds its own copy of the site and the workflow builds another, the test can pass while the deploy is wrong. One script, used by both.

- [ ] **Step 1: Write the failing staging test**

Create `test/stage.test.js`:

```javascript
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const stage = require("../scripts/stage.js");

test("the deploy directory holds the public site and nothing else", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    const top = fs.readdirSync(dir).sort();
    const expectedTypes = [
      "enfj", "enfp", "entj", "entp", "esfj", "esfp", "estj", "estp",
      "infj", "infp", "intj", "intp", "isfj", "isfp", "istj", "istp"
    ];
    const expected = ["404.html", "app.css", "index.html", "js", "robots.txt", "sitemap.xml"]
      .concat(expectedTypes).sort();
    assert.deepStrictEqual(top, expected);

    /* This leak was shipped once already. Assert the negative directly. */
    ["docs", "test", "scripts", ".github", ".superpowers", "package.json",
     "package-lock.json", ".gitignore", ".pagesignore", "node_modules"]
      .forEach((name) => {
        assert.ok(!fs.existsSync(path.join(dir, name)), name + " must never reach the deploy directory");
      });

    const js = fs.readdirSync(path.join(dir, "js")).sort();
    assert.deepStrictEqual(js, [
      "app.js", "flow.js", "items.js", "ns.js", "render.js", "score.js", "share.js", "types.js"
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("staging twice in a row leaves no stale files behind", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    fs.writeFileSync(path.join(dir, "leftover.html"), "stale");
    stage.stage(dir);
    assert.ok(!fs.existsSync(path.join(dir, "leftover.html")), "staging must clear the directory first");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/stage.test.js`
Expected: FAIL, "Cannot find module '../scripts/stage.js'".

- [ ] **Step 3: Write the staging script**

Create `scripts/stage.js`:

```javascript
"use strict";
/* Builds the exact directory that gets deployed. Both the workflow and the
   smoke tests call this, so the tests exercise the real artifact rather than
   a second, hopefully-identical copy of it.

   The list below is an allowlist on purpose. Everything not named here stays
   out, whatever else is sitting in the repo. */

const fs = require("node:fs");
const path = require("node:path");
const buildTypes = require("./build-types.js");

const ROOT = path.resolve(__dirname, "..");
const FILES = ["index.html", "app.css", "404.html", "robots.txt"];
const DIRS = ["js"];

function stage(outDir) {
  const out = path.resolve(outDir);
  if (out === ROOT) { throw new Error("stage: refusing to stage over the repo root"); }
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  FILES.forEach(function (name) {
    fs.copyFileSync(path.join(ROOT, name), path.join(out, name));
  });
  DIRS.forEach(function (name) {
    fs.cpSync(path.join(ROOT, name), path.join(out, name), { recursive: true });
  });

  buildTypes.build(out);
  return fs.readdirSync(out).sort();
}

module.exports = { stage, FILES, DIRS };

if (require.main === module) {
  const out = process.argv[2] || "public";
  const entries = stage(out);
  process.stdout.write("stage: " + entries.length + " entries in " + path.resolve(out) + "\n");
}
```

- [ ] **Step 4: Run the staging test and watch it pass**

Run: `node --test test/stage.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add the npm scripts**

In `package.json`, extend `scripts`:

```json
  "scripts": {
    "test": "node --test test/*.test.js",
    "stage": "node scripts/stage.js public",
    "serve": "node test/serve.js public"
  },
```

Verify: `npm run stage && npm run serve` then open the printed URL, click into `/infj`, and stop the server.

- [ ] **Step 6: Write the failing HTTP smoke tests**

Append to `test/smoke.test.js`. Keep everything already in that file, including the CI guard that throws when chromium is missing and both existing `file://` tests. Add near the top, after the existing `PAGE_URL` constant:

```javascript
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
```

Then append these tests:

```javascript
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
  } finally {
    await browser.close();
  }
});
```

Also rename the two existing `file://` tests so their purpose is unmistakable, changing only their titles:

- `"an all-neutral run reaches the reveal with the second-self card, and the share card draws under it"` becomes `"file://: an all-neutral run reaches the reveal with the second-self card, and the share card draws under it"`
- `"a decisive run reaches the reveal with no second-self card, and the share card draws under it"` becomes `"file://: a decisive run reaches the reveal with no second-self card, and the share card draws under it"`

They are the guard for the parent spec's "opens by double-clicking" constraint, and they are the tests that catch an unwrapped `pushState`.

- [ ] **Step 7: Run the smoke tests and watch them pass**

Run: `node --test test/smoke.test.js`
Expected: PASS, 8 tests, 0 skipped.

If `test.before` is not available in this Node version, check `node --version` (the workflow pins 22, where it is). Do not work around it by moving staging into each test.

- [ ] **Step 8: Prove the new tests can fail**

Do each of these, confirm the named test fails, then undo it. A test that cannot fail is not a test, and this project has shipped four of those.

```bash
# 1. Break the 404: staging drops the 404 page.
#    Expect "the served site answers the status codes..." to still 404 (the
#    server falls back), but "the 404 page is served..." to fail on the
#    noindex assertion.
# 2. Break the deep link: comment out the data-initial-type read in render.js.
#    Expect "landing on a type URL shows that type with no intro" to fail.
# 3. Break the result URL: change replaceState to a no-op in render.js.
#    Expect "finishing the test leaves the address bar at the result's own URL" to fail.
# 4. Break the anchors: change the gallery <a> back to a <button>.
#    Expect "gallery cards are real links" to fail.
# 5. Break the generator: make headFor return the homepage title.
#    Expect "the raw HTML of /enfj carries ENFJ's head" and several
#    build-types tests to fail.
```

Record in the task report which of the five you ran and what failed.

- [ ] **Step 9: Update the workflow**

In `.github/workflows/deploy.yml`, replace the whole `Stage only the public site` step with:

```yaml
      - name: Stage only the public site
        run: node scripts/stage.js public
```

Leave every other step alone: the checkout, the Node 22 pin, `npm install`, the chromium install, and `npm test` all stay exactly as they are, and `npm test` still runs before the staging step so a red suite blocks the deploy.

- [ ] **Step 10: Update `.pagesignore`'s note**

`.pagesignore` documents what must never ship. Add `scripts/` to its list, and add one line to its explanatory comment noting that `scripts/stage.js` is now the thing that actually enforces the allowlist, and that `test/stage.test.js` asserts it.

- [ ] **Step 11: Run the whole suite and check the staged output by hand**

Run: `npm test`
Expected: 0 failed, 0 skipped, and a total above the previous 36.

```bash
npm run stage
ls public
grep -c '<loc>' public/sitemap.xml
grep -o '<title>[^<]*</title>' public/*/index.html | sort
```

Expected: `public` holds exactly the six named files and directories plus sixteen type directories; 17 locs; sixteen distinct titles, each `Name (CODE)`, none naming the indicator.

- [ ] **Step 12: Commit**

```bash
git add scripts/stage.js test/stage.test.js test/smoke.test.js .github/workflows/deploy.yml package.json .pagesignore
git commit -m "a3: stage through a tested script, and smoke-test the real artifact over HTTP

The staging list moves out of the workflow YAML and into scripts/stage.js so
the smoke tests exercise the same directory the deploy uploads. The new tests
drive a browser at real URLs: /enfj, a 404, an anchor click, and the address
bar after finishing."
```

---

## Task 6: Deploy and verify against the live site

Nothing in tasks 1 to 5 proves anything about Cloudflare Pages. The test server mimics Pages; it does not speak for it. In particular, whether a `404.html` at the root of a direct-upload deploy turns today's 200-with-the-homepage into a real 404 is an assumption until it is measured.

**Files:** none. This task is verification.

- [ ] **Step 1: Record the "before" so the change is provable**

```bash
for p in "/" "/enfj" "/totally-made-up-path" "/robots.txt" "/sitemap.xml"; do
  printf "%-24s " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "https://personality.ryanxu.dev$p"
done
```

Expected before the deploy: `200 200 200 200 200`. That is the bug.

- [ ] **Step 2: Merge to main and watch the run**

```bash
git push
gh run watch
```

Expected: the run is green, `npm test` reports 0 skipped, and the wrangler step uploads the staged directory.

If `npm test` reports any skipped test, stop. A skipped smoke test is the failure mode this project has already fixed once, and a green gate that skipped it is worse than a red one.

- [ ] **Step 3: Verify the status codes on the live site**

```bash
for p in "/" "/enfj" "/infj" "/totally-made-up-path" "/a/b/c" "/robots.txt" "/sitemap.xml"; do
  printf "%-24s " "$p"
  curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://personality.ryanxu.dev$p"
done
```

Expected: `200`, `200`, `200`, **`404`**, **`404`**, `200 text/plain`, `200` xml.

If the garbage paths still return 200, the `404.html` file alone is not enough for this Pages project. Investigate before declaring the task done: check the project's not-found handling in the Cloudflare dashboard or via `npx wrangler pages project list`, and fix it there. Do not mark the task complete with a soft 404 still live.

- [ ] **Step 4: Verify the head of every one of the sixteen live pages**

```bash
for c in intj intp entj entp infj infp enfj enfp istj isfj estj esfj istp isfp estp esfp; do
  printf "%-6s " "$c"
  curl -s "https://personality.ryanxu.dev/$c" \
    | grep -oE '<title>[^<]*</title>|<link rel="canonical" href="[^"]*">' | tr '\n' ' '
  echo
done
```

Expected: sixteen distinct titles of the form `Name (CODE)`, and sixteen canonicals each pointing at its own URL. Confirm by eye that no title contains the indicator and that no two lines are identical.

- [ ] **Step 5: Verify the sitemap and that the pages read without JavaScript**

```bash
curl -s https://personality.ryanxu.dev/sitemap.xml | grep -c '<loc>'
curl -s https://personality.ryanxu.dev/robots.txt
curl -s https://personality.ryanxu.dev/infj | grep -c "Clocks the room before they are through the door"
```

Expected: `17`, the robots body naming the sitemap, and at least `1` for the line appearing in the raw HTML.

- [ ] **Step 6: Drive the live site in a browser**

Load `https://personality.ryanxu.dev/enfj` and confirm by eye:

1. ENFJ appears immediately, with no flicker of the intro screen.
2. "Take the test" is below the type content and starts the test, and the address bar returns to `/`.
3. "See all sixteen", then a card, moves the address bar to that type. Browser Back returns to `/enfj`.
4. Middle-clicking a gallery card opens that type in a new tab at its own URL.
5. Taking the test to the end leaves the address bar at `/<code>`, and the share card still downloads.
6. The console is empty throughout.

- [ ] **Step 7: Confirm no private file was published**

```bash
for p in "/package.json" "/docs/superpowers/specs/2026-09-06-personality-design.md" "/test/smoke.test.js" "/scripts/stage.js" "/.github/workflows/deploy.yml"; do
  printf "%-60s " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "https://personality.ryanxu.dev$p"
done
```

Expected: `404` for every one.

- [ ] **Step 8: Update the specs to say this is done**

In `docs/superpowers/specs/2026-09-06-personality-design.md` §5.4, replace the whole three-line "NOT IMPLEMENTED" paragraph with:

```markdown
**Implemented by piece A3, 2026-09-07.** Each type has its own pre-rendered
URL at `/<code>`, carrying its own title, description, canonical and og tags
in the initial response, and its own copy in static HTML. Plan:
`docs/superpowers/plans/2026-09-07-piece-a3-type-pages.md`. The personal-site
projects.ts card in §11.3 is now unblocked.
```

In `docs/superpowers/specs/2026-09-07-piece-a3-type-pages.md`, change the status line to `**Status:** shipped 2026-09-07.` and append this to §5, so the rulings travel with the design:

```markdown
### Rulings

1. **Gallery links:** yes, real anchors, with plain left clicks intercepted so
   flow state survives browsing. Modified clicks navigate for real.
2. **Type page scope:** type content first, test call to action below it,
   shown on any read-only type page and hidden on your own result.
3. **og:image:** out of A3, its own piece. Sixteen rendered cards need a
   headless browser in CI and their own verification story.
```

- [ ] **Step 9: Commit the spec updates**

```bash
git add docs/superpowers/specs
git commit -m "docs: a3 is live, sixteen type URLs shipped"
git push
```

---

## Success criteria

Taken from A3 design §6, plus what this plan added. Every one is checked by a named test or a named command in Task 6.

| Criterion | Proved by |
|---|---|
| `/enfj` returns 200 with a title naming ENFJ's type and a self-referencing canonical | Task 5 HTTP smoke test; Task 6 step 3 and 4 |
| Sixteen distinct titles, sixteen distinct canonicals, no duplicates | `test/build-types.test.js`; Task 6 step 4 |
| A garbage path returns 404, not 200 | `test/serve.test.js`, Task 5 HTTP smoke test; Task 6 step 3 |
| Finishing the test leaves the address bar at `/<code>` | Task 5 browser smoke test; Task 6 step 6 |
| `sitemap.xml` lists seventeen URLs and validates | `test/build-types.test.js`; Task 6 step 5 |
| The indicator appears in no title or `og:` tag on any of the sixteen pages | `test/build-types.test.js`; Task 6 step 4 |
| `npm test` green, smoke tests running in CI, not skipping | Task 6 step 2 |
| No flash of the intro on a deep link | Raw-HTML assertion in Task 5; Task 6 step 6 |
| The type page also offers the test | Task 5 browser smoke test |
| Gallery cards are crawlable anchors | Task 5 browser smoke test |
| `index.html` still opens from the filesystem with an empty console | The two `file://` smoke tests |
| Nothing private is published | `test/stage.test.js`; Task 6 step 7 |

## Out of scope, deliberately

- `og:image` and per-type share images. Its own piece.
- Locale prefixes `/zh-cn/enfj` and friends. Piece B. The URL scheme is frozen here so B does not have to renegotiate it.
- A `/sixteen` URL for the gallery. The gallery stays an in-page overlay in this piece.
- The `personal-site` `projects.ts` card. Add it only after Task 6 passes, per parent spec §11.3.
