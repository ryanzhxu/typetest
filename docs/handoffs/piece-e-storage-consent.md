# Handoff: Piece E, storage and consent

Parked 2026-09-07. Not started. This file is self-contained.

**Most of this piece is privacy work, not statistics.** Spec §8 says so
directly. If you find yourself designing a schema in the first hour, you are in
the wrong part of the problem.

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
deployed by GitHub Actions on push to `main`. **There is no backend of any
kind today.** This piece would introduce the first one.

### File map

```
index.html            one page, five views; carries the current privacy promise
js/score.js           THE FILE THIS PIECE IS ABOUT: bands from assumed variance
js/flow.js            state machine
js/render.js          all DOM work
scripts/stage.js      builds the deploy directory
test/score.test.js    the band maths, already tested
docs/superpowers/specs/2026-09-06-personality-design.md   the master spec, §8 is this
```

### Running it

```bash
npm install
npm test                      # 104 tests, needs playwright chromium
npm run stage && npm run og
node test/serve.js public
```

### House style, enforced by tests

This piece rewrites front-page copy, so the rules apply:

- **No em-dashes or en-dashes in shipped copy.** A test walks every string.
- **No contractions.** "do not", "cannot", "it is".
- British spelling. Second person, present tense.
- No percentages, no ± figures, and never the word "margin" on any user-facing
  surface. `test/smoke.test.js` asserts all three by scanning the rendered
  body. This matters here: a consent screen is exactly where a percentage or a
  confidence figure tends to sneak in.

### Process

Invoke `superpowers:brainstorming` first. This is architectural: it is a new
subsystem and it changes a promise on the front page. Expect a written spec and
an implementation plan, not a short in-chat design.

---

## What the spec already decided

§8, quoted:

> Everything strong depends on this: calibrated bands, distribution plots, the
> retest ledger, a public psychometrics page.
>
> **Option A, no storage.** Bands computed from assumed item variance.
> Defensible as an estimate, but the copy must say "estimated" and cannot say
> "measured". No retest, no distributions.
>
> **Option B, storage from day one.** Datastore, anonymous identity for
> retests, consent step, privacy policy. PIPL and GDPR become live concerns
> given the Chinese-language audience.
>
> **Option C, staged. Recommended.** Ship with estimated bands and collect from
> day one behind clear consent. Switch to empirical bands once the corpus is
> large enough. The user-facing word changes from "estimated" to "measured",
> which is a genuinely good second-launch story.
>
> The recommendation is C. It needs the same consent and privacy work as B, so
> it is not a way to defer that decision, only a way to defer the statistics.
>
> **Decided 2026-09-06: storage is out of piece A entirely.** [...] The band
> maths is identical either way; only its inputs change when a corpus exists,
> so nothing built in A is thrown away.

So: the recommendation is C, the deferral out of piece A is decided, and
**nothing built so far has to be thrown away.** `js/score.js` keeps its shape;
only the numbers feeding it would change.

§11 lists storage as the **one blocking open question** in the whole project.

---

## The decision that comes before any code

**Should this product collect anything at all?**

The spec recommends C, but C is a recommendation about *how* to stage
collection, not a decision that collection is worth it. That second question is
still open and is a product call, not an engineering one. Put it to the owner
explicitly before designing anything, because the honest answer may be no, and
if it is no then this entire piece disappears rather than shrinking.

What collection would buy, per §8: calibrated bands instead of assumed ones,
distribution plots, a retest ledger, and a public psychometrics page. Those are
real and they are the difference between "estimated" and "measured".

What it costs is set out below, and it is not small.

---

## What the front page currently promises

`index.html`, on the intro view, in the shipped copy today:

> **No account. Nothing saved. Nothing sent anywhere.**

That is three separate promises and this piece breaks all three. It is the
strongest constraint in the whole handoff. Any design has to say plainly what
that line becomes, and a consent step that leaves a weaker version of this
sentence on the page is a worse product than one that collects nothing.

Do not treat rewriting this line as a copy task at the end. It is the design.

---

## The legal work, which is the bulk

§8 names PIPL and GDPR as live concerns "given the Chinese-language audience".
Note that the audience assumption has since narrowed: the locale plan is now
`en` plus `zh-Hant-HK` only, with `zh-Hans` dropped (see
[piece-b-chinese-locale.md](piece-b-chinese-locale.md)). Hong Kong's PDPO is
therefore the regime that most obviously applies, alongside GDPR for European
visitors. **Whether mainland PIPL still applies is a question for someone
qualified, not an inference to make from a locale list.**

Personality-test responses are not casual data. Depending on the regime and how
they are combined, they can attract heightened protection. If piece D ever
ships, its trait items cover clinical-adjacent ground by design (see
[piece-d-traits.md](piece-d-traits.md)), which raises this further.

Deliverables that are not code:

- A privacy policy that is true.
- A consent step that is genuine: refusable without losing the test, not
  pre-ticked, and not a dark pattern.
- A retention decision, with a deletion path that actually works.
- A position on what "anonymous" means here, given that a full 36-item response
  vector is close to a fingerprint. **Do not describe it as anonymous until
  that has been thought through.**

---

## The engineering, which is the smaller half

- A datastore. There is no backend today, so this is a new dependency and a new
  operational surface on a site that currently deploys as static files.
- An anonymous identity for retests, which is the part in most tension with the
  privacy promise.
- The switch from estimated to measured bands. `js/score.js` has `SD_FLOOR`,
  `SKIP_PENALTY`, `HALF_MIN`, `HALF_MAX` and a `Z` of 1.96, all documented in
  place, and `test/score.test.js` covers the maths. Read both before changing
  anything: the estimate itself does not change, only where the variance comes
  from.
- Nothing user-facing may say "measured" until the corpus actually supports it.
  Shipping the word ahead of the data would be the exact dishonesty the whole
  product is built against.

---

## Acceptance

- The prior question, whether to collect at all, has been asked and answered by
  the owner.
- The front-page promise is rewritten deliberately, and the new wording is
  true.
- Consent is refusable, and refusing it still gives the full test.
- A deletion path exists and is tested.
- The privacy policy matches what the code actually does. Verify by reading the
  code against the policy, not by trusting the design doc.
- The word "measured" appears only once empirical bands are in use, and a test
  asserts the copy while the corpus is still assumed.
- `npm test` green.
