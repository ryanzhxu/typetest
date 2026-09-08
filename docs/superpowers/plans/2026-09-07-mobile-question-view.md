# Mobile Question View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the question view work on a phone by replacing the two-statement
scale with one statement on a seven-point agree scale, on a dot row that cannot
overflow, centred vertically.

**Architecture:** The item bank gains a `show` field naming which pole appears.
`js/render.js` converts between screen space, where 1 is Strongly agree, and
pole space, where 1 is the first pole, at the view boundary and nowhere else, so
`js/flow.js` and `js/score.js` are untouched. The dot row changes from seven
rigid 44px boxes to seven proportional ones that share the available width.

**Tech Stack:** Vanilla HTML, CSS and ES5-style JS. No framework, no bundler.
`node --test` plus Playwright for browser tests.

**Spec:** `docs/superpowers/specs/2026-09-07-mobile-question-view.md`

## Global Constraints

- **No build step.** `index.html` must keep opening by double-clicking it from
  the filesystem. Deploy-time generators are permitted.
- **No dependencies added.** Playwright stays the only devDependency.
- **House style, enforced by tests.** No em-dashes or en-dashes in shipped copy.
  No contractions: write "do not", "cannot", "it is". British spelling. Second
  person, present tense.
- **No percentages, no plus-minus figures, and never the word "margin" on any
  user-facing surface.** `test/smoke.test.js` scans the rendered body for all
  three.
- **No storage of any kind.** No `localStorage`, no cookies. The intro promises
  "No account. Nothing saved. Nothing sent anywhere." and this work does not
  touch that promise.
- **`js/score.js` does not change.** Its inputs stay in pole space.
- **Every JS file is an IIFE hanging one namespace off `SG`**, and every file
  must stay requireable from node without a DOM at require time.

---

### Task 1: Land the uncommitted Next button work

The working tree already contains report 3, fixed. It must land on its own so
that the rest of this plan produces a reviewable diff.

**Files:**
- Modify: `app.css`, `index.html`, `js/render.js`, `test/smoke.test.js` (all
  already edited, uncommitted)

**Interfaces:**
- Consumes: nothing
- Produces: a clean working tree, and `#btn-next` present in `index.html`

- [ ] **Step 1: Confirm the suite is green before touching anything**

Run: `npm test 2>&1 | tail -5`
Expected: `pass 104`, `fail 0`

- [ ] **Step 2: Read the diff and confirm it is only the Next button change**

Run: `git --no-pager diff --stat`
Expected: four files, `app.css`, `index.html`, `js/render.js`,
`test/smoke.test.js`. Nothing else.

- [ ] **Step 3: Commit**

```bash
git add app.css index.html js/render.js test/smoke.test.js
git commit -m "$(cat <<'MSG'
feat: a Next button, so a chosen dot is visible before it commits

Choosing a dot advanced on a 250ms timer, which meant the reader could
barely see what they had picked before the question changed. The dot now
only ever updates the reading, and Next commits it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 2: The viewport regression test, which must fail

This is the guard that stops the reported bug returning. Written first, and it
must fail on the current code, or it is not testing anything.

**Files:**
- Create: `test/viewport.test.js`

**Interfaces:**
- Consumes: `index.html` element ids `#btn-nav-sixteen`, `#btn-back-flow`,
  `#btn-start`, `#q-dots`, `#btn-next`, `#btn-keep-both`, `#btn-continue`,
  `#view-question`
- Produces: nothing other tasks consume

- [ ] **Step 1: Write the failing test**

Create `test/viewport.test.js`:

```js
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
```

- [ ] **Step 2: Run it and confirm it fails on the question view**

Run: `node --test test/viewport.test.js 2>&1 | tail -30`
Expected: FAIL at all three widths. The 390px failure must name
`div.dot-row escapes its parent`. The 320px failure must additionally name
`the page overflows by 52px`. Intro, sixteen, reveal and type must not appear
in any failure list.

- [ ] **Step 3: Commit the failing test**

```bash
git add test/viewport.test.js
git commit -m "$(cat <<'MSG'
test: measure every view at three phone widths, and fail

The question view's dot row is a rigid 308px, so it bursts a card whose
content box is 262px at 390px. This test names that, and the other four
views measure clean.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 3: Name which pole each item shows

**Files:**
- Modify: `js/items.js` (all 68 items gain `show`)
- Test: `test/items.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: every object in `SG.items.core` and `SG.items.tiebreak` gains
  `show`, a string that is exactly `"a"` or `"b"`. `axis`, `a` and `b` are
  unchanged.

