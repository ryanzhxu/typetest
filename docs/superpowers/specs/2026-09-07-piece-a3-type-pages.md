# Piece A3 — Per-type pages

**Status:** shipped 2026-09-07.
**Date:** 2026-09-07
**Parent spec:** `docs/superpowers/specs/2026-09-06-personality-design.md`
**Live today:** https://personality.ryanxu.dev

---

## 1. The gap

Parent spec §5.4 says:

> This is the second product: most arrivals will never take the test, having
> searched for what their letters mean or to look someone up. **Sixteen good
> pages beats one good quiz for traffic.**

There are not sixteen pages. There is one page with sixteen JS-toggled views.
Verified on the live site: `/enfj`, `/types/enfj`, `/?type=ENFJ` and `/#ENFJ`
all serve the identical front page, and `grep -niE "pushState|hashchange|
location"` over `js/` returns nothing. There is no routing of any kind.

Consequences, in order of cost:

1. **Google indexes one URL.** Nobody searching "ENFJ meaning" can reach this
   content. That is the entire §5.4 thesis, unimplemented.
2. **Results are not shareable.** Someone finishes, gets The Quiet Read, and has
   nothing to send but the front door. The share card exists so results travel;
   the link it travels with says nothing about the result.
3. **Social unfurls are wrong.** The `og:` tags added on 2026-09-07 describe the
   homepage on every share, whatever the person got.
4. **Soft 404s.** Every unknown path returns HTTP 200 serving `index.html`.
   `/totally-made-up-path` and `/a/b/c` both return 200. Google treats that as
   duplicate content.

### Why no review caught it

The plan never specified routing, so no task built it, and every per-task review
correctly passed work measured against the plan. The whole-branch reviewer read
the spec, but §5.4 describes a product outcome rather than a testable
requirement, and §12's success criteria never mentioned URLs.

Same failure shape as the celebrity-name count: the plan silently dropped
something the spec asked for.

---

## 2. Decisions

### 2.1 URL scheme

    /                English landing and test
    /enfj            English ENFJ page
    /zh-cn/enfj      later, piece B
    /zh-hk/enfj
    /zh-tw/enfj

Lowercase, no prefix, no `/types/` segment. English at the root with locales as
path prefixes matches the `personal-site` precedent (`src/app/zh-cn`,
`src/app/zh-hk`).

**Decide this now even though piece B is later.** URLs are the one thing that
gets expensive after people link to them.

### 2.2 Pre-rendered, not client-routed

Each type URL must return HTML carrying its own `<title>`, `<meta
description>`, `<link rel="canonical">` and `og:`/`twitter:` tags **in the
initial response**. Social crawlers do not run JavaScript, so client-side
routing cannot produce a correct unfurl, and it is unreliable for Google.

### 2.3 This requires a deploy-time generator, which amends the parent spec

Parent spec §10 says "No build step." That constraint was justified as: the app
must be openable by double-clicking `index.html`, verifiable without a
toolchain.

**A deploy-time generator does not violate that intent.** `index.html` still
opens standalone and still runs the whole test. The sixteen generated files are
additive, produced during the existing "Stage only the public site" workflow
step. Local development is unchanged.

Amend §10 to: *no dev-time build; a deploy-time generator is permitted, and
`index.html` must remain openable from the filesystem.*

Hand-writing sixteen files is rejected: it is sixteen copies to keep in sync
now and sixty-four after piece B.

### 2.4 Generator approach: one template, injected head

`scripts/build-types.js` reads `index.html`, and for each of the sixteen codes
emits `public/<code>/index.html` with:

- the head meta block replaced for that type
- `<body data-initial-type="ENFJ">`

`js/render.js` reads `data-initial-type` on mount and opens the type view
directly instead of the intro.

One codebase, sixteen entry points, correct meta on each. No template language,
no dependency, roughly 60 lines.

### 2.5 The result gets a URL

On reaching the type view, `history.replaceState(null, "", "/" + code.toLowerCase())`.

Someone who finishes lands on `/infj`, which is a page worth sending. Use
`replaceState` rather than `pushState` so Back does not walk them through the
reveal again.

### 2.6 Real 404s

Add `public/404.html` and set the Pages project's `not_found_handling` so
unknown paths return a genuine 404 rather than 200 with the homepage.

---

## 3. Task breakdown

**A3.1 — Generator and its tests.** `scripts/build-types.js`, plus
`test/build-types.test.js` asserting sixteen files emitted, each with the right
title, a canonical matching its own URL, and no cross-contamination between
types. Must fail if a type is missing or a meta tag is left generic.

