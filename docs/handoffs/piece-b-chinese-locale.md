# Handoff: Piece B, the Chinese locales

Wave 1 landed 2026-09-08. **The runtime is built and the voice sample is
written. What remains is the writing.** This file is self-contained.

**Read "What wave 2 has to do" and "The voice sample needs a human read"
before doing anything.**

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
                      every visible string carries data-i18n
app.css               all styles, token-driven, dark first
                      :root[data-lang="zh-*"] rebinds the two font tokens
404.html              standalone, no scripts, ENGLISH ONLY, see "Known gaps"
js/ns.js              creates the SG namespace, loads first
js/i18n.js            the locale runtime: t, format, progress, type, URLs
js/locale-en.js       the key inventory, and English is the fallback
js/locale-zh-cn.js    zh-Hans-CN
js/locale-zh-tw.js    zh-Hant-TW
js/locale-zh-hk.js    zh-Hant-HK, 書面語
js/score.js           1-7 responses to an estimate and an honesty band
js/items.js           36 core + 32 tiebreak items, English copy inline
js/types.js           the 16 types, and SG.types.SECTIONS. English base only;
                      a locale overlays name and line onto it
js/flow.js            state machine
js/share.js           1080x1350 share card drawn on a canvas
js/render.js          all DOM work, and the language switcher
js/app.js             wiring, calls SG.i18n.init() before mount
scripts/stage.js      builds the deploy directory (allowlist, synchronous)
scripts/build-types.js emits 17 pages per locale + sitemap, 69 files
scripts/build-og.js   renders 17 social cards and 2 raster icons (async)
test/*.test.js        161 tests, `npm test`
test/i18n.test.js     the runtime
test/locales.test.js  parity, script purity, register, regional vocabulary
docs/superpowers/specs/2026-09-06-personality-design.md   the master spec
```

### Running it

```bash
npm install
npm test                      # 161 tests, needs playwright chromium
npm run stage                 # builds ./public
npm run og                    # renders cards into ./public (after stage)
node test/serve.js public
# then http://127.0.0.1:PORT/zh-hk/isfj
```

---

## Decisions, all now closed

**1. Four locales.** `en`, `zh-cn`, `zh-tw`, `zh-hk`. This supersedes the
earlier "two locales, not four": the other two were added on 2026-09-08.
Cantonese (`yue-Hant-HK`) is deliberately NOT shipped.

**2. The Hong Kong register is 書面語, not Cantonese.** The target is Standard
Written Chinese in Traditional characters with Hong Kong conventions: what
Hong Kong newspapers, government and formal writing use.

- Hong Kong word and glyph choices: 裏 over 裡, 着 over 著, 網絡 over 網路,
  質素 over 品質, 互聯網 over 網際網路, 甚麼 over 什麼.
- Standard written grammar throughout. **None of** 佢, 咗, 嘅, 冇, 睇, 喺,
  嘢, 嗰, 乜, 咁, 唔, 哋. `test/locales.test.js` fails the build on any of
  them, in all three Chinese locales.
- This inverts what the `chinese-i18n` skill ships. Its `check-locales.js`
  asserts that Hong Kong copy *contains* Cantonese markers. Ours asserts the
  opposite. Do not "fix" our check to match the skill.

**3. Staging: runtime plus a voice sample first.** Wave 1 built the whole
machine and wrote the chrome, the sixteen names and the sixteen one-liners.
Wave 2 writes the rest against an approved voice.

**4. URL scheme: path prefix.** English at `/` and `/enfj`. Every other locale
one segment deep: `/zh-hk/` and `/zh-hk/enfj`. Permanent, for SEO.

`/zh-hk/` carries the trailing slash on purpose. Cloudflare Pages 308s the
directory form `/zh-hk` to `/zh-hk/`, so every canonical and every link uses
the slash or it points at a redirect. Type pages are `zh-hk/enfj.html`, files
and not directories, for the mirror image of that reason.

**5. Type names are transcreated, one set per locale.** The English names are
images, not descriptions, so each language re-finds the image rather than
translating the words. All 48 are written; see the table below.

**6. Celebrity names are still deferred.** Whether the Chinese pages keep the
same five people per type with Chinese renderings, or swap in figures each
region actually recognises, is still open. ~80 judgement calls, ~240 across
three locales. They currently fall back to the English names.

---

## What wave 1 built

### The runtime, `js/i18n.js`

- `t(key, locale)`, `format(key, values, locale)` with `{name}` placeholders.
- **English is the fallback.** A locale ships in stages: its own strings
  render, and English shows through where its words are not written yet.
- `type(code, locale)` merges a locale's `types.<CODE>` overrides onto the
  English base in `js/types.js`. This is what lets a Chinese name ship years
  before the Chinese prose.
- `progress(done, left, locale)` is per locale. English spells numerals out
  ("Zero down, thirty-six to go"); **Chinese uses digits**, because a spelled
  numeral reads formal or archaic where a digit reads as plain modern prose.
  The spec's old example "做咗 9 題，仲有 27 題" was Cantonese. The shipped HK
  wording is "已完成 9 題，尚餘 27 題".
- `pathFor` / `localeFromPath` / `pathWithoutLocale`: one place that knows
  the URL scheme, tested as exact inverses.
- **The URL decides the language, and nothing else.** `localStorage` and
  `navigator.languages` are deliberately not consulted: the generator has
  written each page in one language and stamped `data-lang` on it, and a
  runtime that disagreed with the address bar would serve Chinese under an
  English URL.

### The publish gate: two flags, not one

`meta.offered` and `meta.complete` answer two different questions, and while a
locale is being written they have different answers.

**`meta.offered`** asks whether a reader can click to it. It is `true` for all
three Chinese locales, so they appear in the language switcher. An unfinished
locale says so on its own pages, through `lang.unfinished` and the
`#locale-notice` line at the top of `main`, written in that locale's language.

This was `false` at first, folded into `meta.complete`, and that was wrong: a
locale nobody can reach is a locale nobody can review, and the review is the
thing that finishes it. The only way to show a reviewer the Chinese was to send
them a bare URL.

**`meta.complete`** asks whether a search engine should be told. It is `false`
for all three. While it is:

- the pages carry `<meta name="robots" content="noindex, follow">`,
- they are absent from `sitemap.xml`,
- and no `hreflang` set names them.

The switcher's links are not an SEO claim; `<link rel="alternate" hreflang>` in
the head is, and that still names only the complete locales.

**Flipping `meta.complete` publishes a locale.** `test/locales.test.js` refuses
to let it be `true` while any type prose or any item is still English.

### The switcher: where it lives and what it says

In a `<footer>`, below the content, hidden on the question view, and **one row
at 320px**.

It started in the header and could not stay there. Four locale names each
carrying a note stood **156px tall at 320px**, which pushed the question card
off the bottom of the screen and made the page scroll. The question view is the
one screen that is deliberately centred and thumb-critical, so the footer is
hidden there; `test/viewport.test.js` asserts the single row and the hiding.

**The names are regions, not scripts:** `English  中国大陆  香港  台灣`. This
follows Apple's own chooser. Naming the script instead (`简体中文`,
`繁體中文（香港）`) forces a region into brackets to tell Hong Kong from Taiwan,
and measured at 132px and three rows on a 320px phone against 44px and one row
for these.

Measured alternatives, all in this footer at 320px:

| pattern | labels | height |
|---|---|---|
| Apple, region only | `English 中国大陆 香港 台灣` | **44px, 1 row** |
| Wikipedia, region + script | `English 大陆简体 香港繁體 臺灣正體` | 88px, 2 rows |
| CLDR, script + region | `English 简体中文 繁體中文（香港）…` | 132px, 3 rows |

**Every name is written in the script it links to.** 中国大陆 in Simplified,
香港 and 台灣 in Traditional. This is the one rule W3C, CLDR, Chinese Wikipedia
and Apple all keep, and `test/locales.test.js` checks the names against the
same pair table as the copy, never a second hand-written list.

Two traps in that rule. 台 is a **real Traditional character**, so it is
deliberately absent from the pair table; 台灣 is the spelling Apple ships, and
臺灣 is the formal alternative. And all four entries must be the same kind of
thing: a list mixing a script name with a region name leaves a reader unable to
tell which entry means Hong Kong.

If the labels are ever revisited, Chinese Wikipedia's set (大陆简体 / 香港繁體 /
臺灣正體) is the other defensible answer, and it carries the script for a
diaspora reader who wants Simplified but is not in the mainland. It costs one
extra row. Note 正體 rather than 繁體 for Taiwan: that is Taiwan's own official
term and worth putting to the native reviewer.

### The generator

`scripts/build-types.js` went from 17 files to 69: 16 type pages and a root
per locale, plus one sitemap. It also gained a static translator, because
there is no DOM in node and the project takes no build dependency to get one.
It honours `data-i18n` and `data-i18n-attr` against the text, and **throws if
a translated element contains markup** rather than silently swallowing it.
That is why `index.html` wraps the asterisk paragraph's translated half in its
own `<span>`.

### Fonts

Fraunces and Karla have no CJK glyph. A Chinese page asks for Noto Serif and
Noto Sans in its own region's cut (SC / TC / HK), and `app.css` rebinds
`--font-display` and `--font-body` under `:root[data-lang="zh-*"]`. Google
Fonts subsets by `unicode-range` on its own, so the skill's `pyftsubset`
advice is not needed here and no build step was added. An English page asks
for no CJK family at all, which is asserted.

### The checks, `test/locales.test.js`

Eleven tests. All eleven were mutation-tested: a deliberate fault of each kind
was injected and every one was caught.

| Guard | Catches |
|---|---|
| key parity | a missing or invented key, in either direction |
| `data-i18n` coverage | a marker in the HTML with no string behind it |
| placeholder parity | a dropped `{done}`, which renders as ordinary prose |
| Cantonese blacklist | 佢咗嘅冇睇喺嘢嗰乜咁唔哋 in any locale |
| script purity | a Simplified glyph in Traditional copy, and the reverse |
| regional vocabulary | 網路 in HK copy, 質素 in TW copy, and so on |
| no locale is a copy | zh-tw and zh-hk agreeing on 5 or more of 16 types |
| house style | percentage, plus-minus, "margin", em-dash, en-dash |
| the publish gate | `complete: true` while anything is still English |

The Cantonese and vocabulary lists are **deliberately narrow**. 係 is not a
marker (關係, 係數). 他 and 不 are not markers in the other direction (其他,
不過). A noisy check gets muted, and a muted check guards nothing.

The script check's pair table (961 couples) **is the whole reach of that
check**: a character absent from it passes in either script. It has to grow
with the copy. Ambiguous characters are absent on purpose: 里, 后, 只, 干, 云,
准, 願, 志, 據, 幾 and 面 are real Traditional characters as well as the
Simplified form of something else.

---

## The voice sample needs a human read

**Nobody who reads Chinese natively has read a word of this.** That is the
single most important open item, and no test can close it: the checks judge
vocabulary and script, never register, humour, or whether a metaphor survived
the move.

### The 48 names

| Code | English | zh-HK | zh-TW | zh-CN |
|---|---|---|---|---|
| ENFJ | Warm Front | 暖鋒 | 暖鋒 | 暖锋 |
| ENFP | Wildflower | 野花 | 野花 | 野花 |
| ENTJ | Full Throttle | 全速 | 油門到底 | 全速前进 |
| ENTP | Sparks Fly | 擦出火花 | 火花四濺 | 火花四溅 |
| ESFJ | The Glue | 黏合劑 | 黏著劑 | 粘合剂 |
| ESFP | The Encore | 加場 | 安可 | 返场 |
| ESTJ | The Straight Line | 直線 | 一條直線 | 直线 |
| ESTP | No Brakes | 沒有剎車 | 沒有煞車 | 不踩刹车 |
| INFJ | The Quiet Read | 靜觀 | 安靜地讀 | 静观者 |
| INFP | Soft Focus | 柔焦 | 柔焦 | 柔焦 |
| INTJ | Deep Water | 深潭 | 靜水流深 | 深水静流 |
| INTP | The Rabbit Hole | 兔子洞 | 無底洞 | 兔子洞 |
| ISFJ | Safe Harbour | 避風塘 | 港灣 | 避风港 |
| ISFP | Slow Sunday | 星期日下午 | 慢星期天 | 慢周日 |
| ISTJ | The Backbone | 中流砥柱 | 棟樑 | 顶梁柱 |
| ISTP | The Fixer | 拆解師 | 修理工 | 拆解者 |

Three of the sixteen (野花, 柔焦, 暖鋒) are the same image in all three
locales. That is honest rather than lazy: those images translate identically.
The regional splits that are doing real work are 加場 / 安可 / 返场,
剎車 / 煞車 / 刹车, and 避風塘 / 港灣 / 避风港.

**星期日下午, not 星期日下晝.** 下晝 is Cantonese and decision 2 rules it out.
The old spec cited 冇迫力 and 拆嘢佬 as reasons for a Cantonese locale; both
are gone for the same reason.

### Specific things to ask a native reader

1. Do the sixteen names land, or do any read as a literal translation?
2. `type.best` and `type.undone` are currently a Chinese frame plus a colon
   plus the English clause ("你最好的狀態：{clause}"). The frame was chosen
   blind, because the clauses are not written yet. Expect to change it once
   they are, and consider making the whole sentence a per-type string.
3. Is `分個高下` / `分出高下` / `决出高下` right for "Settle it", which runs a
   short tiebreak?
4. HK: is 靜觀 too Buddhist for INFJ?
5. TW: is 安可 the right register, or does it read like a concert programme?

---

## What wave 2 has to do

### The writing, honestly

| Content | Strings per locale | Status |
|---|---|---|
| Interface, names, one-liners | 81 | **done, wave 1** |
| Item statements, 36 core + 32 tiebreak | 68 | **done** |
| All sixteen types, end to end | 368 | **done** |
| Celebrity names, 16 x 5 | 80 | deferred by decision |

**518 strings per locale, 1,554 in all, roughly 56,000 Chinese characters.
The writing is finished.**

Every string on the site exists in all three locales. A check over all 548
user-facing strings per locale finds **zero** still falling back to English.
The only Latin left on a Chinese page is the four-letter type code, which is
the same in every language, and the five celebrity names per type, which an
earlier decision deferred.

### The writing is done. The locales are still not published.

`meta.complete` is still `false` for all three, and it should stay false until
a native reader per region has been through them. That flag is not "is it
translated", it is "has a person confirmed it reads right", and no test can
answer the second question. See "The voice sample needs a human read" above:
the five questions there now apply to sixteen types rather than one.

An earlier version of this file said 584 per locale. That was wrong: it counted
both poles of every item, and **only one pole is ever rendered**. `js/render.js`
draws `SG.i18n.statement(item)`, which resolves one string per item id; the
other pole exists so each item's opposite is checked at design time, and it
stays English. 68 statements, not 136.

### How an item is translated

`js/items.js` gives every item a **stable id** (`EI1`, `JP-t8`), and a locale
dictionary keys its statement on that id. Position would not do: renumbering
the file would silently re-point every translated statement at a different
question, and nothing downstream would notice.

### What the dictionaries are, and are not

`types.*` and `items.*` are **overlays onto an English base**, not a mirror of
the English dictionary. `js/types.js` and `js/items.js` hold the English copy,
and a locale carries only the fields it has words for yet. Every other key is
interface copy with no base to fall back to, so it must exist in full in every
locale, and `test/locales.test.js` enforces those two rules differently:

- interface keys: exact set equality against English;
- overlay keys: the type and the field must be real, and an array field must
  keep its length. `types.INFJ.openning` would otherwise never be read, and the
  English would show through looking merely untranslated.

`locale-en.js` restates the English items and the English names, because every
locale carries the same keys and English is the fallback they resolve against.
That is only safe while the two cannot disagree, and one test is what makes it
so.

### A frame that only a real clause could have caught

`type.best` and `type.undone` are templates, and the Chinese versions first
shipped ending in 的時候 while every clause opened with 當 or 你. The sentence
then said "the time when" twice, or "you" twice. It read fine in the abstract
and wrong the moment a real clause existed, which is exactly what writing one
type end to end is for. Both frames were rewritten and the clauses now open
with neither word.

Note that the five long sections are **82% of the words**. They are also where
the voice lives, which is why they go last.

The order decided on 2026-09-08 was: `js/items.js` becomes a locale dictionary,
then the 68 statements, then one type end to end, then a native read, then the
other fifteen. **The read was skipped and the fifteen were written anyway, on
an explicit instruction to continue.** That is a recorded decision, not an
oversight, and it means the register of 56,000 characters rests on a voice
nobody has confirmed.

The practical consequence: if the review comes back saying the register is
wrong, the rework is the whole body of prose rather than one type. The bet was
taken knowingly.

**There is no more writing to schedule. The next step is the read.** Send
`/zh-hk/`, `/zh-tw/` and `/zh-cn/` to a reader per region, with the questions
in "Specific things to ask a native reader" above.

### The structural work still outstanding

**`js/items.js` still holds English copy inline.** It has to become a locale
dictionary the same way names and lines did. `SG.i18n` already has the merge
machinery; items need an equivalent of `i18n.type()`.

**`js/share.js` wraps canvas text on spaces.** Chinese does not put spaces
between words, so the wrapping will produce one enormous line. It needs
per-character wrapping for CJK. It also still reads `SG.types.byCode`
directly rather than `SG.i18n.type()`, so a Chinese result currently draws an
English card.

**`scripts/build-og.js` needs a CJK face.** It renders in Fraunces and Karla,
neither of which has a CJK glyph, and it has a font guard that fails the build
if a face did not load. Read `facesFor()` and `assertFonts()` before touching
it. Until then all four locales share the English cards, which is why
`cardFor()` in the generator is locale-blind and says so.

**`404.html` is English only.** It is standalone with no scripts, so
`/zh-hk/nonsense` currently serves an English 404. Either give it the same
data-i18n treatment and generate one per locale, or accept it and say so.

### Acceptance

- Every `data-i18n` key exists in every dictionary, asserted in CI. **Done.**
- `test/locales.test.js` passes, with all three Chinese directions guarding
  *against* Cantonese. **Done.**
- A locale page serves complete Chinese content in the raw HTML with no
  JavaScript run. **Done, all sixteen types in all three locales.**
- The test itself runs end to end in Chinese. **Done.**
- `hreflang` pairs are reciprocal and every canonical is correct. **Done**,
  and verified by flipping `meta.complete` on and back off.
- Both locales switch without a page reload, and a finished result survives
  the switch. **Done.**
- An unfinished locale is reachable from the switcher and labelled as such,
  while staying out of the index. **Done.**
- The share card wraps Chinese text correctly. **Not started.**
- The social cards render in a CJK face. **Not started.**
- A human who reads each region's Chinese has read every string. **Not
  started, and it blocks `meta.complete` for all three.**