**The assignment rule.** Alternate by position within each axis block, starting
at `"a"`. Nine core items per axis gives five `"a"` and four `"b"`; eight
tiebreak items gives four and four. Override the alternation where one pole
does not stand up on its own, and take a matching override the other way inside
the same axis so the count stays within one. The four poles that must never be
shown alone, because each reads as a fragment without its partner:

- `"I press buttons."`
- `"I would attend, briefly."`
- `"I see what we feel like."`
- `"I tidy instead of working, later."`

- [ ] **Step 1: Write the failing tests**

Append to `test/items.test.js`:

```js
test("every item names which pole it shows", () => {
  items.core.concat(items.tiebreak).forEach((it, i) => {
    assert.ok(it.show === "a" || it.show === "b",
      "item " + i + " has show=" + JSON.stringify(it.show));
  });
});

/* The whole reason the show field exists. Every item in this bank is keyed the
   same direction: a is always the first pole letter. Show a on all of them and
   agreeing would mean E, S, T and J every time, so an agreeable reader lands on
   ESTJ whoever they are. Splitting the direction cancels that in the axis mean. */
test("each axis is balanced within one, so agreeing never means the same letter twice over", () => {
  [["core", items.core], ["tiebreak", items.tiebreak]].forEach(([bankName, bank]) => {
    items.AXES.forEach((axis) => {
      const inAxis = bank.filter((it) => it.axis === axis);
      const shownA = inAxis.filter((it) => it.show === "a").length;
      const shownB = inAxis.length - shownA;
      assert.ok(Math.abs(shownA - shownB) <= 1,
        bankName + " " + axis + " shows " + shownA + " a and " + shownB + " b");
    });
  });
});

test("no pole that reads as a fragment is ever the one on screen", () => {
  const fragments = [
    "I press buttons.",
    "I would attend, briefly.",
    "I see what we feel like.",
    "I tidy instead of working, later."
  ];
  items.core.concat(items.tiebreak).forEach((it) => {
    assert.ok(fragments.indexOf(it[it.show]) === -1,
      "a fragment is on screen alone: " + it[it.show]);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `node --test test/items.test.js 2>&1 | tail -20`
Expected: FAIL, `item 0 has show=undefined`

- [ ] **Step 3: Add the show field to all 68 items**

Edit `js/items.js`. Add `show: "a"` or `show: "b"` to every object literal,
following the rule above. Replace the file comment

```js
  /* Self-authored throughout. `a` is the first pole, `b` the second. */
```

with

```js
  /* Self-authored throughout. `a` is the first pole, `b` the second.

     `show` names the one pole that appears on screen. Both are still written,
     because the pair is how each item was designed and how its opposite is
     checked, but the reader sees one statement and says how much they agree.

     The split is not decoration. Every item here is keyed the same way, with
     `a` always the first pole letter, so showing `a` throughout would make
     agreement mean E, S, T and J on all thirty-six core items. An agreeable
     reader would come out ESTJ whoever they were. Splitting the direction
     roughly evenly cancels that in the axis mean. test/items.test.js holds the
     balance to within one per axis. */
```

- [ ] **Step 4: Run and confirm it passes**

Run: `node --test test/items.test.js 2>&1 | tail -20`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add js/items.js test/items.test.js
git commit -m "$(cat <<'MSG'
feat: name which pole each item shows, split evenly per axis

Every item is keyed the same direction, so showing one pole throughout
would make agreement mean E, S, T and J on all thirty-six core items.
Splitting it cancels that in the axis mean.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 4: One statement, seven agreement points, and the inversion

**Files:**
- Modify: `index.html` (the `.scale` block inside `#view-question`)
- Modify: `js/render.js`
- Test: `test/render.test.js` (create), `test/smoke.test.js` (modify)

**Interfaces:**
- Consumes: `it.show` from Task 3
- Produces: `SG.render.flip(value, item)`, module-level, returns `8 - value`
  when `item.show === "b"`, returns `value` unchanged otherwise, and returns
  `null` for a null value. `SG.render.mount(flow)` is unchanged in signature.
  `index.html` gains `#q-statement` and loses `#q-statement-a` and
  `#q-statement-b`.

- [ ] **Step 1: Write the failing unit test**

Create `test/render.test.js`:

