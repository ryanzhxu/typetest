# Personality — design

**Status:** design agreed except for one open decision (storage, §8).
**Date:** 2026-09-06
**Name:** Personality. Decided 2026-09-06.
**Address:** `personality.ryanxu.dev`
**Prototype:** https://claude.ai/code/artifact/24ecd8a9-e279-4ee8-be1d-f4e63fd89456

The name and the subdomain match on purpose. A generic category word carries
fine as a product name when the address agrees with it, and on a personal site
a plain name is read instantly. The known cost is that it is hard to pass along
by name, so the blurb on the site card does the selling the name does not.

The name clears §3 by not going near it: "personality" is generic and
unownable, which is exactly why it is safe where `mbti` is not.

---

## 1. What this is

A four-letter personality test that, when two types are close, names the second
type living inside your result instead of printing a confident guess.

Warm and character-led on the surface. Real measurement underneath. Four
languages, each written by hand.

Greenfield. No code or content is carried over from Prism or Quirky.

## 2. Why it exists

About half of people who take a four-letter test get a different code when they
retake it four to six weeks later. That is a property of cutting a continuous,
roughly normal distribution at its midpoint, not a property of bad questions.
Most people sit near the middle on at least one axis, so a small shift in mood
flips a letter and the whole code changes.

This cannot be fixed by writing better items. The ceiling is the model.

So the goal is not accuracy. **The goal is to be the only one that is honest
about it**, and to make that honesty the most interesting thing on the page
rather than a disclaimer at the bottom.

The product decision that follows: uncertainty is told as a person, not a
statistic. Not "T/F fell inside the margin of error" but "there is a Deep Water
in you too."

## 3. Constraints that are not up for discussion

1. **Never name the well-known indicator as a product name, domain, page title,
   `og:title`, or store listing.** It is a live registered mark, and one of its
   registrations covers "providing psychological testing services" on a global
   computer network, which is exactly this product. Nominative references are
   allowed in body copy only: adjective plus noun, ® on first use, with a
   visible non-affiliation line. Search traffic comes from page content, not
   from the domain, and content is where fair use actually protects us.
2. **Every item is self-authored.** No item, phrasing, or type name is taken
   from any existing instrument. Public-domain sources (IPIP, CAT-PD-SF) may be
   used as a starting point for the trait section only, rewritten.
3. **Celebrity types are labeled as guesses.** No living public figure has sat
   the official assessment and published the result. Names only, never
   photographs, which are a licensing problem.
4. **No clinical label reaches any shareable surface.** Trait results live on a
   private page behind a deliberate tap.
5. **Four locales, hand-written, no fallback chain.** A missing string is a bug
   to fix, never a thing to fall back from.

## 4. The adaptive split

The core tension: an honest instrument wants length, a shareable quiz wants
brevity. The split resolves it.

- **Core:** 36 items, 9 per axis. Seven-point slider between two statements.
  "Neither, really" is always available, records as missing, and widens the
  band rather than inventing a preference.
- **Scoring:** continuous, then thresholded. The continuous score and its
  uncertainty are computed and stored, never displayed.
- **The branch:** if an axis falls inside the noise band, the reveal names the
  second type and offers eight more items aimed only at that axis.
- **Both endings are good.** Settle it, or keep both and get a dual result with
  a page written for people who live on that line.

Expected to fire for roughly a third of takers. The other two thirds get one
clean screen and never see the second-self card.

## 5. Screens

### 5.1 Answering

No running tally and no emerging type. This was cut deliberately: watching a
type form is the most seductive thing that could be on the screen, and it makes
people answer to confirm what they can see. Removing it makes the test calmer
*and* more accurate, which is a rare trade.

- Slider gives word feedback about the answer just given, never about the type.
- Progress reads "Nine down, twenty-seven to go" in English and "做咗 9 題，仲有
  27 題" in Chinese. Words in English because it sounds like a person; digits in
  Chinese because spelled-out numerals look strange.
- Whole flow is keyboard-operable.

### 5.2 The reveal

Type code, name, and one line. If an axis was close, the second-self card
appears: the other type named, a blended peach-and-lilac bar showing how close
it was without a number, and two buttons.

### 5.3 The type page

Three paragraphs in second person, framed as "you are at your best" and "you
come undone" rather than strengths and weaknesses. Five chips. Five celebrity
names on pills, with the asterisk paragraph underneath. Share card that carries
the second self.

### 5.4 The sixteen

Gallery of all sixteen. This is the second product: most arrivals will never
take the test, having searched for what their letters mean or to look someone
up. Sixteen good pages beats one good quiz for traffic.

