# Handoff: Piece B, the Chinese locale (`zh-Hant-HK`)

Parked 2026-09-07. Not started. This file is self-contained.

**Read the "Three decisions still open" section before doing anything.** Three
questions were asked and deliberately left unanswered when this was parked.

---

## The project

**Personality**, a sixteen-type personality test. Live at
`personality.ryanxu.dev`. Repo at `/Users/ryan.xu/Developer/typetest`, remote
`github.com/ryanzhxu/typetest` (private), branch `main`.

The product's one distinctive idea: when two types are genuinely close for a
person, it says so and names the second type, instead of picking one and
pretending to be sure.

### Stack

Vanilla HTML, CSS and JS. **No framework, no dev-time build, no bundler.**
`index.html` must keep opening by double-clicking it from the filesystem.
Deploy-time generators are permitted and three exist. Cloudflare Pages,
deployed by GitHub Actions on push to `main`.

### File map

```
index.html            one page, five views toggled by the hidden attribute
app.css               all styles, token-driven, dark first
404.html              standalone, no scripts
js/ns.js              creates the SG namespace, loads first
js/score.js           1-7 responses to an estimate and an honesty band
js/items.js           36 core + 32 tiebreak items, English copy inline
js/types.js           the 16 types, and SG.types.SECTIONS
js/flow.js            state machine
js/share.js           1080x1350 share card drawn on a canvas
js/render.js          all DOM work, including the FEEDBACK strings
js/app.js             wiring
scripts/stage.js      builds the deploy directory (allowlist, synchronous)
scripts/build-types.js emits one HTML page per type + root + sitemap
scripts/build-og.js   renders 17 social cards and 2 raster icons (async, Chromium)
test/*.test.js        104 tests, `npm test`
docs/superpowers/specs/2026-09-06-personality-design.md   the master spec, §7 is i18n
```

### Running it

```bash
npm install
npm test                      # 104 tests, needs playwright chromium
npm run stage                 # builds ./public
npm run og                    # renders cards into ./public (after stage)
node test/serve.js public
```

### House style, enforced by tests

For the English side, and for anything you touch in it:

- **No em-dashes or en-dashes in shipped copy.** `test/types.test.js` walks
  every string in every type and fails on one. Note that this guard will walk
  the Chinese dictionary too once it exists: Chinese punctuation is full-width
  (，。、) and needs no dash, but ——  is a real Chinese punctuation mark and
  would trip the guard. Decide deliberately whether to exempt it.
- **No contractions.** "do not", "cannot", "it is".
- British spelling: colour, harbour, realise, organise.
- Second person, present tense, concrete scenes over abstractions.
- No percentages, no ± figures, and never the word "margin" on any user-facing
  surface. `test/smoke.test.js` asserts all three by scanning the rendered
  body, in both locales once both exist.

### Process

Invoke `superpowers:brainstorming` first, and **also invoke the `chinese-i18n`
skill**, which was written for exactly this and carries the runtime pattern,
the locale-purity checks and a long list of traps. One caveat about it below.

---

## Decisions already taken, 2026-09-07

These are settled and recorded as amendments in the spec. Do not reopen them
without a reason.

**1. Two locales, not four.** `en` and `zh-Hant-HK`. The spec originally
planned `zh-Hans`, `zh-Hant-TW` and `zh-Hant-HK`. The other two are dropped
from the plan. They can be added later, each paying its own transcreation
pass, and that is understood.

**2. The Hong Kong register is 書面語, not Cantonese.** This is the important
one, and it is a correction to the original spec.

The target is **Standard Written Chinese in Traditional characters with Hong
Kong conventions** — what Hong Kong newspapers, government and formal writing
actually use. It is **not** written Cantonese (粵文).

- Hong Kong word and glyph choices: 裏 over 裡, 着 over 著, 網絡 over 網路,
  質素 over 素質.
- Standard written grammar throughout. **None of** 佢, 咗, 嘅, 冇, 睇, 喺, 嘢.
- The spec's original justification for a Cantonese locale was six regional
  type names: 避風塘, 搞手, 冇迫力, 加場, 星期日下晝, 拆嘢佬. These must be
  re-decided against this register. 避風塘 survives, being an ordinary written
  noun. 拆嘢佬 and 冇迫力 do not, being Cantonese.

**3. Celebrity names are deferred.** Whether the Chinese pages keep the same
five people per type with Chinese renderings, or swap in figures a Hong Kong
reader actually recognises, was explicitly parked with "decide when we get
there". It is ~80 judgement calls either way.

---

## Three decisions still open

These were asked and left unanswered. **Ask them again before starting.**

### 1. Staging

How to break up ~10,000 words of Chinese.

- **Runtime plus a voice sample first** (this was the recommendation). Build
  the whole runtime, switcher, fonts and URL scheme, then write only the UI
  chrome, the 16 type names and the 16 one-liners. Get those read and
  approved, then write the bulk against a settled voice. This mirrors how the
  English type-page expansion was done, which worked: one sample type was
  written and approved before the other fifteen.
- Runtime first with English placeholders in both locales, all writing later.
- Everything at once.

### 2. URL scheme

Permanent for SEO, so worth confirming out loud.

- `/zh-hk/` path prefix. English stays at `/` and `/enfj`, Chinese at
  `/zh-hk/` and `/zh-hk/enfj`. **This is what the spec already picked** (see
  `docs/superpowers/specs/2026-09-07-piece-a3-type-pages.md`, which sketches
  `/zh-cn/enfj`, `/zh-hk/enfj`, `/zh-tw/enfj` as "later, piece B"), and it
  matches the `personal-site` precedent of `src/app/zh-cn`, `src/app/zh-hk`.
  34 generated pages, hreflang pairs.