**A3.2 — Per-type head content.** Title, description, canonical, `og:`,
`twitter:`. Title format decided here: `The Quiet Read (INFJ)` rather than
`INFJ` alone, since the name is the distinctive half and the code is the search
term. Description from the type's `line`. **The indicator is never named in any
of these** — parent spec §3, which binds `og:title` specifically.

**A3.3 — Deep-link resolution.** `render.js` reads `data-initial-type` and opens
the type view. Landing on `/enfj` must show ENFJ immediately, with no flash of
the intro screen, and the "take the test" path must still work from there.

**A3.4 — Result URL.** `replaceState` on reaching the type view.

**A3.5 — Sitemap, robots, 404.** `sitemap.xml` listing all seventeen URLs,
`robots.txt` pointing at it, `404.html`, and the Pages `not_found_handling`
setting.

**A3.6 — Workflow and smoke coverage.** Generator runs in the staging step.
Extend `test/smoke.test.js`: `/enfj` serves ENFJ content with the right title,
a garbage path 404s, and finishing the test leaves the URL at `/<code>`.

---

## 4. Constraints carried from the parent spec

All still bind. Listing the ones this piece is most likely to trip:

- The indicator is never named in a page title, `og:title`, filename or domain.
  Sixteen new titles and sixteen new `og:title` values is sixteen new chances to
  get this wrong.
- No percentages, no `±`, never the word "margin" in user-visible text.
- No em-dashes in shipped copy.
- Zero runtime dependencies. The generator is a deploy-time Node script and
  ships nothing.
- Every page keeps the non-affiliation line.

---

## 5. Open questions for the implementer

1. **Gallery links.** Should `#view-sixteen` cards become real `<a href="/enfj">`
   anchors rather than buttons? Better for crawlers and for middle-click. Likely
   yes, but it changes `render.js`'s event handling.
2. **Does `/enfj` show the gallery and the test entry, or only the type?** A page
   that is purely the type reads better for search. A page that also offers the
   test converts better. Recommend: type content first, test call-to-action
   below it.
3. **`og:image`.** Deliberately omitted on 2026-09-07 because doing it properly
   means a real 1200x630 card, and `js/share.js` already knows how to draw one.
   Per-type images would be the strongest possible unfurl. Probably its own
   piece rather than part of A3.

### Rulings, made 2026-09-07

1. **Gallery links: yes, real anchors.** Plain left clicks are intercepted and
   rendered in place, so a finished result and its share card survive browsing.
   Modified clicks navigate for real. The generator also writes the sixteen
   anchors into the static HTML of every page including the root, so the link
   graph exists without JavaScript, which was the point of the question.
2. **Type page scope: type content first, test call to action below it.** Shown
   on any read-only type page, hidden on your own result, where "Start over" and
   the share block already occupy that slot.
3. **`og:image`: out of A3, its own piece.** Sixteen rendered cards need
   `js/share.js` running under a headless browser in CI and their own
   verification against the unfurl validators. That roughly doubles the piece,
   and images are worthless without the URLs.

### Amendment to §2.4, made 2026-09-07

The generator also fills each type's body copy into the static HTML and flips
the view `hidden` attributes, rather than leaving that to JavaScript. Scripts
are `defer`, so the browser can paint the intro before any JavaScript runs, and
§6's "no flash of the intro" cannot be guaranteed otherwise. A page whose entire
content requires a renderer is also a bet, and the thesis here is search traffic.

### Amendment to §2.1, made 2026-09-07 after measuring the live site

The generator emits `<code>.html`, not `<code>/index.html`. Cloudflare Pages
serves `<name>.html` at the extensionless path with a plain 200, but appends a
trailing slash to the directory form: the first deploy of A3 answered `/enfj`
with a 308 to `/enfj/`, which pointed all sixteen canonicals, all seventeen
sitemap entries and all sixteen anchors at a redirect. The URL scheme in §2.1 is
unchanged. Only the output filename differs. No local test could see this, since
a static server happily answers both forms.

---

## 6. Success criteria

- `/enfj` returns 200 with `<title>` naming ENFJ's type and a canonical pointing
  at itself.
- Sixteen distinct titles, sixteen distinct canonicals, no duplicates.
- A garbage path returns 404, not 200.
- Finishing the test leaves the address bar at `/<code>`.
- `sitemap.xml` lists seventeen URLs and validates.
- The indicator appears in no title or `og:` tag on any of the sixteen pages.
- `npm test` green, smoke tests still running in CI, not skipping.
