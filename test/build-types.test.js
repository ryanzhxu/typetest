"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const gen = require("../scripts/build-types.js");
require("../js/ns.js");
require("../js/types.js");
const byCode = globalThis.SG.types.byCode;
const I18N = globalThis.SG.i18n;

const INDEX = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const CODES = Object.keys(byCode).sort();
const LOCALES = gen.LOCALES;

function headOf(html) {
  return html.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
}

function pageFor(code, locale) {
  return gen.buildPage(INDEX, code, locale || "en");
}

test("the title names the type and its code, and never the indicator", () => {
  assert.strictEqual(gen.titleFor("INFJ", "en"), "The Quiet Read (INFJ)");
  LOCALES.forEach((loc) => {
    CODES.forEach((code) => {
      const title = gen.titleFor(code, loc);
      assert.ok(title.includes(code), loc + " " + code + " must appear in its own title");
      assert.ok(title.includes(I18N.type(code, loc).name), loc + " " + code + " must name its type");
      assert.ok(!/myers|briggs|mbti/i.test(title), "the indicator reached a title: " + title);
    });
  });
});

test("in every locale, all sixteen titles are distinct and so are all sixteen descriptions", () => {
  LOCALES.forEach((loc) => {
    const titles = new Set(CODES.map((c) => gen.titleFor(c, loc)));
    const descs = new Set(CODES.map((c) => gen.descriptionFor(c, loc)));
    assert.strictEqual(titles.size, 16, loc + " repeated a title");
    assert.strictEqual(descs.size, 16, loc + " repeated a description");
  });
});

test("in every locale, the sixteen names are distinct from each other", () => {
  /* Two types sharing a name would give two pages the same title, and the
     head test below, which asserts no page's head mentions another type,
     could not tell the difference. */
  LOCALES.forEach((loc) => {
    const names = CODES.map((c) => I18N.type(c, loc).name);
    assert.strictEqual(new Set(names).size, 16, loc + " reused a type name");
  });
});

test("descriptions open with the type's own line and stay inside sane length", () => {
  CODES.forEach((code) => {
    const d = gen.descriptionFor(code, "en");
    assert.ok(d.startsWith(byCode[code].line), code + " description must open with its line");
    assert.ok(d.includes(code), code + " description must carry the search term");
    assert.ok(d.length >= 90 && d.length <= 170, code + " description length was " + d.length);
  });
});

test("no generated page carries a percentage, a plus-minus, the word margin, or an em-dash", () => {
  /* Chinese punctuation is full-width and needs no dash, so the em-dash rule
     holds in every locale. —— is a real Chinese punctuation mark and is
     deliberately still refused: the house style has no use for it. */
  LOCALES.forEach((loc) => {
    CODES.forEach((code) => {
      const html = pageFor(code, loc);
      const label = loc + " " + code;
      assert.ok(!/\d+%/.test(html), label + " leaked a percentage");
      assert.ok(!html.includes("±"), label + " leaked a plus-minus");
      assert.ok(!/margin/i.test(html), label + " leaked the word margin");
      assert.ok(!html.includes("—"), label + " leaked an em-dash");
    });
  });
});

test("each page's head is entirely its own type, with no trace of the other fifteen", () => {
  LOCALES.forEach((loc) => {
  CODES.forEach((code) => {
    const head = headOf(pageFor(code, loc));
    const title = gen.titleFor(code, loc);
    const desc = gen.descriptionFor(code, loc);
    const url = gen.ORIGIN + I18N.pathFor(loc, "/" + code.toLowerCase());

    assert.ok(head.includes("<title>" + title + "</title>"), code + " title");
    assert.ok(head.includes('<link rel="canonical" href="' + url + '">'), code + " canonical");
    assert.ok(head.includes('<meta property="og:url" content="' + url + '">'), code + " og:url");
    assert.ok(head.includes('<meta property="og:title" content="' + title + '">'), code + " og:title");
    assert.ok(head.includes('<meta name="twitter:title" content="' + title + '">'), code + " twitter:title");
    assert.ok(head.includes('content="' + desc + '"'), code + " description");
    assert.ok(head.includes('<meta name="twitter:card" content="summary_large_image">'), code + " twitter:card");

    /* The card is the page's own, rendered by scripts/build-og.js into the
       same staged directory, and absolute because a scraper resolves it
       against nothing. */
    const image = gen.ORIGIN + "/og/" + code.toLowerCase() + ".png";
    assert.ok(head.includes('<meta property="og:image" content="' + image + '">'), code + " og:image");
    assert.ok(head.includes('<meta name="twitter:image" content="' + image + '">'), code + " twitter:image");
    assert.ok(head.includes('<meta property="og:image:width" content="1200">'), code + " og:image:width");
    assert.ok(head.includes('<meta property="og:image:height" content="630">'), code + " og:image:height");

    CODES.filter((o) => o !== code).forEach((other) => {
      assert.ok(!head.includes(other), loc + " " + code + " head mentions " + other);
      const otherName = I18N.type(other, loc).name;
      assert.ok(!head.includes(otherName), loc + " " + code + " head mentions " + otherName);
    });
  });
  });
});