```js
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
  assert.strictEqual(render.flip(1, item), 7, "strongly agree with the second pole is the second pole");
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
```

- [ ] **Step 2: Run and confirm it fails**

Run: `node --test test/render.test.js 2>&1 | tail -20`
Expected: FAIL, `render.flip is not a function`

- [ ] **Step 3: Change the markup**

In `index.html`, replace the `.scale` div inside `#view-question` with:

```html
        <div class="scale">
          <p id="q-statement" class="statement" aria-live="polite"></p>
          <!-- The seven dots are built by js/render.js. They are the same seven
               values js/score.js has always read, so that file is unchanged: in
               pole space 1 is the first pole and 7 the second. On screen they
               read as agreement instead, and js/render.js turns the value over
               for an item that shows its second pole. -->
          <div class="dot-scale">
            <p class="dot-anchors" aria-hidden="true">
              <span>Agree</span>
              <span>Disagree</span>
            </p>
            <div id="q-dots" class="dot-row" role="radiogroup"
                 aria-label="How much do you agree with this statement"></div>
          </div>
        </div>
```

- [ ] **Step 4: Change the feedback strings and add flip**

In `js/render.js`, replace the `FEEDBACK` block and its comment with:

```js
  /* Dot feedback describes the answer just given, never the emerging type.

     The middle reads "Somewhere in between" and not "Neither": in js/score.js
     it counts as a real answer and narrows the honesty band, while the skip
     button beside it counts as none and widens it. Two controls that sit
     together and do opposite things have to say so. */
  var FEEDBACK = [
    "Strongly agree",
    "Agree",
    "Slightly agree",
    "Somewhere in between",
    "Slightly disagree",
    "Disagree",
    "Strongly disagree"
  ];

  /* js/flow.js and js/score.js speak pole space, where 1 is the first pole and
     7 the second. The screen speaks agreement, where 1 is Strongly agree. For
     an item showing its second pole those two run in opposite directions, so
     the value turns over here, at the view boundary, and nowhere else. That is
     what keeps js/score.js and every one of its tests untouched.

     8 - v is its own inverse, so the one function serves both directions. */
  function flip(value, item) {
    if (value === null || value === undefined) { return null; }
    if (!item || item.show !== "b") { return value; }
    return 8 - value;
  }
```

Then, inside `mount`, replace the `qStatementA` and `qStatementB` lookups with:

```js
      qStatement: document.getElementById("q-statement"),
```

Replace the two `textContent` lines in `renderQuestion` with:

```js
      el.qStatement.textContent = item[item.show];
```

Replace `advance` with:

```js
    function advance() {
      var value = pendingValue;
      if (value === null) { return; }
      /* Read the item before answering, because answering moves the queue on. */
      var item = flow.state().item;
      pendingValue = null;
      flow.answer(flip(value, item));
      render();
    }
```

Replace the Back click handler with:

```js
    el.btnBack.addEventListener("click", function () {
      /* back() hands over a pole-space value and only then is the queue
         standing on the earlier item, so the item to un-flip against is the
         one read after the call, never before it. */
      pendingValue = flip(flow.back(), flow.state().item);
      render();
    });
```

Change the export line to:

```js
  SG.render = { mount: mount, flip: flip };
```

- [ ] **Step 5: Run the unit test and confirm it passes**

Run: `node --test test/render.test.js 2>&1 | tail -10`
Expected: PASS, 4 tests

- [ ] **Step 6: Add the browser round-trip test**

Append to `test/smoke.test.js`, inside the existing structure:

```js
/* The bug this guards: Back hands over a value already turned over for a
   flipped item, so restoring it without turning it back would put a different
   dot under the reader than the one they pressed, silently. */
test("Back restores the dot the reader actually pressed, on a flipped item", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  await page.click("#btn-start");

  /* Walk forward until the question on screen is one that shows its second
     pole, so the inversion is actually exercised. */
  let flipped = false;
  for (let i = 0; i < 36 && !flipped; i += 1) {
    flipped = await page.evaluate(() => window.__flow.state().item.show === "b");
    if (!flipped) {
      await page.evaluate(() => document.querySelectorAll("#q-dots input")[3].click());
      await page.click("#btn-next");
    }
  }
  assert.ok(flipped, "no flipped item was reached in thirty-six questions");

  await page.evaluate(() => document.querySelectorAll("#q-dots input")[1].click());
  await page.click("#btn-next");
  await page.click("#btn-back");

  const checked = await page.evaluate(
    () => Array.from(document.querySelectorAll("#q-dots input")).findIndex((i) => i.checked)
  );
  assert.strictEqual(checked, 1, "Back put a different dot under the reader");
  await browser.close();
});
```

