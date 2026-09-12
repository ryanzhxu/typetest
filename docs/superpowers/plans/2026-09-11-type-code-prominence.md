# Personality — Type-code prominence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bare four-letter type code (`ENFJ`, `INFP`, ...) the visual headline everywhere a result appears, and demote the site's invented type name (`Warm Front`, `暖锋`, ...) to a smaller subline underneath it. The code is the only unowned, non-trademarked element of a four-letter test; the invented name stays exactly as written (no content rewrite, no new copy, no new translation work) but stops competing with the code for top billing.

**Why this and not renaming the types:** the parent spec (`docs/superpowers/specs/2026-09-06-personality-design.md` §3.2) forbids reusing any name, phrasing, or item from an existing instrument. The recognizable "official" type nicknames (16Personalities' Protagonist/Campaigner/etc., Keirsey's Teacher/Champion/etc.) are trademarks owned by competing commercial testing companies, not free MBTI vocabulary, so adopting them site-wide would violate that constraint and create real trademark exposure for a competing commercial product. This plan is the alternative the project owner chose after that tradeoff was raised: lean on the one truly official, unowned element (the code) instead of adopting a rival's trademarked terms.

**Classification:** Bounded (per superpowers:brainstorming). Design was presented in chat and approved. No spec file beyond this plan; the binding constraints are the parent spec's, copied below.

**Architecture:** Pure visual/data-order swap. No new markup, no new IDs, no new IPC between modules. Three independent surfaces already show the pair (code, name) and each swaps which one gets primary weight:
1. On-screen reveal and type views (`index.html` + `app.css`) — swap which of the two existing elements is the semantic heading (`<h2>`) and which is a caption (`<p>`), and swap their CSS treatment. `js/render.js`'s `focusView()` already does `section.querySelector("h1, h2")` generically, so it needs no change — focus automatically follows whichever element is the `<h2>` after the swap.
2. The canvas share card (`js/share.js`) — swap which string gets the large headline-fit treatment and which gets the small letter-spaced treatment.
3. SEO/page titles (`js/locale-en.js`, `js/locale-zh-cn.js`, `js/locale-zh-hk.js`, `js/locale-zh-tw.js`) — swap the two placeholders' order inside each locale's existing `seo.title` format string. No new strings, no new locale keys.

**Tech Stack:** Vanilla HTML/CSS/JS, `node:test` + `node:assert`, Playwright smoke tests. No build-time or runtime dependency changes.

**Parent spec (binding):** `docs/superpowers/specs/2026-09-06-personality-design.md`

---

## Global Constraints

Copied from the parent spec. Every task's requirements implicitly include this section.

- **Never name the well-known indicator** in a page title, `og:title`, filename, directory name, domain, or commit message.
- **No item, phrasing, or type name is taken from any existing instrument.** This plan does not touch the invented names' text at all — it only changes which of (code, name) is visually primary. Do not use this plan as a pretext to also rewrite any name string.
- **No em-dashes or en-dashes anywhere in shipped copy.**
- **No contractions** in shipped copy.
- **`index.html` must still open by double-clicking it from the filesystem** and run the whole test with no console errors.
- **Zero runtime dependencies.**
- **Four locales, hand-written, no fallback chain.**

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `index.html` | Modify | Swap `<h2>`/`<p>` tags between the code and name elements, reveal and type views |
| `app.css` | Modify | Swap `.reveal-code`/`.reveal-name` and `.type-code`/`.type-name` visual weight |
| `js/share.js` | Modify | Swap which string (code vs. name) gets the large headline draw and which gets the small letter-spaced draw |
| `js/locale-en.js` | Modify | Reorder `seo.title` placeholders: `{code} ({name})` |
| `js/locale-zh-cn.js` | Modify | Reorder `seo.title` placeholders (full-width brackets, no space) |
| `js/locale-zh-hk.js` | Modify | Reorder `seo.title` placeholders (full-width brackets, no space) |
| `js/locale-zh-tw.js` | Modify | Reorder `seo.title` placeholders (full-width brackets, no space) |
| `test/smoke.test.js` | Modify | Update the one hardcoded focus-target assertion (`type-name` → `type-code`) |
| `test/build-types.test.js` | Modify | Update the two hardcoded tag assertions (code is now `</h2>`, name is now `</p>`) |
| `test/i18n.test.js` | Modify | Update the two hardcoded `seo.title` expected strings to the new placeholder order |

`js/render.js` and `scripts/build-types.js` need **no changes**: both already work by element ID, not by which tag is used, and `focusView()` already finds whichever element is `<h1>`/`<h2>` generically.

## Task order and parallelism

Sequential. All three tasks are small; dispatch one implementer at a time per this skill's rule against parallel implementers. None blocks the others technically, but doing the on-screen swap first (Task 1) gives the clearest visual confirmation that the direction is right before touching the share card and titles.

