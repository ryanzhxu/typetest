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

const INDEX = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const CODES = Object.keys(byCode).sort();

function headOf(html) {
  return html.split("<!-- BUILD:HEAD:START -->")[1].split("<!-- BUILD:HEAD:END -->")[0];
}

function pageFor(code) {
  return gen.buildPage(INDEX, code, byCode[code]);
}

test("the title names the type and its code, and never the indicator", () => {
  assert.strictEqual(gen.titleFor("INFJ", byCode.INFJ), "The Quiet Read (INFJ)");
  CODES.forEach((code) => {
    const title = gen.titleFor(code, byCode[code]);
    assert.ok(title.includes(code), code + " must appear in its own title");
    assert.ok(title.includes(byCode[code].name), code + " must name its type");
    assert.ok(!/myers|briggs|mbti/i.test(title), "the indicator reached a title: " + title);
  });
});

test("all sixteen titles are distinct, and so are all sixteen descriptions", () => {
  const titles = new Set(CODES.map((c) => gen.titleFor(c, byCode[c])));
  const descs = new Set(CODES.map((c) => gen.descriptionFor(c, byCode[c])));
  assert.strictEqual(titles.size, 16);
  assert.strictEqual(descs.size, 16);
});

test("descriptions open with the type's own line and stay inside sane length", () => {
  CODES.forEach((code) => {
    const d = gen.descriptionFor(code, byCode[code]);
    assert.ok(d.startsWith(byCode[code].line), code + " description must open with its line");
    assert.ok(d.includes(code), code + " description must carry the search term");
    assert.ok(d.length >= 90 && d.length <= 170, code + " description length was " + d.length);
  });
});

test("no generated page carries a percentage, a plus-minus, the word margin, or an em-dash", () => {
  CODES.forEach((code) => {
    const html = pageFor(code);
    assert.ok(!/\d+%/.test(html), code + " leaked a percentage");
    assert.ok(!html.includes("±"), code + " leaked a plus-minus");
    assert.ok(!/margin/i.test(html), code + " leaked the word margin");
    assert.ok(!html.includes("—"), code + " leaked an em-dash");
  });
});

test("each page's head is entirely its own type, with no trace of the other fifteen", () => {
  CODES.forEach((code) => {
    const head = headOf(pageFor(code));
    const title = gen.titleFor(code, byCode[code]);
    const desc = gen.descriptionFor(code, byCode[code]);
    const url = gen.ORIGIN + "/" + code.toLowerCase();

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
      assert.ok(!head.includes(other), code + " head mentions " + other);
      assert.ok(!head.includes(byCode[other].name), code + " head mentions " + byCode[other].name);
    });
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
    const html = pageFor(code);
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

test("asset paths are absolutised, because a page at /enfj cannot use relative ones", () => {
  const html = pageFor("ENFJ");
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
  const html = gen.buildPage(INDEX, "INFJ", nasty);
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
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /BUILD:HEAD/);
});

test("the generator refuses to work on an index.html that lost a fill target", () => {
  const broken = INDEX.replace(/<ul id="type-chips" class="chip-list"><\/ul>/, "<ul></ul>");
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /type-chips/);
});

test("the generator refuses to work on an index.html that lost a hidden target", () => {
  const broken = INDEX.replace(/<section id="view-intro"/, "<section id=\"view-intro-oops\"");
  assert.throws(() => gen.buildPage(broken, "INFJ", byCode.INFJ), /view-intro/);
});

test("the generator refuses an unknown type code", () => {
  assert.throws(() => gen.buildPage(INDEX, "XXXX", byCode.INFJ), /XXXX/);
});