**NOT IMPLEMENTED as of piece A.** Shipped as one page with sixteen JS-toggled
views and no routing, so there are no sixteen pages and this thesis is inert.
Designed as piece A3: `docs/superpowers/specs/2026-09-07-piece-a3-type-pages.md`.
Do not add the personal-site card until A3 lands.

### 5.5 Traits

Six scales covering the ground behind 偏执型, 回避型 and 依赖型, derived from
CAT-PD-SF (public domain via IPIP, commercial use permitted) and rewritten into
civilian language. Rendered as scales with plain anchors at both ends, never
badges, never diagnoses. Its own chapter, one deliberate tap from the result.

**They need their own items, and they cannot go in the core flow.** Six scales
want roughly 24 items. Added to the core 36 that is a 66-question test, which
destroys the reason the adaptive split exists.

So traits are a **second opt-in, parallel to the tiebreak**, offered on the
result page: "Want to go deeper? Twenty-four more about how you handle people."
Same philosophy as §4. The core stays short, everything longer is chosen.

### 5.6 Zodiac

Opt-in, birthday-gated, visually distinct register so it cannot be mistaken for
the measured part. Plain animal names only, no 三合 or 六合 terminology on
screen. **The lunar new year cutoff must be handled with a date table**; a naive
`year % 12` gives the wrong animal for anyone born in January or early February.

Costs no new questions: one date input, a sun-sign range table, a twelve-animal
table and the lunar new year dates. This is why it is sequenced differently from
traits despite sitting next to it on the page.

### 5.7 Deliberately excluded

The live resolution rail, percentages, ± figures, the word "margin" on any
user-facing surface, colour-coding the sixteen types, celebrity photographs,
and any dissociation or DID mechanic. The last is a trauma disorder, not a
typology, and no self-report instrument can identify it.

## 6. Design system

Dark first, because this is something people take at night with the lights low.

| Token | Dark | Light |
|---|---|---|
| ground | `#17141F` | `#F4F0F4` |
| raised | `#201C2B` | `#FCFAFC` |
| text | `#F3EDE3` | `#221C2C` |
| peach (your type) | `#F2A17B` | `#B85328` |
| lilac (the other one) | `#ABA0EA` | `#644FAE` |

Peach and lilac carry the whole thesis and are never spent on decoration.

Type: Fraunces and Karla for English. Noto Serif SC, TC and HK for the three
Chinese locales, one per region, bound through two CSS variables so one
stylesheet serves every locale. Chinese sets in serif throughout.

Motion sits at 3 while answering and 7 at the reveal. Density 3.

## 7. Internationalisation

Locales: `en`, `zh-Hans`, `zh-Hant-TW`, `zh-Hant-HK`. Region tags always, never
a bare `zh-Hant`. Hong Kong is written Cantonese 口語, not Traditional Mandarin.

Each locale is written by hand from the English meaning. Nothing is converted
from anything else. Six of the sixteen type names have a genuinely better
regional word (避風塘, 搞手, 冇迫力, 加場, 星期日下晝, 拆嘢佬) and a glyph
converter produces none of them.

`check-locales.js` runs in CI and guards four directions: Mandarin into
Cantonese, Cantonese into Taiwan Mandarin, wrong script either way, and
wrong-region vocabulary. Plus key parity. It lives in the `chinese-i18n` skill.

A human read per region per wave is required. No test can judge whether a joke
landed.

## 8. Storage — the one open decision

Everything strong depends on this: calibrated bands, distribution plots, the
retest ledger, a public psychometrics page.

**Option A, no storage.** Bands computed from assumed item variance. Defensible
as an estimate, but the copy must say "estimated" and cannot say "measured".
No retest, no distributions.

**Option B, storage from day one.** Datastore, anonymous identity for retests,
consent step, privacy policy. PIPL and GDPR become live concerns given the
Chinese-language audience.

**Option C, staged. Recommended.** Ship with estimated bands and collect from
day one behind clear consent. Switch to empirical bands once the corpus is
large enough. The user-facing word changes from "estimated" to "measured",
which is a genuinely good second-launch story.

The recommendation is C. It needs the same consent and privacy work as B, so it
is not a way to defer that decision, only a way to defer the statistics.

**Decided 2026-09-06: storage is out of piece A entirely.** Piece A ships with
estimated bands, no datastore, no consent step, nothing to collect. That keeps
the first deployable version small enough to verify by hand, and it means the
privacy and consent work lands in its own piece (E) rather than being smuggled
into the engine. The band maths is identical either way; only its inputs change
when a corpus exists, so nothing built in A is thrown away.

## 9. Content inventory

The bulk of this project is writing, not code.