```
Task 1 -> Task 2 -> Task 3
```

---

## Task 1: On-screen reveal and type views

**Files:**
- Modify: `index.html`
- Modify: `app.css`
- Modify: `test/smoke.test.js`
- Modify: `test/build-types.test.js`

**Interfaces:**
- Consumes: nothing new. `js/render.js` already fills `#reveal-code`, `#reveal-name`, `#type-code`, `#type-name` by ID (`el.revealCode.textContent = result.code`, etc. in `renderReveal()`/`renderTypeContent()`), and `scripts/build-types.js` already fills `type-code`/`type-name` by ID via `fillById()`. Neither needs to change: element IDs and their meaning (code goes in the `-code` element, name goes in the `-name` element) are unchanged. Only which HTML tag each ID sits on, and each one's CSS class rules, change.
- Produces: `#type-code`/`#reveal-code` become the `<h2>` (the heading `focusView()` will focus), `#type-name`/`#reveal-name` become `<p>`.

- [ ] **Step 1: Read current state to confirm nothing has drifted**

Run:
```bash
grep -n "reveal-code\|reveal-name\|type-code\|type-name" index.html
sed -n '514,601p' app.css
```
Confirm the reveal view has `<p id="reveal-code" class="reveal-code">` then `<h2 id="reveal-name" class="reveal-name">`, and the type view has `<p id="type-code" class="type-code">` then `<h2 id="type-name" class="type-name">`. Confirm the CSS block matches:
```css
.reveal-code {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.35em;
  color: var(--muted);
  text-transform: uppercase;
}

.reveal-name {
  font-size: clamp(2rem, 5vw, 2.6rem);
}
```
and the equivalent `.type-code` / `.type-name` block further down. If either has drifted from this, stop and report rather than guessing at the diff.

- [ ] **Step 2: Swap the tags in `index.html`**

In the `#view-reveal` section, change:
```html
<p id="reveal-code" class="reveal-code"></p>
<h2 id="reveal-name" class="reveal-name"></h2>
```
to:
```html
<h2 id="reveal-code" class="reveal-code"></h2>
<p id="reveal-name" class="reveal-name"></p>
```

In the `#view-type` section, change:
```html
<p id="type-code" class="type-code"></p>
<h2 id="type-name" class="type-name"></h2>
```
to:
```html
<h2 id="type-code" class="type-code"></h2>
<p id="type-name" class="type-name"></p>
```

Do not touch `#second-self-name` (`<h3>`) or any other element in either view.

- [ ] **Step 3: Swap the CSS declarations in `app.css`**

Replace the `.reveal-code` / `.reveal-name` pair (around line 522) with:
```css
.reveal-code {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.6rem);
  letter-spacing: 0.12em;
  color: var(--text);
  text-transform: uppercase;
}

.reveal-name {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--muted);
}
```

Replace the `.type-code` / `.type-name` pair (around line 586) with:
```css
.type-code {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.6rem);
  letter-spacing: 0.12em;
  color: var(--text);
  text-transform: uppercase;
}

.type-name {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--muted);
}
```

Do not reorder the rules relative to the rest of the file, and do not touch `.second-self-kicker`, `.reveal-line`, `.type-paragraph`, or anything else nearby.

- [ ] **Step 4: Update the two hardcoded tag assertions in `test/build-types.test.js`**

Find (around line 214-215):
```javascript
    assert.ok(html.includes(">" + code + "</p>"), code + " code text");
    assert.ok(html.includes(">" + t.name + "</h2>"), code + " name text");
```
Change to:
```javascript
    assert.ok(html.includes(">" + code + "</h2>"), code + " code text");
    assert.ok(html.includes(">" + t.name + "</p>"), code + " name text");
```

Find (around line 231, inside the Chinese-locale test):
```javascript
    assert.ok(html.includes(">" + t.name + "</h2>"), loc + " lost its type name");
```
Change to:
```javascript
    assert.ok(html.includes(">" + t.name + "</p>"), loc + " lost its type name");
```

- [ ] **Step 5: Update the one hardcoded focus-target assertion in `test/smoke.test.js`**

