# Personality — Piece A: English Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a working English-only four-letter personality test that names a second type when an axis is too close to call.

**Architecture:** Pure functions for scoring, a DOM-free state machine for flow, and a thin render layer that reacts to state. No framework, no build step, no server. Every file attaches to a `window.SG` namespace via a shim that also works under Node, so the same source is both shipped and unit-tested.

**Tech Stack:** Vanilla HTML/CSS/JS (classic scripts), `node:test` + `node:assert` for tests (zero dependencies), Cloudflare Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-personality-design.md`

## Global Constraints

- **Never name the well-known indicator** in any page title, `og:title`, filename, domain, or commit message. Body-copy references only, adjective plus noun, `®` on first use, with a visible non-affiliation line.
- **Every item is self-authored.** No item or type name copied from any existing instrument.
- **No percentages, `±` figures, or the word "margin"** on any user-facing surface. The measurement runs, it does not narrate itself.
- **No running tally.** Nothing on the answering screen may reveal the emerging type.
- **No storage.** No datastore, no cookies beyond `localStorage` for resume, no analytics in piece A.
- **No em-dashes** in shipped user-facing copy. Use a hyphen or restructure.
- **Dark-first palette:** ground `#17141F`, raised `#201C2B`, text `#F3EDE3`, peach `#F2A17B` (your type), lilac `#ABA0EA` (the other one). Light theme: ground `#F4F0F4`, raised `#FCFAFC`, text `#221C2C`, peach `#B85328`, lilac `#644FAE`.
- **Fonts:** Fraunces (display) and Karla (body), Google Fonts, with real fallback stacks.
- **Accessibility:** visible focus, 44px minimum targets, `prefers-reduced-motion` respected, AA contrast in both themes, whole flow keyboard-operable.
- **No build step.** `index.html` must work when opened directly from the filesystem.

---

## File Structure

| File | Responsibility |
|---|---|
| `index.html` | Single page, four views switched by `hidden` |
| `app.css` | All styles, token-driven, both themes |
| `js/ns.js` | The `SG` namespace shim (browser + Node) |
| `js/items.js` | 36 core items, 32 tiebreak items |
| `js/types.js` | 16 type names, lines, descriptions, chips, names |
| `js/score.js` | Pure scoring: estimate, band, closeness, winner |
| `js/flow.js` | DOM-free state machine |
| `js/render.js` | State to DOM |
| `js/share.js` | Canvas share card |
| `js/app.js` | Boot and wiring |
| `test/score.test.js` | Scoring unit tests |
| `test/items.test.js` | Item bank integrity |
| `test/flow.test.js` | State machine tests |
| `test/smoke.test.js` | Headless page load |
| `.github/workflows/deploy.yml` | Test then deploy |
| `package.json` | Test script only |

---

### Task 1: Namespace shim and scoring

**Files:**
- Create: `js/ns.js`, `js/score.js`, `test/score.test.js`, `package.json`, `.gitignore`
- Test: `test/score.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `SG.ns(factory)` — registers a module against the shared namespace
  - `SG.score.axisResult(responses)` → `{ est, half, close, letterIndex }` where `responses` is an array of `number|null` (1-7, or `null` for skipped), `est` and `half` are numbers on a 0-100 scale, `close` is boolean, `letterIndex` is `0` or `1`
  - `SG.score.SD_FLOOR`, `SG.score.SKIP_PENALTY`, `SG.score.HALF_MIN`, `SG.score.HALF_MAX`

**Why a floor on the standard deviation:** nine identical answers produce a sample SD of zero, a standard error of zero, and a band of zero width. That would claim perfect certainty from nine questions, which is precisely the dishonesty this product exists to avoid. `SD_FLOOR` is a stated modelling assumption and is the reason §8 of the spec calls piece A's bands "estimated" rather than "measured".

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "personality-app",
  "version": "0.1.0",
  "private": true,
  "description": "Personality. A four-letter test that tells you which second type is living in your result.",
  "scripts": {
    "test": "node --test test/*.test.js"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
.wrangler/
```

- [ ] **Step 3: Create `js/ns.js`**

```js
/* Namespace shim. Works as a classic <script> in the browser and as a
   require() target under Node, so the shipped source is the tested source. */
(function (root) {
  "use strict";
  root.SG = root.SG || {};
}(typeof window !== "undefined" ? window : globalThis));
```

- [ ] **Step 4: Write the failing test**