| Piece | Per locale | × 4 |
|---|---|---|
| Core items, 36 × 2 poles | 72 | 288 |
| Tiebreak items, 32 × 2 poles | 64 | 256 |
| Type names and one-liners | 32 | 128 |
| Type pages, 16 × (3 paragraphs + 5 chips) | 128 | 512 |
| Celebrity names, 16 × 5 | 80 | 320 |
| Interface strings | ~60 | ~240 |
| **Total** | **~436** | **~1,744** |

Roughly 1,100 of those are voice-heavy and cannot be machine translated. The
sixteen type names and the asterisk paragraph set the voice for everything else
and should be settled first.

## 10. Build order

This spec covers a whole product and is too large for one implementation plan.
It decomposes into four pieces that each get their own plan, in this order.

**A. The engine, English only.** Item bank format, continuous scoring, the noise
band, the branch decision, the four screens, the share card. One locale so the
flow can be settled before it is multiplied by four. Ends with a working test
you can take end to end.

**B. The four locales.** The i18n runtime, the three Chinese dictionaries,
`check-locales.js` in CI, region fonts. Depends on A having frozen its string
keys, otherwise every key change costs four edits.

**C. The sixteen type pages.** The largest writing job, ~960 of the ~1,744
strings. Independent of A and B once the page template exists, and can run in
parallel with either. Names and the asterisk paragraph go first because they set
the voice.

**A2. Zodiac.** A date input, a sun-sign range table, a twelve-animal table and
a lunar new year date table. No new questions. Small enough to sit between A and
B, and it must, for the reason below.

**D. Traits.** The 24-item second opt-in from §5.5, six scales, plus their
descriptions and anchors. Does not block launch.

**E. Storage and consent.** Datastore, anonymous retest identity, consent step,
privacy policy, then the switch from estimated to measured bands. Its own piece
because the privacy work is the bulk of it, not the statistics.

### The rule that sets this order

**Anything shipping after B pays for its own transcreation pass.** Content that
lands before the four-locale build gets written once, in four languages, by the
same people in the same sitting. Content that lands after needs a second pass.

That is why zodiac is A2 and traits are D, despite sitting next to each other on
the result page. Zodiac is a handful of words and makes the B cut almost for
free. Traits are 24 items plus six scale descriptions plus anchors, which would
hold B up considerably, so they ship later and pay the second pass knowingly.

**Confirmed order: A ships and is verified in production before A2 and B.**
A is deployed, opened, and taken by hand. Only then do the string keys freeze
and the locales get built on top. C is what makes it worth visiting. D and E
are later.

### Piece A stack

Vanilla HTML, CSS and JS. No dev-time build, no framework. Cloudflare Pages,
deployed from GitHub Actions on push to `main`.

**Amended 2026-09-07:** a DEPLOY-time generator is permitted. The constraint's
intent is that `index.html` opens by double-clicking and is verifiable without a
toolchain, and that still holds. Piece A3 needs one to emit sixteen per-type
pages, which cannot be hand-maintained (sixteen files now, sixty-four after B).

Rationale: piece A has no server-side anything, storage is out by decision, and
a no-build site can be opened by double-clicking `index.html`, which makes it
verifiable without a toolchain. The i18n runtime in B is a `data-i18n` pass over
the DOM, which needs no compiler either.

First deploy goes to the project's `*.pages.dev` URL. The domain decision in §11
does not block verification and should not be rushed to unblock it.

## 11. Still open

1. **Storage.** §8. Blocking.
2. **~~Name and domain.~~** Settled: Personality, at `personality.ryanxu.dev`.
   A standalone domain is deliberately not bought. The product earns one or it
   does not need one.
3. **Personal site card.** Add to `personal-site/src/content/projects.ts` as
   `kind: "product"`, `presentation: "link"`, since it is public and safe to
   send visitors to. Per that file's own rule, products capitalise their own
   name and are set in the proportional face. Blurb: "A four-letter test that
   tells you which second type is living in your result." Do this after the
   first deploy, so the card never points at nothing.
4. **Tiebreak bank.** Whether the 32 tiebreak items are a separate bank or drawn
   from a longer pool per axis. Affects §9 by 256 strings.
5. **Sixteen names.** Drafted and shown in the prototype. Expected to move.

## 12. Success criteria

- All four locales load and switch without a reload.
- The 36-item flow completes by keyboard alone.
- A known answer pattern produces a known code, asserted in a test.
- An answer pattern engineered to be close triggers the second-self card.
- `check-locales.js` passes with zero errors.
- Key parity holds across all four dictionaries.
- Accessibility: visible focus throughout, 44px targets, `prefers-reduced-motion`
  respected, contrast AA in both themes.
