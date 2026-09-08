# Spec: the mobile question view

Written 2026-09-07. Implements six reports from a real iPhone 13 Pro session.

## 1. What was reported

1. Not mobile friendly. The circles sit outside the border.
2. The questionnaire should be at the centre of the phone.
3. Clicking a circle should not advance. The reader cannot see what they chose.
4. Add light and dark mode.
5. On a phone the statements read top to bottom while the dots read left to
   right. The two directions disagree.
6. Replace the two-statement format with something simpler, closer to
   16personalities: one thing to answer, with intensity.

## 2. What was measured, not assumed

Playwright, `file://index.html`, three viewports, all five views.

```
iPhone 13 Pro 390px   card right edge @358   dot row right edge @372   escapes by 14px
iPhone SE     375px   card right edge @343   dot row right edge @372   escapes by 29px
iPhone SE     320px   whole page overflows the viewport by 52px
```

The question view is the only broken view. Intro, reveal, type and the sixteen
gallery measured clean at 320, 375 and 390px.

The question card sits at y=80 and is 398px tall inside an 844px viewport, so
366px of empty space sits below it. That is report 2.

**Cause.** Each dot carries `min-width: 44px` with the default `flex-shrink`,
so `.dot-row` is a rigid 308px. The card content box is 262px at 390px. The row
cannot shrink, so it and the `.scale` grid around it burst the card.

## 3. Decisions

### 3.1 One statement, seven points, balanced keying

Report 6 is accepted. Each item shows one pole, not two. The seven dots run
from **Agree** on the left to **Disagree** on the right.

**The bias this creates, and the fix.** Every one of the 68 items in
`js/items.js` is keyed the same direction: `a` is always the first pole letter
and `b` always the second. Item 1 is `a` = E, `b` = I. The TF items are `a` = T,
`b` = F. Every one. A naive port that always shows `a` would make agreement mean
E, S, T and J on all 36 core items, and an agreeable reader would come out ESTJ
regardless of who they are.

The fix is balanced keying: show `a` on about half the items and `b` on the
rest, then invert the recorded value for the flipped ones. Agreement then means
E on some items and I on others, so acquiescence cancels in the axis mean.

This costs no new content, because both poles are already written for every
item.

**Accuracy note, recorded honestly.** Paired poles were the more accurate
instrument, because neither end was the "yes". Balanced keying cancels
acquiescence in the mean but not within a single item, so individual answers are
noisier than before. This was put to the owner with that trade stated, and the
simpler screen was chosen deliberately.

### 3.2 Where the inversion lives

**In `js/render.js`, at the view boundary. Not in `js/flow.js` or
`js/score.js`.**

`js/flow.js` and `js/score.js` keep speaking pole space, where 1 means the first
pole and 7 means the second, exactly as today. The renderer converts on the way
in and on the way out:

```
screen value -> pole value    before flow.answer()
pole value   -> screen value  after  flow.back()
```

Both conversions are `8 - value` when the item is flipped, and identity when it
is not. The renderer already has to know which pole to print, so it is the only
layer that needs to know about flipping at all.

This keeps the scoring maths and all 260 lines of `test/flow.test.js` untouched.

### 3.3 Which items flip

Alternate by position within each axis block, starting at `a`. Nine core items
per axis gives five showing `a` and four showing `b`. Eight tiebreak items gives
four and four.

Override the alternation where one pole is markedly weaker on its own. Some
poles were written to lean on their partner and do not stand up alone:
`"I press buttons."`, `"I would attend, briefly."`, `"I see what we feel like."`
and `"I tidy instead of working, later."` all read as fragments without the
statement they answer. Where an override is taken, take a matching override in
the other direction inside the same axis, so every axis stays within one of an
even split. A test enforces the balance.

### 3.4 The dot row

Each dot becomes `flex: 1 1 0` with `min-width: 0`, so the seven share whatever
width exists and the row can never exceed its container at any viewport. On
narrow screens the row runs full bleed inside the card, using the card width
rather than its padded content box.

| Viewport | Row width | Target per dot |
|---|---|---|
| 390px | 358px | 51px |
| 375px | 343px | 49px |
| 320px | 288px | 41px |

Targets grow on every phone from 375px up. At 320px the target falls to 41px,
below the 44px guideline. That is accepted: the device is a 2016 model and the
alternative there is a page that overflows.

Report 5 resolves itself. One statement above a horizontal row means both
directions agree.

### 3.5 Vertical centring

`#view-question` takes a minimum height of the dynamic viewport less the header,
and the card takes `margin: auto`.

**Auto margins, never `justify-content: center`.** When the card is taller than
the screen, auto margins collapse and the top stays reachable. Centring clips
it. Use `dvh` rather than `vh` so the iOS address bar does not shift the card as
it hides.

The question view only. The type pages and the gallery are long and must keep
starting at the top.

### 3.6 The seven feedback strings

```
Strongly agree / Agree / Slightly agree /
Somewhere in between /
Slightly disagree / Disagree / Strongly disagree
```

**The middle must not read "Neither".** `js/render.js` documents why: the middle
counts as a real answer and narrows the confidence band, while the skip button
beside it counts as missing and widens it by `SKIP_PENALTY`, which is 3. Two
adjacent controls that do opposite things must not read alike. "Somewhere in
between" is a position. "This one does not apply" is a refusal.

### 3.7 Light and dark

Report 4 asked for light and dark mode. The site already has both:
`app.css:30` follows the operating system setting, and `app.css:43` honours an
explicit `data-theme`. What is missing is a control.

**Decided by the owner: no control, and no storage.** A toggle that remembers
means writing to `localStorage`, and the intro promises "No account. Nothing
saved. Nothing sent anywhere." That promise is worth more than the control.

Report 4 therefore becomes a contrast audit: every token pair checked against
WCAG AA in both themes, which spec §6 of the master design requires and which
nobody has verified.

### 3.8 Report 3 is already done

`js/render.js` in the working tree no longer advances on click, and
`index.html` carries a Next button. It is uncommitted, not deployed. It ships
with this work rather than being rebuilt.

## 4. Out of scope

- The other four views. They measured clean and are not touched.
- The 36 item length, unchanged.
- Any storage of any kind. See §3.7.

## 5. Amendment to the master spec

`docs/superpowers/specs/2026-09-06-personality-design.md` §4 reads
"Seven-point slider between two statements." That is no longer true. It gets an
amendment in place, in the same style as the 2026-09-07 amendment already in
that file, rather than being silently contradicted.

## 6. Acceptance

- No element escapes the viewport or its parent, across all five views, at 320,
  375 and 390px. Enforced by a test, not by inspection.
- Every axis is within one of an even split between `a` shown and `b` shown.
- A flipped item records the inverted value, and Back restores the dot the
  reader actually pressed.
- Every token pair passes WCAG AA in both themes.
- No contractions, no dashes, British spelling in all new copy.
- `npm test` green.