test("an unfinished locale is kept out of the index and out of every hreflang set", () => {
  /* A half-translated page in a search index is worse than no page at all,
     and an hreflang pointing at a noindex page is a contradiction Search
     Console reports as one. Both are driven by meta.complete in the locale
     file, so flipping that one flag is what publishes a locale. */
  LOCALES.forEach((loc) => {
    const head = headOf(pageFor("INFJ", loc));
    const indexed = gen.INDEXED.indexOf(loc) !== -1;
    assert.strictEqual(
      head.includes('<meta name="robots" content="noindex, follow">'), !indexed,
      loc + (indexed ? " must not be noindex" : " must be noindex until it is complete")
    );
  });
  gen.LOCALES.filter((loc) => gen.INDEXED.indexOf(loc) === -1).forEach((loc) => {
    LOCALES.forEach((from) => {
      const head = headOf(pageFor("INFJ", from));
      assert.ok(!head.includes('hreflang="' + I18N.HTML_LANG[loc] + '"'),
        from + " advertises the unfinished locale " + loc);
    });
  });
});

test("hreflang sets are reciprocal, and name a page's own locale too", () => {
  /* Skipped while only English is complete: with one indexed locale there is
     no alternate to declare and the tags are correctly absent. */
  if (gen.INDEXED.length < 2) { return; }
  gen.INDEXED.forEach((loc) => {
    const head = headOf(pageFor("INFJ", loc));
    gen.INDEXED.forEach((other) => {
      const href = gen.ORIGIN + I18N.pathFor(other, "/infj");
      assert.ok(
        head.includes('<link rel="alternate" hreflang="' + I18N.HTML_LANG[other] + '" href="' + href + '">'),
        loc + " does not point back at " + other
      );
    });
    assert.ok(head.includes('hreflang="x-default" href="' + gen.ORIGIN + '/infj">'),
      loc + " lost its x-default");
  });
});

test("every page declares its own language on the html element", () => {
  LOCALES.forEach((loc) => {
    const tag = '<html lang="' + I18N.HTML_LANG[loc] + '" data-lang="' + loc + '">';
    assert.ok(pageFor("INFJ", loc).includes(tag), loc + " type page lost " + tag);
    assert.ok(gen.buildRoot(INDEX, loc).includes(tag), loc + " root page lost " + tag);
  });
});

test("only a Chinese page asks for a CJK face, and it asks for its own region's", () => {
  /* Fraunces and Karla carry no CJK glyph, so without this a Chinese page
     falls through to whatever the system happens to have. Loading all three
     Noto families on an English page would be three requests for glyphs it
     will never draw. */
  const sub = { "zh-cn": "SC", "zh-tw": "TC", "zh-hk": "HK" };
  LOCALES.forEach((loc) => {
    const html = pageFor("INFJ", loc);
    const want = sub[loc];
    ["SC", "TC", "HK"].forEach((family) => {
      const asked = html.includes("Noto+Serif+" + family);
      assert.strictEqual(asked, family === want,
        loc + (family === want ? " must ask for Noto Serif " : " must not ask for Noto Serif ") + family);
    });
    if (!want) { assert.ok(!html.includes("Noto+Sans+"), "an English page asked for a CJK sans"); }
  });
});

test("no page is left with the generic homepage head", () => {
  CODES.forEach((code) => {
    const head = headOf(pageFor(code));
    assert.ok(!head.includes("<title>Personality</title>"), code + " kept the homepage title");
    assert.ok(
      !head.includes("A four-letter test that tells you which second type is living in your result."),
      code + " kept the homepage description"
    );
    assert.ok(!head.includes('href="' + gen.ORIGIN + '/">'), code + " kept the homepage canonical");
  });
});