This needs the flow reachable from the page. In `js/app.js`, expose it:

```js
  /* Exposed for tests only. The flow is already a closure over nothing
     sensitive, and a test that has to answer its way to a particular kind of
     item needs to know which kind is on screen. */
  window.__flow = flow;
```

- [ ] **Step 7: Update the tests that assume two statements**

Run: `grep -rn "q-statement-a\|q-statement-b\|statement-a\|statement-b" test/ scripts/`
Fix every hit to use `#q-statement`. Then run the whole suite.

Run: `npm test 2>&1 | tail -8`
Expected: every test passes except the three in `test/viewport.test.js`, which
still fail because the CSS has not changed yet.

- [ ] **Step 8: Commit**

```bash
git add index.html js/render.js js/app.js test/render.test.js test/smoke.test.js
git commit -m "$(cat <<'MSG'
feat: one statement on an agree scale, turned over where the pole is flipped

The reader sees one statement and says how much they agree. js/score.js
and js/flow.js still speak pole space and are untouched: js/render.js
turns the value over at the view boundary, and nowhere else.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 5: A dot row that cannot overflow

**Files:**
- Modify: `app.css:274-320` roughly, the `.scale`, `.statement` and `.dot` blocks

**Interfaces:**
- Consumes: `#q-statement`, `.dot-scale`, `.dot-anchors` from Task 4
- Produces: nothing other tasks consume

- [ ] **Step 1: Replace the scale and statement blocks**

In `app.css`, replace the `.scale`, `.statement`, `.statement-a`,
`.statement-b` rules and the `@media (max-width: 30rem)` block that stacks
them, with:

```css
/* One statement above the row it is answered on. The old two-column grid
   existed to put a statement at each end of the scale; with one statement
   there is nothing to bracket, and the layout stops fighting the row. */
.scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.statement {
  font-family: var(--font-display);
  font-size: 1.35rem;
  line-height: 1.35;
}

.dot-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.dot-anchors {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.85rem;
}
```

- [ ] **Step 2: Make each dot proportional**

Replace the `.dot` rule with:

```css
/* Each dot takes one seventh of whatever width there is, so the row can never
   be wider than what holds it. min-width: 0 is the load-bearing half: a flex
   item will not go below its own content size without it, and that is exactly
   what pinned the old row at a rigid 308px and burst the card on every phone
   narrower than 470px. */
.dot {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  cursor: pointer;
}
```

Delete `justify-content: space-between` from `.dot-row`, which no longer has
slack to distribute.

- [ ] **Step 3: Give the row the card's full width on a phone**

Add, inside the existing `@media (max-width: 30rem)` block near the question
actions:

```css
  main { padding: var(--space-2) var(--space-3) var(--space-4); }
  .site-header { padding: var(--space-2) var(--space-3); }
  .question-card { padding: var(--space-3); }

  /* The row runs to the card's edges rather than sitting inside its padding.
     Forty pixels of padding is forty pixels the seven targets do not get, and
     at 320px that is the difference between a 40px target and a 34px one. */
  .dot-row {
    margin-left: calc(var(--space-3) * -1);
    margin-right: calc(var(--space-3) * -1);
  }
```

- [ ] **Step 4: Run the viewport test and confirm it now passes**

Run: `node --test test/viewport.test.js 2>&1 | tail -10`
Expected: PASS, 3 tests

- [ ] **Step 5: Confirm the targets are actually large enough**

Run:
```bash
node -e '
const {chromium}=require("./node_modules/playwright");
(async()=>{const b=await chromium.launch();
for(const w of [320,375,390,430]){
const p=await b.newPage({viewport:{width:w,height:800}});
await p.goto("file://"+require("path").resolve("index.html"));
await p.click("#btn-start");
const d=await p.evaluate(()=>{const r=document.querySelector(".dot").getBoundingClientRect();
const row=document.getElementById("q-dots").getBoundingClientRect();
return {dot:Math.round(r.width),row:Math.round(row.width)};});
console.log(w+"px: row "+d.row+"px, target "+d.dot+"px");await p.close();}
await b.close();})()'
```
Expected: 390px reports a target of about 50px, 375px about 49px, and 320px
about 40px. Anything under 34px is a failure and means the padding budget is
wrong.