Create `test/score.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/score.js");
const score = globalThis.SG.score;

test("all answers at the first pole put the estimate at the low end", () => {
  const r = score.axisResult([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.ok(r.est < 10, "est should be near 0, got " + r.est);
  assert.strictEqual(r.letterIndex, 0);
  assert.strictEqual(r.close, false);
});

test("all answers at the second pole put the estimate at the high end", () => {
  const r = score.axisResult([7, 7, 7, 7, 7, 7, 7, 7, 7]);
  assert.ok(r.est > 90, "est should be near 100, got " + r.est);
  assert.strictEqual(r.letterIndex, 1);
  assert.strictEqual(r.close, false);
});

test("the SD floor, not the clamp, is what holds a unanimous band open", () => {
  /* Sample SD is 0 here. Without SD_FLOOR the raw half-width would be 0 and
     only the outer clamp would save it, landing exactly on HALF_MIN. Asserting
     >= HALF_MIN therefore proves nothing: the clamp guarantees it. Assert the
     value the floor actually produces. */
  const r = score.axisResult([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const expected = 50 * 1.96 * (score.SD_FLOOR / Math.sqrt(9));
  assert.ok(Math.abs(r.half - expected) < 0.01,
    "expected ~" + expected.toFixed(2) + ", got " + r.half);
  assert.ok(r.half > score.HALF_MIN, "the floor must beat the clamp minimum");
});

test("dead-centre answers are close", () => {
  const r = score.axisResult([4, 4, 4, 4, 4, 4, 4, 4, 4]);
  assert.strictEqual(r.est, 50);
  assert.strictEqual(r.close, true);
});

test("a mixed axis straddling the midline is close", () => {
  const r = score.axisResult([2, 6, 3, 5, 4, 6, 2, 5, 4]);
  assert.strictEqual(r.close, true);
});

test("skipped answers widen the band", () => {
  const full = score.axisResult([2, 2, 2, 2, 2, 2, 2, 2, 2]);
  const some = score.axisResult([2, 2, 2, 2, 2, 2, null, null, null]);
  assert.ok(some.half > full.half, "skips must widen, got " + some.half + " vs " + full.half);
});

test("all skipped is maximally uncertain and centred", () => {
  const r = score.axisResult([null, null, null, null, null, null, null, null, null]);
  assert.strictEqual(r.est, 50);
  assert.strictEqual(r.half, score.HALF_MAX);
  assert.strictEqual(r.close, true);
});

test("more items narrow the band", () => {
  const nine = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2]);
  const seventeen = score.axisResult([2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2]);
  assert.ok(seventeen.half < nine.half, "more evidence must narrow the band");
});

test("an extreme two-item split is clamped to the axis", () => {
  /* Raw half-width here is ~98, so the clamp genuinely binds. Asserting
     <= HALF_MAX on an input that never exceeds it proves nothing. */
  const r = score.axisResult([1, 7]);
  assert.strictEqual(r.half, score.HALF_MAX);
});

test("a high-variance axis is wide but not clamped", () => {
  const r = score.axisResult([1, 7, 1, 7, 1, 7, 1, 7, 1]);
  assert.ok(r.half > 30 && r.half < score.HALF_MAX,
    "expected a wide unclamped band near 34, got " + r.half);
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../js/score.js'`

- [ ] **Step 6: Create `js/score.js`**

```js
(function (root) {
  "use strict";
  var SG = root.SG;

  /* Responses are 1-7 on a slider between two poles, or null for
     "neither, really". 1 is the first pole, 7 is the second. */

  var SD_FLOOR = 0.35;     /* on the -1..1 response scale */
  var SKIP_PENALTY = 3;    /* points of extra half-width per skipped item */
  var HALF_MIN = 4;        /* an honest floor: nine questions is never certainty */
  var HALF_MAX = 50;       /* the whole axis */
  var Z = 1.96;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function axisResult(responses) {
    var answered = responses.filter(function (r) { return r !== null && r !== undefined; });
    var skipped = responses.length - answered.length;

    if (answered.length === 0) {
      return { est: 50, half: HALF_MAX, close: true, letterIndex: 1 };
    }

    /* Map 1..7 to -1..+1 */
    var xs = answered.map(function (r) { return (r - 4) / 3; });
    var mean = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;

    var variance = xs.length < 2 ? 0 :
      xs.reduce(function (a, x) { return a + (x - mean) * (x - mean); }, 0) / (xs.length - 1);
    var sd = Math.max(Math.sqrt(variance), SD_FLOOR);
    var se = sd / Math.sqrt(xs.length);

    var est = clamp(50 + 50 * mean, 0, 100);
    var half = clamp(50 * Z * se + SKIP_PENALTY * skipped, HALF_MIN, HALF_MAX);

    return {
      est: est,
      half: half,
      close: (est - half) < 50 && (est + half) > 50,
      letterIndex: est >= 50 ? 1 : 0
    };
  }

  SG.score = {
    axisResult: axisResult,
    SD_FLOOR: SD_FLOOR,
    SKIP_PENALTY: SKIP_PENALTY,
    HALF_MIN: HALF_MIN,
    HALF_MAX: HALF_MAX
  };
}(typeof window !== "undefined" ? window : globalThis));
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 10 tests

- [ ] **Step 8: Commit**

```bash
git add package.json .gitignore js/ns.js js/score.js test/score.test.js
git commit -m "feat: scoring with an honest band floor"
```

---

### Task 2: Item bank

**Files:**
- Create: `js/items.js`, `test/items.test.js`
- Test: `test/items.test.js`

**Interfaces:**
- Consumes: `SG` namespace from Task 1
- Produces:
  - `SG.items.AXES` — `["EI", "SN", "TF", "JP"]`
  - `SG.items.POLES` — `{ EI: ["E","I"], SN: ["S","N"], TF: ["T","F"], JP: ["J","P"] }`
  - `SG.items.core` — array of 36 `{ axis, a, b }`, 9 per axis
  - `SG.items.tiebreak` — array of 32 `{ axis, a, b }`, 8 per axis
  - `a` is the first-pole statement, `b` the second-pole statement

- [ ] **Step 1: Write the failing test**

Create `test/items.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/items.js");
const items = globalThis.SG.items;

function countByAxis(bank) {
  const n = {};
  items.AXES.forEach((a) => { n[a] = 0; });
  bank.forEach((it) => { n[it.axis] += 1; });
  return n;
}

test("there are exactly four axes with two poles each", () => {
  assert.deepStrictEqual(items.AXES, ["EI", "SN", "TF", "JP"]);
  items.AXES.forEach((a) => {
    assert.strictEqual(items.POLES[a].length, 2, a + " needs two poles");
  });
});

