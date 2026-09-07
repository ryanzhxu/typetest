# Handoff: Piece A2, zodiac

Parked 2026-09-07. Not started. This file is self-contained.

---

## The project

**Personality**, a sixteen-type personality test. Live at
`personality.ryanxu.dev`. Repo at `/Users/ryan.xu/Developer/typetest`, remote
`github.com/ryanzhxu/typetest` (private), branch `main`.

The product's one distinctive idea: when two types are genuinely close for a
person, it says so and names the second type, instead of picking one and
pretending to be sure. Everything about the tone follows from that honesty.

### Stack

Vanilla HTML, CSS and JS. **No framework, no dev-time build, no bundler.**
`index.html` must keep opening by double-clicking it from the filesystem.
Deploy-time generators are permitted (amended into the spec 2026-09-07), and
three exist. Cloudflare Pages, deployed by GitHub Actions on push to `main`.

### File map

```
index.html            one page, five views toggled by the hidden attribute
app.css               all styles, token-driven, dark first
404.html              standalone, no scripts
favicon.svg           source file
js/ns.js              creates the SG namespace, loads first
js/score.js           1-7 responses to an estimate and an honesty band
js/items.js           36 core items + 32 tiebreak items, English copy inline
js/types.js           the 16 types: names, lines, prose, chips, celebrities
js/flow.js            state machine: intro, question, reveal, type
js/share.js           1080x1350 share card drawn on a canvas
js/render.js          all DOM work, mounts onto the flow
js/app.js             wires flow to render
scripts/stage.js      builds the deploy directory (allowlist, synchronous)
scripts/build-types.js emits one HTML page per type + root + sitemap
scripts/build-og.js   renders 17 social cards and 2 raster icons (async, Chromium)
test/*.test.js        104 tests, `npm test`
docs/superpowers/specs/2026-09-06-personality-design.md   the master spec
```

`docs/`, `test/` and `scripts/` are on `stage.js`'s protected list and never
ship.

### Running it

```bash
npm install
npm test                      # 104 tests, needs playwright chromium
npm run stage                 # builds ./public
npm run og                    # renders cards into ./public (after stage)
node test/serve.js public     # serves it the way Cloudflare Pages does
```

### House style, enforced by tests

- **No em-dashes or en-dashes anywhere in shipped copy.** `test/types.test.js`
  walks every string in every type and fails on one.
- **No contractions.** "do not", "cannot", "it is". The whole site is written
  this way.
- British spelling: colour, harbour, realise, organise.
- Second person, present tense, concrete scenes over abstractions.
- No percentages, no ± figures, and never the word "margin" on any user-facing
  surface. `test/smoke.test.js` asserts all three.

### Process

This repo uses the `superpowers` skills. **Invoke `superpowers:brainstorming`
before writing code**, classify the work, present a design, and get explicit
approval before implementing. Then work test-first. Commit messages in this
repo are long and explain *why*, including what was tried and rejected.

---

## The work

Spec §5.6. Add a zodiac section: sun sign and Chinese zodiac animal, from one
birthday input.

### What the spec fixes, and does not leave open

> Opt-in, birthday-gated, visually distinct register so it cannot be mistaken
> for the measured part. Plain animal names only, no 三合 or 六合 terminology on
> screen.
>
> **The lunar new year cutoff must be handled with a date table**; a naive
> `year % 12` gives the wrong animal for anyone born in January or early
> February.
>
> Costs no new questions: one date input, a sun-sign range table, a
> twelve-animal table and the lunar new year dates.

Four pieces of data, then. No new questions are added to the test.

### The one thing that will go wrong

`year % 12` is wrong for anybody born between 1 January and roughly 20
February, because the Chinese year does not start on 1 January. Someone born
1 February 1990 is a Snake, not a Horse. This needs a real table of lunar new
year dates, one row per year, over whatever birth-year range you support.
Decide that range explicitly and say what happens outside it.

Get this wrong and it is invisible in testing unless you specifically test a
January birthday, so **write that test first**.

### Register

The spec's word is that the zodiac must be "visually distinct" so it cannot be
mistaken for the measured part. The rest of the site is careful about what it
claims. Zodiac is not a measurement and the design has to say so without a
disclaimer doing the work. That is a design problem worth brainstorming, not
a paragraph to bolt on.

Precedent already in the codebase for this kind of honesty: the celebrity list
on every type page carries the "asterisk paragraph" saying plainly that the
names are fans guessing about strangers. Read it in `js/types.js`'s consumers
and in `index.html` before designing this.

### Privacy, which is not optional here

The intro promises: **"No account. Nothing saved. Nothing sent anywhere."**
That is on the front page today. A birthday is personal data and this promise
covers it. The date must stay in memory, must not reach `localStorage` without
a decision, and must not be sent anywhere at all. If you want to persist it,
that is a product decision to raise, not to make.

### Where it goes

Spec §5.5 describes traits as "one deliberate tap from the result". Zodiac sits
next to traits on the result page. Follow the same pattern: opt-in, not
automatic, and not part of the reveal.

### Why this is sequenced before the Chinese locale

Spec §10: *anything shipping after B pays for its own transcreation pass.*
Zodiac is a handful of words, so it makes the Chinese cut almost free. Traits
are 24 items plus six scale descriptions, which would hold B up, so they ship
after and pay a second pass knowingly. Do not resequence without reading §10.

Note that the animal and sign names are exactly the kind of content that will
need real Hong Kong Traditional Chinese later. See
[piece-b-chinese-locale.md](piece-b-chinese-locale.md).

### Acceptance

- A January birthday and an early-February birthday both produce the correct
  animal, asserted in a test against hand-checked known cases.
- A birthday on a sun-sign boundary produces the documented sign.
- The birthday never leaves the page.
- The section is opt-in and visually distinct from the measured result.
- No 三合 or 六合 on screen.
- `npm test` green, and the new tests fail if you revert the feature.