Find (around line 376-380):
```javascript
    assert.deepStrictEqual(
      await page.evaluate(() => [document.activeElement.tagName, document.activeElement.id]),
      ["H2", "type-name"],
      "a card click must move focus to the new heading"
    );
```
Change the expected array to:
```javascript
      ["H2", "type-code"],
```
Leave the surrounding code, comment, and every other assertion in the file untouched. Do not search-and-replace `type-name`/`type-code` anywhere else in this file: every other occurrence reads text content by ID and its expected value (a name string or a code string) is unchanged.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: 0 failed, 0 skipped. Playwright must be installed for the smoke tests to run (`npx playwright install chromium` if needed, matching however this repo's CI already provisions it — check `.github/workflows/` if unsure, do not add a new dependency).

- [ ] **Step 7: Open the page by hand and confirm the swap reads correctly**

Run: `open index.html`, take the test to a result. Confirm the four-letter code is now the large heading and the invented name sits smaller beneath it, in both light and dark color schemes (toggle OS appearance or use browser devtools' `prefers-color-scheme` emulation). Click "See all sixteen", open a type card, and confirm the same hierarchy holds there too.

- [ ] **Step 8: Commit**

```bash
git add index.html app.css test/smoke.test.js test/build-types.test.js
git commit -m "Make the four-letter code the headline, and the invented name its caption

The code is the only unowned, non-trademarked piece of a four-letter test.
Reusing the well-known indicator's trademarked nicknames (16Personalities'
Protagonist/Campaigner/etc., Keirsey's Teacher/Champion/etc.) would violate
the parent spec's ban on reusing another instrument's names and would be
real trademark exposure for a competing commercial product. This swaps
visual weight only: the invented name (Warm Front, etc.) is unchanged text,
just demoted to a subline under the code.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7"
```

---

## Task 2: Share card

**Files:**
- Modify: `js/share.js`

**Interfaces:**
- Consumes: nothing new. `buildCanvas(result, frauncesLoaded)` already has `type.name` and `result.code` in scope.
- Produces: no exported signature changes. `SG.share.draw`/`SG.share.setResult` (consumed by `js/render.js` and exercised by `test/smoke.test.js`'s `shareCardBlobInfo` helper) are unaffected; only the pixels drawn inside `buildCanvas` change.

- [ ] **Step 1: Read the current draw order**

Run: `sed -n '99,174p' js/share.js`
Confirm the current order is: code drawn with `drawSpaced` at 44px (peach), then `type.name` drawn at up to 104px via `fitHeadlineSize` (main text color), then the caveat line, then (if close) the second-self comparison using `type.name`/`secondType.name` as left/right labels under the blend bar.

- [ ] **Step 2: Swap the code and name draw calls**

Replace:
```javascript
    ctx.font = "44px " + headlineFamily;
    ctx.fillStyle = PEACH;
    drawSpaced(ctx, result.code, CENTER_X, cursorY, 22);
    cursorY += 150;

    var nameSize = fitHeadlineSize(ctx, type.name, MAX_W, headlineFamily, 104, 56);
    ctx.font = nameSize + "px " + headlineFamily;
    ctx.fillStyle = TEXT;
    ctx.fillText(type.name, CENTER_X, cursorY);
    cursorY += Math.round(nameSize * 0.55) + 80;
```
with:
```javascript
    var codeSize = fitHeadlineSize(ctx, result.code, MAX_W, headlineFamily, 104, 56);
    ctx.font = codeSize + "px " + headlineFamily;
    ctx.fillStyle = TEXT;
    drawSpaced(ctx, result.code, CENTER_X, cursorY, Math.round(codeSize * 0.18));
    cursorY += Math.round(codeSize * 0.55) + 80;

    ctx.font = "36px " + headlineFamily;
    ctx.fillStyle = PEACH;
    ctx.fillText(type.name, CENTER_X, cursorY);
    cursorY += 150;
```

Notes on this swap:
- `fitHeadlineSize` measures plain `ctx.measureText`, which is correct for `result.code` here even though the actual draw uses `drawSpaced` (letter-spacing only ever narrows the safety margin `fitHeadlineSize` already leaves; it does not need to model the exact spacing).
- Letter-spacing scales with the new size (`codeSize * 0.18`) rather than staying a fixed `22`, so a 4-letter code stays legibly spaced whether it lands at 104px or has shrunk toward the 56px floor on a long-named type's card.
- The name gets `36px` (not letter-spaced, not measured with `fitHeadlineSize`) because it is prose-like and short by construction (the longest current name is two words); do not add a fitting/wrapping call that was not asked for.

- [ ] **Step 3: Leave the second-self comparison as-is**

Do not change the block that draws `secondType.name + " is in you too."` or the peach/lilac blend-bar labels (`type.name` / `secondType.name` under the bar). Comparing two names there still reads naturally and was not part of the approved design; touching it is out of scope for this task.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: 0 failed, 0 skipped. The smoke tests only check the share card's blob type/size (see `shareCardBlobInfo` in `test/smoke.test.js`), not pixel content, so they should pass unchanged.

- [ ] **Step 5: Generate a real card by hand and look at it**

Run: `open index.html`, complete the test, and use the page's own "Share your card" action (or, if that triggers a real download you would rather avoid, evaluate `window.SG.share.draw(window.__smokeResult || <a result object>)` in the browser console the way `test/smoke.test.js` does) to produce a PNG. Confirm the four-letter code now reads as the large headline and the name sits beneath it as a smaller peach line, and that a long name (check `ISFJ`/`Safe Harbour`-length names in English and the longest Chinese names) does not overrun the card width.

- [ ] **Step 6: Commit**

```bash
git add js/share.js
git commit -m "Match the share card to the on-screen code/name hierarchy

Same reasoning as the on-screen swap: the code is the only unowned element
of a four-letter test, so it gets the card's headline treatment; the
invented name becomes a smaller line underneath it, unchanged text.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7"
```

---

## Task 3: SEO/page titles, all four locales

**Files:**
- Modify: `js/locale-en.js`
- Modify: `js/locale-zh-cn.js`
- Modify: `js/locale-zh-hk.js`
- Modify: `js/locale-zh-tw.js`
- Modify: `test/i18n.test.js`

**Interfaces:**
- Consumes: nothing new. `SG.i18n.format("seo.title", { name, code }, locale)` (used by `js/render.js`'s `titleForCode()` and `scripts/build-types.js`'s `titleFor()`) already receives both `name` and `code`; only the template string each locale registers changes.
- Produces: no signature change to `I18N.format`. Titles read `{code} (Name)` / `{code}（名字）` instead of `{name} (CODE)` / `{名字}（CODE）`.

- [ ] **Step 1: Confirm the current templates**

Run:
```bash
grep -n "seo:" -A5 js/locale-en.js js/locale-zh-cn.js js/locale-zh-hk.js js/locale-zh-tw.js
```
Confirm each has a `title` line reading `"{name} ({code})"` (English) or `"{name}（{code}）"` (all three Chinese locales, full-width brackets, no space). If any locale's format differs from this, stop and report rather than guessing.

- [ ] **Step 2: Reorder the placeholders in each locale file**

In `js/locale-en.js`, change:
```javascript
      title: "{name} ({code})",
```
to:
```javascript
      title: "{code} ({name})",
```

In each of `js/locale-zh-cn.js`, `js/locale-zh-hk.js`, `js/locale-zh-tw.js`, change:
```javascript
      title: "{name}（{code}）",
```
to:
```javascript
      title: "{code}（{name}）",
```

Do not touch the `description` line in any of the four files: `seo.description` already leads with `{line}` and mentions `{code}` in the body text, which is a different concern (a search-result snippet, not a headline) and was not part of the approved design.

- [ ] **Step 3: Update the two hardcoded expectations in `test/i18n.test.js`**

Find (around line 47-52):
```javascript
test("a template keeps its pieces in the order its own language wants", () => {
  assert.strictEqual(I18N.format("seo.title", { name: "Deep Water", code: "INTJ" }, "en"),
    "Deep Water (INTJ)");
  assert.strictEqual(I18N.format("seo.title", { name: "深潭", code: "INTJ" }, "zh-hk"),
    "深潭（INTJ）", "Chinese uses full-width brackets, not a space and an ASCII pair");
});
```
Change to:
```javascript
test("a template keeps its pieces in the order its own language wants", () => {
  assert.strictEqual(I18N.format("seo.title", { name: "Deep Water", code: "INTJ" }, "en"),
    "INTJ (Deep Water)");
  assert.strictEqual(I18N.format("seo.title", { name: "深潭", code: "INTJ" }, "zh-hk"),
    "INTJ（深潭）", "Chinese uses full-width brackets, not a space and an ASCII pair");
});
```
The test's own point (bracket style and spacing differ by language, even though the values passed in are identical) is unchanged; only which placeholder leads has moved. Do not rename or restructure the test.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: 0 failed, 0 skipped. `test/smoke.test.js`'s title assertions call `I18N.format("seo.title", ...)` directly rather than hardcoding the expected string, so they should pass with no changes.

- [ ] **Step 5: Generate one page by hand and read its title**

Run:
```bash
node scripts/build-types.js /tmp/title-check
grep "<title>" /tmp/title-check/enfj.html
grep "<title>" /tmp/title-check/zh-cn/enfj.html 2>/dev/null || true
```
Expected: `<title>ENFJ (Warm Front)</title>` for English, and the code leading with full-width brackets for any Chinese output present. (If the generator's Chinese output lands at a different path, find it under `/tmp/title-check` rather than assuming the path above.)

- [ ] **Step 6: Run the whole suite once more and commit**

```bash
npm test
git add js/locale-en.js js/locale-zh-cn.js js/locale-zh-hk.js js/locale-zh-tw.js test/i18n.test.js
git commit -m "Lead every page title with the code, not the invented name

Same reasoning as the on-screen and share-card swaps. Reorders the existing
seo.title placeholder in all four locales; no new copy, no new keys.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7"
```