test("each page opens on its own type view, never the intro", () => {
  CODES.forEach((code) => {
    const html = pageFor(code, "zh-hk");
    assert.ok(html.includes('<body data-initial-type="' + code + '">'), code + " body attribute");
    assert.match(html, new RegExp('<section id="view-intro"[^>]*\\shidden[^>]*>'), code + " intro must be hidden");
    assert.ok(
      !new RegExp('<section id="view-type"[^>]*\\shidden[^>]*>').test(html),
      code + " type view must not be hidden"
    );
    assert.ok(!new RegExp('<div id="type-test-cta"[^>]*\\shidden[^>]*>').test(html), code + " cta must show");
    assert.ok(!new RegExp('<button[^>]*id="btn-back-gallery"[^>]*\\shidden[^>]*>').test(html), code + " back link must show");
    assert.match(html, new RegExp('<div id="share-block"[^>]*\\shidden[^>]*>'), code + " share block must be hidden");
    assert.match(html, new RegExp('<button[^>]*id="btn-restart"[^>]*\\shidden[^>]*>'), code + " restart must be hidden");
  });
});

test("each page carries its own copy in the static HTML, readable with no JavaScript", () => {
  CODES.forEach((code) => {
    const t = byCode[code];
    const html = pageFor(code);
    assert.ok(html.includes(">" + code + "</p>"), code + " code text");
    assert.ok(html.includes(">" + t.name + "</h2>"), code + " name text");
    assert.ok(html.includes(t.opening), code + " opening paragraph");
    assert.ok(html.includes("You are at your best " + t.best), code + " best paragraph");
    assert.ok(html.includes("You come undone " + t.undone), code + " undone paragraph");
    t.chips.forEach((chip) => assert.ok(html.includes("<li>" + chip + "</li>"), code + " chip " + chip));
    t.often.forEach((name) => assert.ok(html.includes("<li>" + name + "</li>"), code + " name " + name));
  });
});

test("a Chinese page carries its Chinese chrome and its Chinese name in the raw HTML", () => {
  /* The whole reason the generator exists is that a crawler, and a reader
     with no JavaScript, sees the copy. That has to hold in every locale, not
     only the one the source file happens to be written in. */
  ["zh-cn", "zh-tw", "zh-hk"].forEach((loc) => {
    const html = pageFor("ISFJ", loc);
    const t = I18N.type("ISFJ", loc);
    assert.ok(html.includes(">" + t.name + "</h2>"), loc + " lost its type name");
    assert.ok(html.includes(">" + I18N.t("type.oftenLabel", loc) + "<"), loc + " lost the celebrity label");
    assert.ok(html.includes(">" + I18N.t("intro.start", loc) + "<"), loc + " lost the start button");
    assert.ok(html.includes(I18N.t("type.asterisk", loc)), loc + " lost the asterisk paragraph");
    assert.ok(html.includes('aria-label="' + I18N.t("question.scaleLabel", loc) + '"'),
      loc + " lost the translated radiogroup label");
    I18N.sections(loc).forEach((section) => {
      assert.ok(html.includes("<h3>" + section.heading + "</h3>"), loc + " lost the heading " + section.heading);
    });
  });
});

test("the static translator refuses an element that holds markup", () => {
  /* Every translated element on this site holds text and nothing else, which
     is why index.html wraps the asterisk paragraph's translated half in its
     own span. Swallowing a nested tag would leave a page that still looked
     plausible. */
  const broken = INDEX.replace(
    '<p class="eyebrow" data-i18n="intro.eyebrow">A four-letter personality test</p>',
    '<p class="eyebrow" data-i18n="intro.eyebrow">A <b>four-letter</b> personality test</p>'
  );
  assert.throws(() => gen.translateStatic(broken, "zh-hk"), /data-i18n/);
});