- [ ] **Step 6: Commit**

```bash
git add app.css
git commit -m "$(cat <<'MSG'
fix: a dot row that shares the width it has instead of demanding 308px

Each dot was min-width 44px and would not shrink, so the row was a rigid
308px inside a card whose content box is 262px at 390px. It escaped the
card by 14px on an iPhone 13 Pro and overflowed the page at 320px. The
seven now take a seventh each, and the targets are larger than before on
every phone from 375px up.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 6: Centre the question card vertically

**Files:**
- Modify: `app.css`
- Test: `test/viewport.test.js`

**Interfaces:**
- Consumes: `#view-question` from `index.html`
- Produces: nothing other tasks consume

- [ ] **Step 1: Establish what `body` already does**

Run: `sed -n '55,75p' app.css`
If `body` is already a flex column with a `min-height`, use `flex: 1` in Step 3.
If it is not, add `display: flex; flex-direction: column; min-height: 100dvh;`
to `body` first. Do not use a `calc()` with a hand-counted header height: it
goes stale the first time the header changes.

- [ ] **Step 2: Write the failing test**

Append to `test/viewport.test.js`:

```js
/* The card sat at y=80 in an 844px viewport and was 398px tall, leaving 366px
   of dead space below it and a scale the thumb had to stretch for. */
test("the question card sits in the middle of the screen, not under the header", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(PAGE_URL);
  await page.click("#btn-start");

  const m = await page.evaluate(() => {
    const r = document.querySelector(".question-card").getBoundingClientRect();
    return {
      above: Math.round(r.top),
      below: Math.round(window.innerHeight - r.bottom),
      scrolls: document.documentElement.scrollHeight > window.innerHeight
    };
  });
  await browser.close();

  assert.ok(!m.scrolls, "centring must not introduce a scrollbar, got one");
  assert.ok(Math.abs(m.above - m.below) <= 24,
    "card is not centred: " + m.above + "px above, " + m.below + "px below");
});
```

- [ ] **Step 3: Run and confirm it fails**

Run: `node --test test/viewport.test.js 2>&1 | tail -15`
Expected: FAIL, `card is not centred: 80px above, 366px below`

- [ ] **Step 4: Centre it with auto margins**

Add to `app.css`:

```css
/* Auto margins, never justify-content: center. When the card is taller than
   the screen an auto margin collapses and the top stays reachable, whereas
   centring clips it off the top with no way to scroll back. dvh rather than vh
   so the iOS address bar hiding does not shove the card as the reader
   scrolls. */
#view-question {
  flex: 1;
  justify-content: normal;
}

#view-question .question-card {
  margin-block: auto;
}
```

- [ ] **Step 5: Run the whole viewport file**

Run: `node --test test/viewport.test.js 2>&1 | tail -10`
Expected: PASS, 4 tests

- [ ] **Step 6: Commit**

```bash
git add app.css test/viewport.test.js
git commit -m "$(cat <<'MSG'
fix: centre the question card in the screen it is answered on

The card sat at y=80 in an 844px viewport with 366px of dead space below
it. Auto margins rather than justify-content, so a card taller than the
screen keeps its top reachable instead of losing it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 7: The contrast audit

Report 4 asked for light and dark mode. Both already exist and follow the
operating system. The owner declined a control, because remembering the choice
means storage and the intro promises none. What is owed instead is the check
nobody has run: spec §6 of the master design requires AA in both themes.

**Files:**
- Create: `test/contrast.test.js`
- Modify: `app.css` only if a pair fails

**Interfaces:**
- Consumes: the token blocks in `app.css:3-52`
- Produces: nothing other tasks consume

- [ ] **Step 1: Write the test**

Create `test/contrast.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.resolve(__dirname, "..", "app.css"), "utf8");

/* Pulls one token block out of app.css by its selector, so the test reads the
   shipped values rather than a copy that can drift away from them. */
function tokens(selector) {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, "cannot find " + selector + " in app.css");
  const block = css.slice(at, css.indexOf("}", at));
  const out = {};
  block.replace(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g, (_, k, v) => { out[k] = v; return _; });
  return out;
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255)
       + 0.7152 * channel((n >> 8) & 255)
       + 0.0722 * channel(n & 255);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* WCAG AA: 4.5 for body text, 3 for large text and for the boundary of a user
   interface component. */
const TEXT = 4.5;
const UI = 3;