test("the core bank is 36 items, nine per axis", () => {
  assert.strictEqual(items.core.length, 36);
  const n = countByAxis(items.core);
  items.AXES.forEach((a) => assert.strictEqual(n[a], 9, a + " has " + n[a]));
});

test("the tiebreak bank is 32 items, eight per axis", () => {
  assert.strictEqual(items.tiebreak.length, 32);
  const n = countByAxis(items.tiebreak);
  items.AXES.forEach((a) => assert.strictEqual(n[a], 8, a + " has " + n[a]));
});

test("every item has two non-empty distinct statements", () => {
  items.core.concat(items.tiebreak).forEach((it, i) => {
    assert.ok(it.a && it.a.length > 3, "item " + i + " has no a");
    assert.ok(it.b && it.b.length > 3, "item " + i + " has no b");
    assert.notStrictEqual(it.a, it.b, "item " + i + " has identical poles");
  });
});

test("no statement is reused anywhere in either bank", () => {
  const seen = new Set();
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!seen.has(s), "duplicate statement: " + s);
      seen.add(s);
    });
  });
});

test("no shipped statement contains an em-dash", () => {
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!/[–—]/.test(s), "en/em dash in: " + s);
    });
  });
});

test("no statement names a letter or the four-letter code", () => {
  items.core.concat(items.tiebreak).forEach((it) => {
    [it.a, it.b].forEach((s) => {
      assert.ok(!/\b[EISNTFJP]{4}\b/.test(s), "type code leaked into: " + s);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../js/items.js'`

- [ ] **Step 3: Create `js/items.js`**

```js
(function (root) {
  "use strict";
  var SG = root.SG;

  /* Self-authored throughout. `a` is the first pole, `b` the second. */

  var core = [
    { axis: "EI", a: "Talking is how I work a thing out.", b: "I work it out, then I talk." },
    { axis: "EI", a: "A room full of strangers is an opportunity.", b: "A room full of strangers is a countdown." },
    { axis: "EI", a: "I recharge around people.", b: "I recharge away from people." },
    { axis: "EI", a: "Silence in a conversation needs filling.", b: "Silence in a conversation is fine." },
    { axis: "EI", a: "I will say the half-formed idea.", b: "I will wait until it is finished." },
    { axis: "EI", a: "My weekend was good if it was full.", b: "My weekend was good if it was quiet." },
    { axis: "EI", a: "I answer the phone.", b: "I let it ring and text back." },
    { axis: "EI", a: "Group chats are where I am funniest.", b: "One to one is where I am funniest." },
    { axis: "EI", a: "I meet new people easily and often.", b: "I keep a small circle on purpose." },

    { axis: "SN", a: "Show me what is actually there.", b: "Show me what it could turn into." },
    { axis: "SN", a: "Give me the steps in order.", b: "Give me the shape, I will fill it in." },
    { axis: "SN", a: "I trust what I can check.", b: "I trust what I can sense." },
    { axis: "SN", a: "Details are satisfying.", b: "Details are somebody else's problem." },
    { axis: "SN", a: "I remember what happened.", b: "I remember what it meant." },
    { axis: "SN", a: "A proven method is a good method.", b: "A proven method is a starting point." },
    { axis: "SN", a: "I describe things literally.", b: "I describe things by comparison." },
    { axis: "SN", a: "The present is plenty to think about.", b: "I am usually somewhere in next year." },
    { axis: "SN", a: "Instructions are for following.", b: "Instructions are for skimming." },

    { axis: "TF", a: "Decide it on the merits.", b: "Decide it on who it lands on." },
    { axis: "TF", a: "Being right matters more than being liked.", b: "Being liked matters more than being right." },
    { axis: "TF", a: "I give the honest answer first.", b: "I give the kind answer first." },
    { axis: "TF", a: "Feelings are data, not a verdict.", b: "Feelings are the whole point." },
    { axis: "TF", a: "I can argue a position I disagree with.", b: "Arguing against my own view feels wrong." },
    { axis: "TF", a: "Fair means the same rule for everyone.", b: "Fair means accounting for the person." },
    { axis: "TF", a: "Criticism is useful.", b: "Criticism lands hard and stays." },
    { axis: "TF", a: "I notice the flaw in the plan.", b: "I notice who is uncomfortable with the plan." },
    { axis: "TF", a: "Logic settles it.", b: "Something still has to feel right." },

    { axis: "JP", a: "Settle it now and move on.", b: "Leave it open a while longer." },
    { axis: "JP", a: "A plan is a comfort.", b: "A plan is a cage." },
    { axis: "JP", a: "I finish early.", b: "I finish at the last possible moment." },
    { axis: "JP", a: "Unmade decisions bother me.", b: "Unmade decisions keep options alive." },
    { axis: "JP", a: "I like knowing what Saturday holds.", b: "I like Saturday deciding itself." },
    { axis: "JP", a: "A list is how I hold the day.", b: "A list is how I lose the day." },
    { axis: "JP", a: "Changed plans are a small loss.", b: "Changed plans are a small gift." },
    { axis: "JP", a: "I pack days before.", b: "I pack the morning of." },
    { axis: "JP", a: "Done beats open.", b: "Open beats done." }
  ];

  var tiebreak = [
    { axis: "EI", a: "After a great party I want more.", b: "After a great party I want silence." },
    { axis: "EI", a: "I think best out loud with someone.", b: "I think best alone on paper." },
    { axis: "EI", a: "Being the only one talking is fine.", b: "Being the only one talking is a nightmare." },
    { axis: "EI", a: "I would host.", b: "I would attend, briefly." },
    { axis: "EI", a: "A weekend alone would be a waste.", b: "A weekend alone would be a treat." },
    { axis: "EI", a: "I introduce myself first.", b: "I wait to be introduced." },
    { axis: "EI", a: "Working in a busy room helps me.", b: "Working in a busy room ruins me." },
    { axis: "EI", a: "I like being known by many people.", b: "I like being known by a few, well." },

    { axis: "SN", a: "I would rather fix it than reimagine it.", b: "I would rather reimagine it than fix it." },
    { axis: "SN", a: "What is it for comes first.", b: "What could it be comes first." },
    { axis: "SN", a: "A good idea is one that works now.", b: "A good idea is one that could work." },
    { axis: "SN", a: "I read the manual.", b: "I press buttons." },
    { axis: "SN", a: "Facts settle arguments.", b: "Patterns settle arguments." },
    { axis: "SN", a: "I notice what changed in the room.", b: "I notice what the room reminds me of." },
    { axis: "SN", a: "Realistic is a compliment.", b: "Realistic is a warning." },
    { axis: "SN", a: "I would rather build it right.", b: "I would rather build it strange." },

    { axis: "TF", a: "I would tell a friend their idea is bad.", b: "I would find a way around saying it." },
    { axis: "TF", a: "A rule broken for a good reason is still broken.", b: "A rule broken for a good reason was a bad rule." },
    { axis: "TF", a: "I can hear that I am wrong without flinching.", b: "Being told I am wrong takes me a day." },
    { axis: "TF", a: "Harmony is nice, accuracy is necessary.", b: "Accuracy is nice, harmony is necessary." },
    { axis: "TF", a: "I would make the unpopular call.", b: "I would look for the call everyone can live with." },
    { axis: "TF", a: "My first question is whether it holds up.", b: "My first question is who it hurts." },
    { axis: "TF", a: "I trust the analysis over the room.", b: "I trust the room over the analysis." },
    { axis: "TF", a: "Sentiment clouds judgment.", b: "Judgment without sentiment is worse." },

    { axis: "JP", a: "An empty calendar is unsettling.", b: "An empty calendar is the point." },
    { axis: "JP", a: "I would rather decide wrong than not decide.", b: "I would rather wait than decide wrong." },
    { axis: "JP", a: "Deadlines are when I finish.", b: "Deadlines are when I start." },
    { axis: "JP", a: "I tidy before I work.", b: "I tidy instead of working, later." },
    { axis: "JP", a: "Routine frees me.", b: "Routine flattens me." },
    { axis: "JP", a: "I book the restaurant.", b: "I see what we feel like." },
    { axis: "JP", a: "Half-done things nag at me.", b: "Half-done things are just paused." },
    { axis: "JP", a: "I want the itinerary.", b: "I want the flight and nothing else." }
  ];

  SG.items = {
    AXES: ["EI", "SN", "TF", "JP"],
    POLES: { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] },
    core: core,
    tiebreak: tiebreak
  };
}(typeof window !== "undefined" ? window : globalThis));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 16 tests

- [ ] **Step 5: Commit**

```bash
git add js/items.js test/items.test.js
git commit -m "feat: 36 core and 32 tiebreak items, all self-authored"
```

---

### Task 3: Type table

**Files:**
- Create: `js/types.js`, `test/types.test.js`
- Test: `test/types.test.js`

**Interfaces:**
- Consumes: `SG.items.AXES`, `SG.items.POLES`
- Produces: `SG.types.byCode` — object keyed by the 16 codes, each `{ name, line, best, undone, opening, chips, often }`

- [ ] **Step 1: Write the failing test**

Create `test/types.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/items.js");
require("../js/types.js");
const types = globalThis.SG.types;
const items = globalThis.SG.items;

function allCodes() {
  const out = [];
  items.POLES.EI.forEach((e) =>
    items.POLES.SN.forEach((s) =>
      items.POLES.TF.forEach((t) =>
        items.POLES.JP.forEach((j) => out.push(e + s + t + j)))));
  return out;
}

test("all sixteen codes are present and nothing else is", () => {
  const expected = allCodes().sort();
  const actual = Object.keys(types.byCode).sort();
  assert.deepStrictEqual(actual, expected);
});

test("every type has all required fields filled", () => {
  Object.keys(types.byCode).forEach((code) => {
    const t = types.byCode[code];
    ["name", "line", "opening", "best", "undone"].forEach((k) => {
      assert.ok(t[k] && t[k].length > 5, code + " has no " + k);
    });
    assert.strictEqual(t.chips.length, 5, code + " needs five chips");
    assert.ok(t.often.length >= 3, code + " needs at least three names");
  });
});

test("every type name is unique", () => {
  const names = Object.keys(types.byCode).map((c) => types.byCode[c].name);
  assert.strictEqual(new Set(names).size, names.length, "duplicate type name");
});

test("no shipped type copy contains an em-dash", () => {
  Object.keys(types.byCode).forEach((code) => {
    const t = types.byCode[code];
    [t.name, t.line, t.opening, t.best, t.undone].concat(t.chips).forEach((s) => {
      assert.ok(!/[–—]/.test(s), "en/em dash in " + code + ": " + s);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../js/types.js'`

- [ ] **Step 3: Create `js/types.js`**

Write all sixteen entries. Names and one-liners are fixed by the prototype and listed below in full. `opening`, `best`, `undone`, `chips` and `often` follow the pattern shown for `INFJ`, which is the reference voice: second person, present tense, specific enough to sting slightly.

```js
(function (root) {
  "use strict";
  var SG = root.SG;

  var byCode = {
    INTJ: { name: "Deep Water",        line: "Three moves ahead, saying none of them." },
    INTP: { name: "The Rabbit Hole",   line: "Went to check one thing. Gone four hours." },
    ENTJ: { name: "Full Throttle",     line: "Has already decided. Is being polite about it." },
    ENTP: { name: "Sparks Fly",        line: "Will argue your own point back at you, better." },
    INFJ: { name: "The Quiet Read",    line: "Clocks the room before they are through the door." },
    INFP: { name: "Soft Focus",        line: "Feels it all week. Mentions it on Friday." },
    ENFJ: { name: "Warm Front",        line: "The room gets easier when they walk in." },
    ENFP: { name: "Wildflower",        line: "Six new plans and genuine love for all of them." },
    ISTJ: { name: "The Backbone",      line: "Said they would. Therefore they will." },
    ISFJ: { name: "Safe Harbour",      line: "Remembers how you take your tea. Since 2019." },
    ESTJ: { name: "The Straight Line", line: "Shortest route, stated out loud, twice." },
    ESFJ: { name: "The Glue",          line: "The group chat would have died without them." },
    ISTP: { name: "The Fixer",         line: "Has the thing in pieces. Do not panic." },
    ISFP: { name: "Slow Sunday",       line: "Not late. Simply not in a hurry." },
    ESTP: { name: "No Brakes",         line: "Says yes first, reads the details never." },
    ESFP: { name: "The Encore",        line: "Leaves last, and the night was better for it." }
  };

  /* Reference voice. Fill the remaining fifteen to this shape. */
  byCode.INFJ.opening = "You read people fast and you are usually right, which is a lovely gift and an exhausting one. Most rooms you walk into, you have already worked out who is unhappy and who is pretending, and you will spend the evening quietly managing it without being asked.";
  byCode.INFJ.best = "when someone finally says the true thing out loud, and you get to be the person who heard it first.";
  byCode.INFJ.undone = "when you have done that for everyone for a month and nobody has once asked how you are.";
  byCode.INFJ.chips = ["Reads the room", "Plans in private", "Slow to trust", "Holds a grudge tidily", "Ferociously loyal"];
  byCode.INFJ.often = ["Carl Jung", "Nelson Mandela", "Lady Gaga", "Edward Norton", "Nicole Kidman"];

  SG.types = { byCode: byCode };
}(typeof window !== "undefined" ? window : globalThis));
```

- [ ] **Step 4: Write the remaining fifteen types**

For each of the fifteen codes other than `INFJ`, add `opening`, `best`, `undone`, `chips` (exactly five) and `often` (at least three names). Constraints, all enforced by the test:

- `opening`: two sentences, second person, present tense. Name a concrete situation, not a trait list.
- `best`: a clause that completes "You are at your best ...".
- `undone`: a clause that completes "You come undone ...".
- `chips`: five short phrases, three to five words, no full stops.
- `often`: real public figures commonly typed this way. These are fan votes, and the page says so, so pick widely-cited ones rather than researching a defensible claim.
- No em-dashes anywhere.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 20 tests

- [ ] **Step 6: Commit**

```bash
git add js/types.js test/types.test.js
git commit -m "feat: sixteen type pages"
```

---

### Task 4: Flow state machine

**Files:**
- Create: `js/flow.js`, `test/flow.test.js`
- Test: `test/flow.test.js`

**Interfaces:**
- Consumes: `SG.score.axisResult`, `SG.items.core`, `SG.items.tiebreak`, `SG.items.AXES`, `SG.items.POLES`
- Produces:
  - `SG.flow.create()` → a flow object
  - `flow.state()` → `{ view, index, total, item, result }` where `view` is one of `"intro" | "question" | "reveal" | "type"`
  - `flow.start()`, `flow.answer(value)` where value is 1-7, `flow.skip()`, `flow.settle()`, `flow.keepBoth()`, `flow.openType()`, `flow.reset()`
  - `flow.result()` → `{ code, secondCode, closeAxis, axes }` or `null` before the reveal

**Branch rule:** after the 36 core items, compute all four axes. If one or more is close, the tiebreak targets the single axis whose estimate is nearest 50. The second code is that axis's letter flipped. If no axis is close, there is no second code and `settle`/`keepBoth` are not offered.

- [ ] **Step 1: Write the failing test**

Create `test/flow.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/score.js");
require("../js/items.js");
require("../js/flow.js");
const flowMod = globalThis.SG.flow;
const items = globalThis.SG.items;

/* Answer every question with the same value. */
function runCore(f, value) {
  f.start();
  for (let i = 0; i < items.core.length; i += 1) { f.answer(value); }
}

/* Answer decisively on every axis except the named one, which gets 4s. */
function runCoreCloseOn(f, axis, decisive) {
  f.start();
  for (let i = 0; i < items.core.length; i += 1) {
    const it = f.state().item;
    f.answer(it.axis === axis ? 4 : decisive);
  }
}

test("starts on the intro and moves to the first question", () => {
  const f = flowMod.create();
  assert.strictEqual(f.state().view, "intro");
  f.start();
  assert.strictEqual(f.state().view, "question");
  assert.strictEqual(f.state().index, 0);
  assert.strictEqual(f.state().total, 36);
});

test("thirty-six answers reach the reveal", () => {
  const f = flowMod.create();
  runCore(f, 7);
  assert.strictEqual(f.state().view, "reveal");
});

test("a decisive run produces a four-letter code and no second code", () => {
  const f = flowMod.create();
  runCore(f, 7);
  const r = f.result();
  assert.strictEqual(r.code.length, 4);
  assert.strictEqual(r.secondCode, null);
  assert.strictEqual(r.closeAxis, null);
});

test("answering everything at the first pole gives the first letters", () => {
  const f = flowMod.create();
  runCore(f, 1);
  assert.strictEqual(f.result().code, "ESTJ");
});

test("answering everything at the second pole gives the second letters", () => {
  const f = flowMod.create();
  runCore(f, 7);
  assert.strictEqual(f.result().code, "INFP");
});

test("one indecisive axis becomes the close axis with a second code", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  const r = f.result();
  assert.strictEqual(r.closeAxis, "TF");
  assert.ok(r.secondCode, "expected a second code");
  assert.strictEqual(r.secondCode.length, 4);
  assert.notStrictEqual(r.secondCode, r.code);
  /* The two codes differ in exactly one position. */
  let diff = 0;
  for (let i = 0; i < 4; i += 1) { if (r.code[i] !== r.secondCode[i]) { diff += 1; } }
  assert.strictEqual(diff, 1);
});

test("settling serves eight more items on the close axis only", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  f.settle();
  assert.strictEqual(f.state().view, "question");
  assert.strictEqual(f.state().total, 8);
  for (let i = 0; i < 8; i += 1) {
    assert.strictEqual(f.state().item.axis, "TF", "tiebreak item " + i + " off-axis");
    f.answer(7);
  }
  assert.strictEqual(f.state().view, "reveal");
});

test("a decisive tiebreak clears the close flag", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  f.settle();
  for (let i = 0; i < 8; i += 1) { f.answer(7); }
  const r = f.result();
  assert.strictEqual(r.closeAxis, null);
  assert.strictEqual(r.secondCode, null);
});

test("keeping both preserves the second code and opens the type page", () => {
  const f = flowMod.create();
  runCoreCloseOn(f, "TF", 7);
  const before = f.result().secondCode;
  f.keepBoth();
  assert.strictEqual(f.state().view, "type");
  assert.strictEqual(f.result().secondCode, before);
});

test("a skip records a missing answer, it does not silently drop the item", () => {
  /* Comparing a skipped run against a fully-answered run is NOT enough. The
     band widens merely because n fell from 9 to 8 via se = sd/sqrt(n), so a
     skip() that dropped the item entirely still passes such a test (12.13 vs
     a baseline 11.43). Pin the exact half-width instead: it is reachable only
     if the null was recorded AND SKIP_PENALTY was applied to it. */
  const f = flowMod.create();
  f.start();
  let done = false;
  for (let i = 0; i < items.core.length; i += 1) {
    if (f.state().item.axis === "EI" && !done) { f.skip(); done = true; }
    else { f.answer(7); }
  }
  const r = f.result();

  const expected = 50 * 1.96 * (score.SD_FLOOR / Math.sqrt(8)) + score.SKIP_PENALTY;
  assert.ok(Math.abs(r.axes.EI.half - expected) < 0.01,
    "expected ~" + expected.toFixed(2) + ", got " + r.axes.EI.half +
    "; a dropped skip would give ~" + (expected - score.SKIP_PENALTY).toFixed(2));

  const full = flowMod.create();
  full.start();
  for (let i = 0; i < items.core.length; i += 1) { full.answer(7); }
  assert.strictEqual(r.axes.SN.half, full.result().axes.SN.half,
    "a skip must not touch another axis");
});

test("when two axes are close, the one nearer the midline is chosen", () => {
  /* No other test ever makes two axes close at once, so nearest-50 selection
     is otherwise unverified. TF sits exactly on 50, SN is close but offset. */
  const f = flowMod.create();
  f.start();
  const seen = { EI: 0, SN: 0, TF: 0, JP: 0 };
  for (let i = 0; i < items.core.length; i += 1) {
    const axis = f.state().item.axis;
    seen[axis] += 1;
    if (axis === "TF") { f.answer(4); }
    else if (axis === "SN") { f.answer(seen.SN <= 5 ? 4 : 5); }
    else { f.answer(7); }
  }
  const r = f.result();
  assert.ok(r.axes.TF.close && r.axes.SN.close, "both axes must be close here");
  assert.ok(Math.abs(r.axes.SN.est - 50) > Math.abs(r.axes.TF.est - 50),
    "SN must be the further of the two");
  assert.strictEqual(r.closeAxis, "TF");
});

test("an exact tie resolves deterministically to the earlier axis", () => {
  /* Guards the strict `<` in the selection loop. With `<=` the later axis
     would win and every other test would still pass. */
  const f = flowMod.create();
  f.start();
  for (let i = 0; i < items.core.length; i += 1) {
    const axis = f.state().item.axis;
    f.answer(axis === "EI" || axis === "JP" ? 4 : 7);
  }
  const r = f.result();
  assert.ok(r.axes.EI.close && r.axes.JP.close, "both axes must be close here");
  assert.strictEqual(r.axes.EI.est, r.axes.JP.est, "this must be an exact tie");
  assert.strictEqual(r.closeAxis, "EI", "ties go to the earlier entry in AXES");
});

test("reset returns to the intro and clears the result", () => {
  const f = flowMod.create();
  runCore(f, 7);
  f.reset();
  assert.strictEqual(f.state().view, "intro");
  assert.strictEqual(f.result(), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../js/flow.js'`

- [ ] **Step 3: Create `js/flow.js`**

```js
(function (root) {
  "use strict";
  var SG = root.SG;

  function create() {
    var view = "intro";
    var queue = [];        /* items currently being asked */
    var index = 0;
    var responses = {};    /* axis -> array of number|null */
    var result = null;
    var phase = "core";    /* core | tiebreak */

    function resetResponses() {
      responses = {};
      SG.items.AXES.forEach(function (a) { responses[a] = []; });
    }

    function axisResults() {
      var out = {};
      SG.items.AXES.forEach(function (a) {
        out[a] = SG.score.axisResult(responses[a]);
      });
      return out;
    }

    function codeFrom(axes) {
      return SG.items.AXES.map(function (a) {
        return SG.items.POLES[a][axes[a].letterIndex];
      }).join("");
    }

    function flipped(code, axis) {
      var i = SG.items.AXES.indexOf(axis);
      var poles = SG.items.POLES[axis];
      var other = code[i] === poles[0] ? poles[1] : poles[0];
      return code.slice(0, i) + other + code.slice(i + 1);
    }

    function compute() {
      var axes = axisResults();
      var code = codeFrom(axes);

      var closeAxis = null;
      var nearest = Infinity;
      SG.items.AXES.forEach(function (a) {
        if (!axes[a].close) { return; }
        var d = Math.abs(axes[a].est - 50);
        if (d < nearest) { nearest = d; closeAxis = a; }
      });

      result = {
        code: code,
        closeAxis: closeAxis,
        secondCode: closeAxis ? flipped(code, closeAxis) : null,
        axes: axes
      };
      view = "reveal";
    }

    function record(value) {
      var item = queue[index];
      responses[item.axis].push(value);
      index += 1;
      if (index >= queue.length) { compute(); }
    }

    return {
      state: function () {
        return {
          view: view,
          index: index,
          total: queue.length,
          item: queue[index] || null,
          result: result
        };
      },
      result: function () { return result; },
      start: function () {
        resetResponses();
        queue = SG.items.core.slice();
        index = 0;
        phase = "core";
        result = null;
        view = "question";
      },
      answer: function (value) { record(value); },
      skip: function () { record(null); },
      settle: function () {
        if (!result || !result.closeAxis) { return; }
        var axis = result.closeAxis;
        queue = SG.items.tiebreak.filter(function (it) { return it.axis === axis; });
        index = 0;
        phase = "tiebreak";
        view = "question";
      },
      keepBoth: function () { view = "type"; },
      openType: function () { view = "type"; },
      phase: function () { return phase; },
      reset: function () {
        view = "intro";
        queue = [];
        index = 0;
        result = null;
        phase = "core";
        resetResponses();
      }
    };
  }

  SG.flow = { create: create };
}(typeof window !== "undefined" ? window : globalThis));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 31 tests

- [ ] **Step 5: Commit**

```bash
git add js/flow.js test/flow.test.js
git commit -m "feat: flow state machine with the adaptive branch"
```

---

### Task 5: Markup, styles and rendering

**Files:**
- Create: `index.html`, `app.css`, `js/render.js`, `js/app.js`

**Interfaces:**
- Consumes: `SG.flow.create`, `SG.types.byCode`, `SG.items.POLES`
- Produces: `SG.render.mount(flow)` which wires the DOM and renders on every state change

Build the four views from §5 of the spec. Requirements, each independently checkable:

- [ ] **Step 1: Create `index.html`** with the `<title>` "Personality", which does not name the indicator, the Google Fonts link for Fraunces and Karla, four `<section>` views (`#view-intro`, `#view-question`, `#view-reveal`, `#view-type`) toggled with the `hidden` property, and `<script defer>` tags in dependency order: `ns`, `score`, `items`, `types`, `flow`, `share`, `render`, `app`.

- [ ] **Step 2: Create `app.css`** with the palette from Global Constraints as `:root` tokens, the light theme under `@media (prefers-color-scheme: light)` guarded as `:root:not([data-theme="dark"])`, and again under `:root[data-theme="light"]`. Every component takes its colours from tokens only.

- [ ] **Step 3: Build the question view.** A 1-7 `input[type=range]` starting at 4, both pole statements, a word-feedback line reading one of "Strongly the first one", "Mostly the first one", "Leans the first way", "Somewhere in the middle", "Leans the second way", "Mostly the second one", "Strongly the second one". A Next button and a "Neither, really" button. Progress spelled in words: "Nine down, twenty-seven to go". Keys `1` to `7` set the slider and `Enter` advances. **No element on this view may display any axis, letter, or running score.**

- [ ] **Step 4: Build the reveal view.** Code, type name, type line. If `result.closeAxis` is set, also render the second-self card: the second type's name, a two-segment blend bar (peach then lilac) whose split is `result.axes[closeAxis].est` rounded, and two buttons wired to `flow.settle()` and `flow.keepBoth()`. If `closeAxis` is null, render neither the card nor the buttons, and show a single Continue button calling `flow.openType()`.

- [ ] **Step 5: Build the type view.** Name, code, the three paragraphs assembled as `opening`, then "You are at your best " + `best`, then "You come undone " + `undone`. The five chips. The `often` names on pills followed by the asterisk paragraph, verbatim: "These are guesses, and we would rather say so. Not one of these people has sat the official test and published the result. Every celebrity list on the internet, ours included, is fans voting on strangers. Enjoy it as that." Then the share card and a Start over button.

- [ ] **Step 6: Add the non-affiliation line** to the page footer, visible on every view: "Not affiliated with or endorsed by The Myers-Briggs Company."

- [ ] **Step 7: Create `js/app.js`** which calls `SG.render.mount(SG.flow.create())` on `DOMContentLoaded`.

- [ ] **Step 8: Verify by hand**

Open `index.html` directly from the filesystem. Complete the flow with the keyboard only. Confirm no percentage, `±`, or the word "margin" appears anywhere. Confirm the answering screen reveals nothing about the emerging type.

- [ ] **Step 9: Commit**

```bash
git add index.html app.css js/render.js js/app.js
git commit -m "feat: four views, keyboard operable, no tally"
```

---

### Task 6: Share card

**Files:**
- Create: `js/share.js`

**Interfaces:**
- Consumes: `SG.types.byCode`
- Produces: `SG.share.draw(result)` → `Promise<Blob>` (PNG, 1080x1350), and `SG.share.save(result)` which uses `navigator.share` when available and falls back to a download link

- [ ] **Step 1: Draw the card on a canvas.** 1080x1350. Dark ground `#17141F`. The four letters spaced, the type name large in Fraunces, and the caveat line "Solid on three. My " + first close letter + " and " + second + " sat on the line." when `closeAxis` is set, or the type line when it is not. Below that the blend bar in peach and lilac.

- [ ] **Step 2: Wait for fonts before drawing.** Call `await document.fonts.ready` first, otherwise the canvas renders in a fallback face. Verify with `document.fonts.check('64px Fraunces')` rather than measuring glyph widths.

- [ ] **Step 3: Wire the button.** `navigator.share({ files: [...] })` when supported, otherwise create an object URL and click a temporary `<a download>`.

- [ ] **Step 4: Verify by hand.** Complete a run, save the card, open the PNG. Confirm the type name is in Fraunces and not a fallback.

- [ ] **Step 5: Commit**

```bash
git add js/share.js
git commit -m "feat: share card"
```

---

### Task 7: Smoke test and deploy

**Files:**
- Create: `test/smoke.test.js`, `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the smoke test**

Create `test/smoke.test.js`. It skips cleanly when Playwright is absent, so `npm test` works on a bare checkout:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { chromium = null; }

test("the page loads and completes a run with no console errors", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") { errors.push(m.text()); } });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("file://" + path.resolve(__dirname, "..", "index.html"));
  await page.click("#btn-start");
  for (let i = 0; i < 36; i += 1) { await page.click("#btn-next"); }
  await page.waitForSelector("#view-reveal:not([hidden])");

  const body = await page.textContent("body");
  assert.ok(!/\d+%/.test(body), "a percentage leaked onto the page");
  assert.ok(!body.includes("±"), "a plus-minus leaked onto the page");
  assert.strictEqual(errors.length, 0, errors.join("\n"));
  await browser.close();
});
```

- [ ] **Step 2: Run it**

Run: `npm test`
Expected: PASS or SKIP, depending on whether Playwright is installed

- [ ] **Step 3: Create `.github/workflows/deploy.yml`**

```yaml
name: deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm test
      - run: npx -y wrangler@latest pages deploy . --project-name=personality --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 4: Create the Cloudflare Pages project and add the two repo secrets**

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The account already in use is `d44dbde9f9651ba103e8df4204017aec`.

- [ ] **Step 5: Commit and push to `main`**

```bash
git add test/smoke.test.js .github/workflows/deploy.yml
git commit -m "ci: test gate and Cloudflare Pages deploy"
git push -u origin main
```

- [ ] **Step 6: Verify the deploy**

Open the `*.pages.dev` URL. Take the test end to end on a phone. Confirm both themes render, the flow completes by keyboard, and the share card saves.

**Note on verification:** check the deploy-preview origin or use `curl`, never a page a stale service worker controls. There is no service worker in piece A, so this is only a caution for later pieces.

---

## Self-Review

**Spec coverage.** §4 adaptive split → Tasks 1, 4. §5.1 answering → Task 5 steps 3, 8. §5.2 reveal → Task 5 step 4. §5.3 type page → Tasks 3, 5 step 5. §5.4 the sixteen → **gap, see below**. §5.5 traits and zodiac → out of scope, piece D. §5.6 exclusions → enforced by Task 5 step 8 and Task 7 step 1. §6 design system → Task 5 step 2, Global Constraints. §7 i18n → out of scope, piece B. §8 storage → out of scope by decision. §12 success criteria → Tasks 4, 7.

**Gap found:** §5.4, the sixteen gallery, has no task. It is the browse surface and the SEO front door, and Task 3 already produces all the data it needs. Added as Task 5 step 5b below rather than a new task, since it is one view over data that already exists.

- [ ] **Task 5, Step 5b: Build the gallery view.** A fifth section `#view-sixteen`, reachable from the intro and the type page, rendering all sixteen as cards with code, name and line from `SG.types.byCode`. Clicking one opens that type's page in a read-only mode with no result attached. No colour coding: one accent, typography carries it.

**Placeholder scan.** Task 3 step 4 asks the implementer to write fifteen type entries rather than listing them. This is deliberate and is not a placeholder: it is a content deliverable with an executable acceptance test (Task 3 step 1 enforces field presence, length, count, uniqueness and the dash rule) and a fully worked reference entry. Everything else contains real code.

**Type consistency.** `SG.score.axisResult` returns `letterIndex`, consumed in `flow.codeFrom` as `POLES[a][axes[a].letterIndex]`. Consistent. `flow.state()` returns `total` which Task 5 step 3 uses for the word progress. `result.axes[closeAxis].est` in Task 5 step 4 matches the shape produced by `compute()`. `SG.share.draw(result)` takes the same `result` object `flow.result()` returns.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-06-piece-a-english-engine.md`. Two execution options:

**1. Subagent-Driven (recommended)** - a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