test("the sitemap lists the root plus all sixteen, and nothing else", () => {
  const xml = gen.buildSitemap(CODES);
  const locs = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map((s) => s.slice(5, -6));
  const expected = [gen.ORIGIN + "/"].concat(CODES.map((c) => gen.ORIGIN + "/" + c.toLowerCase()));
  assert.strictEqual(locs.length, 17);
  assert.deepStrictEqual(locs.slice().sort(), expected.slice().sort());
  assert.strictEqual(new Set(locs).size, 17, "duplicate URL in the sitemap");
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(xml.trim().endsWith("</urlset>"));
});

/* Files, not directories. Cloudflare Pages serves enfj.html at /enfj with a
   200, but 308s /enfj to /enfj/ when enfj is a directory, which would make
   every canonical, sitemap entry and gallery href point at a redirect. */
test("build() writes sixteen type pages, a root page and a sitemap, and nothing else", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-build-"));
  try {
    gen.build(dir);
    const entries = fs.readdirSync(dir).sort();
    const expected = CODES.map((c) => c.toLowerCase() + ".html").concat(["index.html", "sitemap.xml"]).sort();
    assert.deepStrictEqual(entries, expected);
    CODES.forEach((code) => {
      const p = path.join(dir, code.toLowerCase() + ".html");
      assert.ok(fs.existsSync(p), "missing " + p);
      assert.ok(fs.statSync(p).isFile(), p + " must be a file, not a directory");
      assert.ok(fs.readFileSync(p, "utf8").includes('data-initial-type="' + code + '"'));
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* The whole point of the piece is that the sixteen pages get found. A sitemap
   is a hint; internal links are how a crawler actually reaches them. Assert
   the links exist in the HTML, before any JavaScript runs. */
function galleryHrefsOf(html) {
  return (html.match(/<a class="gallery-card" href="\/[a-z]{4}">/g) || [])
    .map((s) => s.slice(s.indexOf('href="/') + 7, -2));
}

test("every generated page, root included, links to all sixteen type pages", () => {
  const expected = CODES.map((c) => c.toLowerCase()).sort();
  const pages = CODES.map((c) => pageFor(c)).concat([gen.buildRoot(INDEX)]);
  pages.forEach((html, i) => {
    const label = i < CODES.length ? CODES[i] : "the root page";
    const hrefs = galleryHrefsOf(html);
    assert.strictEqual(hrefs.length, 16, label + " must carry sixteen gallery links, got " + hrefs.length);
    assert.strictEqual(new Set(hrefs).size, 16, label + " repeated a gallery link");
    assert.deepStrictEqual(hrefs.slice().sort(), expected, label + " linked the wrong set of codes");
  });
});

test("the root page is index.html plus the links, and nothing else", () => {
  const root = gen.buildRoot(INDEX);
  assert.ok(root.includes("<title>Personality</title>"), "the root keeps its own head");
  assert.ok(root.includes('<link rel="canonical" href="' + gen.ORIGIN + '/">'), "the root keeps its canonical");
  assert.ok(root.includes("<body>"), "the root body tag must stay bare");
  assert.ok(!root.includes("data-initial-type"), "the root is not a type page");
  assert.match(root, /<section id="view-type"[^>]*\shidden[^>]*>/, "the root opens on the intro");
  assert.ok(!/<section id="view-intro"[^>]*\shidden[^>]*>/.test(root), "the root must show the intro");
  /* file:// must keep working, so the root alone keeps relative asset paths. */
  assert.ok(root.includes('href="app.css"'), "the root keeps relative asset paths");
  assert.strictEqual((root.match(/src="js\//g) || []).length, 8);
});

test("no generated page advertises the repo's private paths", () => {
  CODES.map((c) => pageFor(c)).concat([gen.buildRoot(INDEX)]).forEach((html, i) => {
    const label = i < CODES.length ? CODES[i] : "the root page";
    assert.ok(!html.includes("scripts/build-types.js"), label + " named the generator");
    assert.ok(!html.includes("test/index-html.test.js"), label + " named a test file");
    /* The canonical explanation is for a real reader and stays. */
    assert.ok(html.includes("personality.pages.dev"), label + " lost the canonical explanation");
  });
});