test("asset paths are absolutised, because a page at /enfj cannot use relative ones", () => {
  const html = pageFor("ENFJ", "zh-hk");
  assert.ok(html.includes('href="/app.css"'));
  assert.ok(html.includes('src="/js/ns.js"'));
  assert.ok(html.includes('src="/js/app.js"'));
  assert.ok(!html.includes('href="app.css"'));
  assert.ok(!/src="js\//.test(html));
});

test("attribute and text values are escaped", () => {
  const nasty = {
    name: 'A & B "C" <D>',
    line: "Ampersand & angle < bracket.",
    opening: "Opening & <thing>.",
    best: "best & <thing>.",
    undone: "undone & <thing>.",
    chips: ["a & b", "c < d", "e > f", "g", "h"],
    often: ['X "Y"', "Z & W", "a", "b", "c"],
    good: ["good & <one>.", "two.", "three."],
    snags: ["snags & <one>.", "two.", "three."],
    closeUp: ["closeUp & <one>.", "two.", "three."],
    work: ["work & <one>.", "two.", "three."],
    oneThing: ["oneThing & <one>.", "two.", "three."]
  };
  /* The prose lives in js/types.js and the name and line live in the locale
     dictionary, so hostile copy has to be planted in both to walk every
     escaping path. Restored in the finally, or every test after this one
     would read the nasty type. */
  const baseWas = byCode.INFJ;
  const overWas = I18N.dict("en").types.INFJ;
  let html;
  try {
    byCode.INFJ = nasty;
    I18N.dict("en").types.INFJ = { name: nasty.name, line: nasty.line };
    html = gen.buildPage(INDEX, "INFJ", "en");
  } finally {
    byCode.INFJ = baseWas;
    I18N.dict("en").types.INFJ = overWas;
  }
  const head = html.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
  assert.ok(
    head.includes(String.raw`content="A &amp; B &quot;C&quot; &lt;D&gt; (INFJ)"`),
    "og:title and twitter:title must be fully escaped inside their attributes"
  );
  assert.ok(head.includes("Ampersand &amp; angle &lt; bracket."), "the description must be escaped");
  assert.ok(html.includes("<li>a &amp; b</li>"), "chip text must escape ampersands");
  assert.ok(html.includes("<li>c &lt; d</li>"), "chip text must escape angle brackets");
  assert.ok(!html.includes("<D>"), "a raw tag was injected from type copy");

  /* The five long sections are the bulk of the copy on a page now, so they
     are the likeliest place for an unescaped character to reach the HTML. */
  ["good", "snags", "closeUp", "work", "oneThing"].forEach((key) => {
    assert.ok(
      html.includes('<p class="type-paragraph">' + key + " &amp; &lt;one&gt;.</p>"),
      key + " paragraphs must be escaped"
    );
  });
  assert.ok(!html.includes("<one>"), "a raw tag was injected from section copy");
});

test("the generator refuses to work on an index.html that lost a marker", () => {
  const broken = INDEX.replace("<!-- BUILD:HEAD:START -->", "");
  assert.throws(() => gen.buildPage(broken, "INFJ", "en"), /BUILD:HEAD/);
});

test("the generator refuses to work on an index.html that lost a fill target", () => {
  const broken = INDEX.replace(/<ul id="type-chips" class="chip-list"><\/ul>/, "<ul></ul>");
  assert.throws(() => gen.buildPage(broken, "INFJ", "en"), /type-chips/);
});

test("the generator refuses to work on an index.html that lost a hidden target", () => {
  const broken = INDEX.replace(/<section id="view-intro"/, "<section id=\"view-intro-oops\"");
  assert.throws(() => gen.buildPage(broken, "INFJ", "en"), /view-intro/);
});

test("the generator refuses an unknown type code", () => {
  assert.throws(() => gen.buildPage(INDEX, "XXXX", "en"), /XXXX/);
});

test("the sitemap lists every indexed locale's root plus its sixteen, and nothing else", () => {
  const xml = gen.buildSitemap(CODES);
  const locs = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map((s) => s.slice(5, -6));
  const expected = [];
  gen.INDEXED.forEach((loc) => {
    expected.push(gen.ORIGIN + I18N.pathFor(loc, "/"));
    CODES.forEach((c) => expected.push(gen.ORIGIN + I18N.pathFor(loc, "/" + c.toLowerCase())));
  });
  assert.strictEqual(locs.length, 17 * gen.INDEXED.length);
  assert.deepStrictEqual(locs.slice().sort(), expected.slice().sort());
  assert.strictEqual(new Set(locs).size, locs.length, "duplicate URL in the sitemap");
  /* A noindex page in the sitemap asks a search engine to fetch something it
     has been told to ignore. */
  gen.LOCALES.filter((l) => gen.INDEXED.indexOf(l) === -1).forEach((loc) => {
    assert.ok(!xml.includes("/" + loc + "/"), "the sitemap lists the unfinished locale " + loc);
  });
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(xml.trim().endsWith("</urlset>"));
});

/* Files, not directories. Cloudflare Pages serves enfj.html at /enfj with a
   200, but 308s /enfj to /enfj/ when enfj is a directory, which would make
   every canonical, sitemap entry and gallery href point at a redirect. */
test("build() writes sixteen type pages and a root per locale, one sitemap, and nothing else", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-build-"));
  try {
    gen.build(dir);
    const pages = CODES.map((c) => c.toLowerCase() + ".html").concat(["index.html"]).sort();
    const others = LOCALES.filter((l) => l !== "en");
    assert.deepStrictEqual(fs.readdirSync(dir).sort(),
      pages.concat(others).concat(["sitemap.xml"]).sort());

    LOCALES.forEach((loc) => {
      const at = loc === "en" ? dir : path.join(dir, loc);
      assert.deepStrictEqual(fs.readdirSync(at).sort().filter((n) => n.endsWith(".html")), pages,
        loc + " is missing pages");
      CODES.forEach((code) => {
        const p = path.join(at, code.toLowerCase() + ".html");
        assert.ok(fs.statSync(p).isFile(), p + " must be a file, not a directory");
        assert.ok(fs.readFileSync(p, "utf8").includes('data-initial-type="' + code + '"'));
      });
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* The whole point of the piece is that the sixteen pages get found. A sitemap
   is a hint; internal links are how a crawler actually reaches them. Assert
   the links exist in the HTML, before any JavaScript runs. */
function galleryHrefsOf(html) {
  return (html.match(/<a class="gallery-card" href="([^"]+)">/g) || [])
    .map((s) => s.slice(s.indexOf('href="') + 6, -2));
}

test("every generated page, root included, links to all sixteen type pages in its own locale", () => {
  /* A Chinese card pointing at the English page would drop the reader out of
     their language on a plain click, and would hand a crawler the English
     page as the Chinese page's only outbound link. */
  LOCALES.forEach((loc) => {
    const expected = CODES.map((c) => I18N.pathFor(loc, "/" + c.toLowerCase())).sort();
    const pages = CODES.map((c) => pageFor(c, loc)).concat([gen.buildRoot(INDEX, loc)]);
    pages.forEach((html, i) => {
      const label = loc + " " + (i < CODES.length ? CODES[i] : "root");
      const hrefs = galleryHrefsOf(html);
      assert.strictEqual(hrefs.length, 16, label + " must carry sixteen gallery links, got " + hrefs.length);
      assert.strictEqual(new Set(hrefs).size, 16, label + " repeated a gallery link");
      assert.deepStrictEqual(hrefs.slice().sort(), expected, label + " linked the wrong set");
    });
  });
});

test("the root page is index.html plus the links, and nothing else", () => {
  const root = gen.buildRoot(INDEX, "en");
  assert.ok(root.includes("<title>Personality</title>"), "the root keeps its own head");
  assert.ok(root.includes('<link rel="canonical" href="' + gen.ORIGIN + '/">'), "the root keeps its canonical");
  assert.ok(root.includes("<body>"), "the root body tag must stay bare");
  assert.ok(!root.includes("data-initial-type"), "the root is not a type page");
  assert.match(root, /<section id="view-type"[^>]*\shidden[^>]*>/, "the root opens on the intro");
  assert.ok(!/<section id="view-intro"[^>]*\shidden[^>]*>/.test(root), "the root must show the intro");
  /* file:// must keep working, so the root alone keeps relative asset paths. */
  assert.ok(root.includes('href="app.css"'), "the root keeps relative asset paths");
  assert.strictEqual((root.match(/src="js\//g) || []).length, 13);
});

test("a Chinese root cannot keep relative asset paths, because it is one level deep", () => {
  const root = gen.buildRoot(INDEX, "zh-hk");
  assert.ok(root.includes('href="/app.css"'), "/zh-hk/ would resolve app.css to /zh-hk/app.css");
  assert.ok(!/src="js\//.test(root), "/zh-hk/ would resolve js/ to /zh-hk/js/");
  assert.ok(root.includes('<link rel="canonical" href="' + gen.ORIGIN + '/zh-hk/">'),
    "a locale root is a directory, so its canonical carries the trailing slash");
});

test("no generated page advertises the repo's private paths", () => {
  CODES.map((c) => pageFor(c)).concat([gen.buildRoot(INDEX, "en")]).forEach((html, i) => {
    const label = i < CODES.length ? CODES[i] : "the root page";
    assert.ok(!html.includes("scripts/build-types.js"), label + " named the generator");
    assert.ok(!html.includes("test/index-html.test.js"), label + " named a test file");
    /* The canonical explanation is for a real reader and stays. */
    assert.ok(html.includes("personality.pages.dev"), label + " lost the canonical explanation");
  });
});
