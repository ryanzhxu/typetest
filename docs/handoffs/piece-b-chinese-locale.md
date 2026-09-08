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

### The publish gate, `meta.complete`

One flag per locale file. While it is `false`:

- the pages are still generated and readable at their real addresses, which
  is how the copy gets reviewed,
- they carry `<meta name="robots" content="noindex, follow">`,
- they are absent from `sitemap.xml`,
- no `hreflang` set names them,
- and the language switcher does not offer them.

So today's deploy is byte-identical in behaviour for an English reader.
**Flipping that one flag publishes a locale.** `test/locales.test.js` refuses
to let it be `true` while any type prose or any item is still English.

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

| Content | Strings per locale | x3 |
|---|---|---|
| Interface, names, one-liners | **81, done** | done |
| Core items, 36 x 2 poles | 72 | 216 |
| Tiebreak items, 32 x 2 poles | 64 | 192 |
| Type opening, best, undone | 48 | 144 |
| Chips, 16 x 5 | 80 | 240 |
| **The five long sections, 16 x 5 x 3** | **240** | **720** |
| Celebrity names, 16 x 5 | 80 | 240, deferred |

**584 strings per locale, 1,752 in all, roughly 30,000 words.** This is a
multi-session writing job, not a one-sitting one. Wave 1 deliberately stopped
before it so the voice could be approved first.

Suggested order: items first (they are the product), then one type end to end
in all three locales, get that read, then the other fifteen.

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
- `/zh-hk/enfj` serves complete Chinese content in the raw HTML with no
  JavaScript run. **Chrome and names done; prose is wave 2.**
- `hreflang` pairs are reciprocal and every canonical is correct. **Done**,
  and verified by flipping `meta.complete` on and back off.
- Both locales switch without a page reload, and a finished result survives
  the switch. **Done.**
- The share card wraps Chinese text correctly. **Not started.**
- The social cards render in a CJK face. **Not started.**
- A human who reads each region's Chinese has read every string. **Not
  started, and it blocks `meta.complete` for all three.**