- `/enfj/zh-hk` suffix. Keeps a type's pages adjacent, weaker locale signal.
- `?lang=zh-hk`. Half the pages, but search engines treat it as one page and
  the Chinese content largely will not rank.

### 3. The sixteen type names

This sets the whole voice, so it is the first writing decision.

- Write new Chinese names with the same feel, not translations. The English
  names are evocative rather than literal: Deep Water, The Rabbit Hole, Warm
  Front, Safe Harbour, Wildflower, No Brakes.
- Translate the English image directly. Safer, flatter, some will read oddly.
- Keep the English names on the Chinese pages, translate everything else.
  Common on bilingual Hong Kong sites, preserves the brand, loses the wordplay.

---

## The work

### Scale, honestly

| Content | Strings | Notes |
|---|---|---|
| Core items, 36 x 2 poles | 72 | `js/items.js` |
| Tiebreak items, 32 x 2 poles | 64 | `js/items.js` |
| Type names and one-liners | 32 | `js/types.js` |
| Type page prose, 16 x (3 paragraphs + 5 chips) | 128 | `js/types.js` |
| **The five long sections, 16 x 5 x 3 paragraphs** | **240** | **8,587 English words** |
| Section headings | 5 | `SG.types.SECTIONS`, stored once on purpose |
| Celebrity names, 16 x 5 | 80 | deferred, see above |
| Interface strings | ~60 | `index.html`, `js/render.js` |

Roughly **10,000 words of Chinese, hand-written**. The spec forbids generating
one locale from another with a converter, and it is right to: a glyph
converter changes characters, not vocabulary, and produces 履历 where the
correct word is 简历. This is a multi-session writing job, not a one-sitting
one.

### Structural changes required

**`js/types.js` and `js/items.js` become locale dictionaries.** They currently
hold English copy inline and everything depends on them. This is the largest
refactor in the piece and it touches `scripts/build-types.js`,
`scripts/build-og.js`, `js/render.js` and most tests.

**`numberWords()` in `js/render.js` is English-specific.** It spells 0 to 36 in
English words, deliberately, so progress "reads like a person talking, never
like a counter". Spec §5.1 says Chinese uses digits instead, because
spelled-out numerals look strange. So progress becomes a per-locale function,
not one shared one.

**Note a trap in spec §5.1.** Its Chinese example was "做咗 9 題，仲有 27 題",
which is Cantonese (做咗, 仲有) and contradicts decision 2 above. An amendment
now flags it. The 書面語 wording is still to be decided, along the lines of
"已完成 9 題，尚餘 27 題". **Do not copy the old example.**

**`scripts/build-types.js` goes from 17 pages to 34**, plus `hreflang`
alternate pairs on every page, a per-locale canonical, `lang` on `<html>`, and
sitemap entries for both.

**`scripts/build-og.js` needs a CJK face.** It renders the social cards in
Fraunces and Karla, neither of which has a single CJK glyph. It also has a font
guard that fails the build if a face did not load; that guard will need the
CJK face added to it. Read `facesFor()` and `assertFonts()` before touching it.

**`js/share.js` draws text on a canvas** with `ctx.measureText` line wrapping
that splits on spaces. Chinese does not use spaces between words, so the
wrapping will produce one enormous line. This needs per-character wrapping for
CJK.

**`js/render.js` holds the seven `FEEDBACK` strings** for the answer scale
("Strongly the first one" … "Both, equally" …). They are UI copy and need
translating.

### Fonts

The `chinese-i18n` skill warns that full CJK families run 50-60MB and tells you
to subset with `pyftsubset`. **You can sidestep that entirely here**: Google
Fonts serves Noto Serif HK and Noto Sans HK with automatic `unicode-range`
subsetting, and the site already loads Fraunces and Karla from Google Fonts, so
this adds no build step and no new dependency. Bind them through the existing
`--font-display` and `--font-body` CSS variables so one stylesheet serves both
locales. Spec §6 says Chinese sets in serif throughout.

### The one place the `chinese-i18n` skill is wrong for us

The skill ships a `check-locales.js` whose Hong Kong direction includes a
**positive Cantonese check**: it asserts that any `zh-Hant-HK` string over ~12
CJK characters *contains* a Cantonese marker, and warns when it does not.

**That is exactly backwards for this project.** Decision 2 above makes 書面語
the target. Our check must **fail** on 佢, 咗, 嘅, 冇, 睇, 喺, 嘢 in
`zh-Hant-HK`, while still catching Simplified glyphs and Taiwan-only vocabulary
(網路, 品質, 軟體).

Keep the skill's advice about narrow lists: 係 is never a Cantonese marker
(關係, 係數), and 他 and 不 are never Mandarin markers (其他, 不過). A noisy
check gets muted, and a muted check guards nothing.

### What no test can check

Vocabulary and script are checkable. Register, humour and whether a metaphor
survived the move are not. The type names and the asterisk paragraph set the
voice for everything else and should be settled first, by a person who reads
Hong Kong Chinese, before the other 9,000 words are written against them.

### Acceptance

- Both locales load and switch without a page reload.
- Every `data-i18n` key exists in both dictionaries, asserted in CI.
- `check-locales.js` passes, with the HK direction guarding *against*
  Cantonese.
- `/zh-hk/enfj` (or whatever scheme is chosen) serves complete Chinese content
  in the raw HTML, with no JavaScript run. The English pages already do this
  and there are tests to copy.
- `hreflang` pairs are reciprocal and both canonicals are correct.
- The share card wraps Chinese text correctly.
- The social cards render in a CJK face, and the font guard fails the build if
  they would not.
- A human who reads Hong Kong Chinese has read every string.
