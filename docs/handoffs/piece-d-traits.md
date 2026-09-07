# Handoff: Piece D, traits

Parked 2026-09-07. Not started. This file is self-contained.

**This is the piece with the most ways to do real harm.** It touches
clinical-adjacent ground on purpose, and the spec's constraints about that are
not stylistic preferences. Read "The lines that do not move" before designing.

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
Deploy-time generators are permitted and three exist. Cloudflare Pages,
deployed by GitHub Actions on push to `main`.

### File map

```
index.html            one page, five views toggled by the hidden attribute
app.css               all styles, token-driven, dark first
js/ns.js              creates the SG namespace, loads first
js/score.js           1-7 responses to an estimate and an honesty band
js/items.js           36 core + 32 tiebreak items, and AXES / POLES
js/flow.js            state machine, and the tiebreak opt-in this piece parallels
js/types.js           the 16 types
js/render.js          all DOM work
js/share.js           the share card
scripts/stage.js      builds the deploy directory
scripts/build-types.js emits one HTML page per type
scripts/build-og.js   social cards
test/*.test.js        104 tests, `npm test`
docs/superpowers/specs/2026-09-06-personality-design.md   the master spec, §5.5 is this
```

### Running it

```bash
npm install
npm test                      # 104 tests, needs playwright chromium
npm run stage && npm run og
node test/serve.js public
```

### House style, enforced by tests

- **No em-dashes or en-dashes in shipped copy.** A test walks every string.
- **No contractions.** "do not", "cannot", "it is".
- British spelling. Second person, present tense, concrete over abstract.
- **No percentages, no ± figures, never the word "margin"** on any user-facing
  surface. `test/smoke.test.js` asserts all three by scanning the rendered body.

### Process

Invoke `superpowers:brainstorming` first, classify, present a design, get
approval, then work test-first.

---

## The work

Spec §5.5, quoted in full because every sentence is load-bearing:

> Six scales covering the ground behind 偏执型, 回避型 and 依赖型, derived from
> CAT-PD-SF (public domain via IPIP, commercial use permitted) and rewritten
> into civilian language. Rendered as scales with plain anchors at both ends,
> never badges, never diagnoses. Its own chapter, one deliberate tap from the
> result.
>
> **They need their own items, and they cannot go in the core flow.** Six
> scales want roughly 24 items. Added to the core 36 that is a 66-question
> test, which destroys the reason the adaptive split exists.
>
> So traits are a **second opt-in, parallel to the tiebreak**, offered on the
> result page: "Want to go deeper? Twenty-four more about how you handle
> people." Same philosophy as §4. The core stays short, everything longer is
> chosen.

### The lines that do not move

From spec §3, "Constraints that are not up for discussion":

- **Every item is self-authored.** No item or phrasing is taken from any
  existing instrument. Public-domain sources (IPIP, CAT-PD-SF) may be used as
  a starting point for the trait section only, and must be rewritten.
- **No clinical label reaches any shareable surface.** Trait results live on a
  private page behind a deliberate tap. They must not reach the share card,
  the `og:image`, the page title, or any URL.

From §5.5 and §5.7:

- **Scales with plain anchors at both ends. Never badges. Never diagnoses.**
- The Chinese diagnostic terms named in §5.5 describe the *ground being
  covered*. They are orientation for whoever writes the items. **None of them
  appears on screen, in either language.**
- §5.7 excludes any dissociation or DID mechanic outright: "a trauma disorder,
  not a typology, and no self-report instrument can identify it."

If a design decision makes a result feel more like a label and less like a
position on a scale, it is the wrong decision, however good it looks.

### Existing machinery to reuse, not rebuild

**The tiebreak is the exact pattern this parallels.** Read `js/flow.js`. After
a result, if an axis was close, `canSettle()` is true and `settle()` swaps the
queue for tiebreak items on that axis and returns the view to `question`.
Traits are the same shape: an opt-in from the result page that reuses the whole
question view and then returns somewhere new.

**The question view already does what you need.** It is a seven-point scale
between two statements, rendered as seven dots, with keyboard support, a Back
button and auto-advance. `js/render.js` builds it. Traits want scales with
plain anchors, which is very close, but confirm whether trait items are
forced-choice between two statements like the core items, or single statements
on an agree/disagree scale. **The core items are forced-choice pairs, and
CAT-PD-SF style items are usually single statements.** That is a real
structural difference and the first thing to settle.

**`js/score.js` may not fit.** It maps 1-7 to -1..+1 and produces an estimate
plus an honesty band, for a *bipolar axis with two poles*. A trait scale is not
obviously bipolar in the same way. Decide whether traits reuse `axisResult()`
or need their own scoring, and say why.

### Sequencing, and why this is late

Spec §10 sets the build order, and the rule behind it is: **anything shipping
after B pays for its own transcreation pass.** Content written before the
Chinese locale gets written once in each language. Content written after needs
a second pass.

Traits are 24 items plus six scale descriptions plus anchors, which would hold
the locale build up considerably. So they ship after it **and pay the second
pass knowingly**. That is a decision already taken, not an oversight. Budget
for translating this piece separately. See
[piece-b-chinese-locale.md](piece-b-chinese-locale.md).

### Honesty about what the numbers mean

The site currently computes its honesty bands from *assumed* item variance,
because there is no datastore. Spec §8 is explicit that copy must say
"estimated" and cannot say "measured" until a corpus exists. Whatever traits
report is subject to the same rule, and with six new scales and no calibration
at all the estimates are weaker than the four core axes, not stronger. The copy
has to carry that.

See [piece-e-storage-consent.md](piece-e-storage-consent.md), which is the
piece that would eventually change the word.

### Acceptance

- Six scales, roughly 24 items, every item self-authored and rewritten.
- Offered as an opt-in from the result page, never automatic, never appended to
  the core 36.
- Results render as scales with plain anchors. No badges, no labels, no
  diagnoses.
- No clinical term on screen in any language.
- Nothing from this piece reaches the share card, the social card, the title or
  a URL. Add a test that asserts it, in the style of the existing
  `assertNoLeakedNumbers` helper in `test/smoke.test.js`.
- The copy says estimated, not measured.
- `npm test` green, and the new tests fail if you revert the feature.