const THEMES = [
  ["dark", tokens(":root {")],
  ["light", tokens(':root[data-theme="light"]')]
];

THEMES.forEach(([name, t]) => {
  test("body text passes AA on both surfaces in the " + name + " theme", () => {
    assert.ok(ratio(t.text, t.ground) >= TEXT,
      "text on ground is " + ratio(t.text, t.ground).toFixed(2));
    assert.ok(ratio(t.text, t.raised) >= TEXT,
      "text on raised is " + ratio(t.text, t.raised).toFixed(2));
  });

  test("muted text passes AA on both surfaces in the " + name + " theme", () => {
    assert.ok(ratio(t.muted, t.ground) >= TEXT,
      "muted on ground is " + ratio(t.muted, t.ground).toFixed(2));
    assert.ok(ratio(t.muted, t.raised) >= TEXT,
      "muted on raised is " + ratio(t.muted, t.raised).toFixed(2));
  });

  /* Peach and lilac carry the two-types idea and appear as the blend bar and
     the focus ring, which are interface components rather than body text. */
  test("peach and lilac clear the interface threshold in the " + name + " theme", () => {
    ["peach", "lilac"].forEach((k) => {
      assert.ok(ratio(t[k], t.ground) >= UI, k + " on ground is " + ratio(t[k], t.ground).toFixed(2));
      assert.ok(ratio(t[k], t.raised) >= UI, k + " on raised is " + ratio(t[k], t.raised).toFixed(2));
    });
  });

  test("the primary button passes AA in the " + name + " theme", () => {
    assert.ok(ratio(t.ground, t.text) >= TEXT,
      "ground on text is " + ratio(t.ground, t.text).toFixed(2));
  });
});

/* The light theme is defined twice, once behind prefers-color-scheme for
   readers who never touch a control and once behind data-theme. They must not
   drift apart, because only one of them is ever exercised by a given reader. */
test("the two light definitions carry identical values", () => {
  const media = tokens(':root:not([data-theme="dark"])');
  const explicit = tokens(':root[data-theme="light"]');
  assert.deepStrictEqual(media, explicit);
});
```

- [ ] **Step 2: Run it and read the numbers**

Run: `node --test test/contrast.test.js 2>&1 | tail -30`
Expected: some tests may fail. Record the exact failing ratios before changing
anything.

- [ ] **Step 3: Fix only the failing tokens**

For each failure, darken or lighten only that token, by the smallest step that
clears the threshold, and only in the theme that failed. Do not touch a token
that passes. Peach and lilac carry the two-types idea per spec §6 and must stay
recognisably peach and lilac.

- [ ] **Step 4: Run the whole suite**

Run: `npm test 2>&1 | tail -8`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add app.css test/contrast.test.js
git commit -m "$(cat <<'MSG'
test: hold every colour pair to AA in both themes

Spec section 6 required this and nobody had checked it. The test reads the
shipped values out of app.css rather than a copy, so the two cannot drift.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

### Task 8: Amend the master spec

**Files:**
- Modify: `docs/superpowers/specs/2026-09-06-personality-design.md:79`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Amend section 4**

The bullet reads:

```
- **Core:** 36 items, 9 per axis. Seven-point slider between two statements.
```

Replace with:

```
- **Core:** 36 items, 9 per axis. Seven-point scale on one statement, from
  Agree to Disagree.

  **Amended 2026-09-07.** This read "Seven-point slider between two
  statements". Paired poles were the more accurate instrument, because neither
  end was the "yes", but the format forced a layout that broke on a phone and
  the two-statement screen was the thing readers found hardest. Each item now
  shows one pole. Roughly half show the second pole instead of the first, so
  agreeing does not always mean the same letter and acquiescence cancels in the
  axis mean. See docs/superpowers/specs/2026-09-07-mobile-question-view.md.
```

- [ ] **Step 2: Confirm the copy tests still pass**

Run: `npm test 2>&1 | tail -8`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-09-06-personality-design.md
git commit -m "$(cat <<'MSG'
docs: amend the master spec for the one-statement scale

Section 4 said "seven-point slider between two statements", which stopped
being true today. Amended in place rather than left to contradict the code.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FrbLvJQBNGEDoBNNKC7oi7
MSG
)"
```

---

## Final verification

- [ ] `npm test` is green, and the count is above 104.
- [ ] `npm run stage && node test/serve.js public` serves a working site.
- [ ] The question view is visually checked at 390px in a real browser.
