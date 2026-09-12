"use strict";
/* Deploy-time only. Reads index.html and emits one page per type per locale,
   each with its own head meta and its own copy already in the HTML. Nothing
   here ships to the browser.

   Every helper below throws rather than guessing. A generator that quietly
   emits sixteen pages with the homepage's title is worse than one that fails
   the build, because nothing downstream would notice. */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://personality.ryanxu.dev";

require(path.join(ROOT, "js", "ns.js"));
require(path.join(ROOT, "js", "i18n.js"));
require(path.join(ROOT, "js", "locale-en.js"));
require(path.join(ROOT, "js", "locale-zh-cn.js"));
require(path.join(ROOT, "js", "locale-zh-tw.js"));
require(path.join(ROOT, "js", "locale-zh-hk.js"));
require(path.join(ROOT, "js", "types.js"));

const BY_CODE = globalThis.SG.types.byCode;
const I18N = globalThis.SG.i18n;
const LOCALES = I18N.SUPPORTED;

/* Only complete locales are offered to a search engine. The rest are still
   generated, so they can be read and reviewed at their real addresses, but
   they carry noindex, they are absent from sitemap.xml, and no hreflang set
   points at them. A half-translated page in the index is worse than no page
   at all, and it is the flip of one flag in a locale file to let one in. */
const INDEXED = I18N.completed();

/* Fraunces and Karla have no CJK glyph at all, so a Chinese page asks for the
   Noto serif and sans of its own region as well. Google Fonts subsets these
   by unicode-range on its own, which is why this needs no pyftsubset pass and
   no new build dependency. app.css binds whichever arrived to the same two
   font tokens the English pages use. */
const CJK_SUBFAMILY = { "zh-cn": "SC", "zh-tw": "TC", "zh-hk": "HK" };

function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeText(s).replace(/"/g, "&quot;");
}

/* Replace with a function, never a string: a "$&" or "$1" inside type copy
   would otherwise be read as a replacement pattern. */
function replaceOnce(html, re, make, what) {
  const hits = html.match(new RegExp(re.source, re.flags.replace("g", "") + "g")) || [];
  if (hits.length !== 1) {
    throw new Error(
      "build-types: expected exactly one " + what + " in index.html, found " + hits.length +
      ". The page contract in test/index-html.test.js is broken."
    );
  }
  return html.replace(re, make);
}

function fillById(html, id, inner) {
  const re = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)></\\1>');
  return replaceOnce(html, re, (m, tag, attrs) => "<" + tag + attrs + ">" + inner + "</" + tag + ">",
    'empty element with id="' + id + '"');
}

function setHidden(html, id, hidden) {
  const re = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)>');
  return replaceOnce(html, re, (m, tag, attrs) => {
    const bare = attrs.replace(/\s+hidden(?=\s|$)/, "");
    return "<" + tag + bare + (hidden ? " hidden" : "") + ">";
  }, 'element with id="' + id + '"');
}

/* ---- the static translator ---- */

/* js/i18n.js rewrites [data-i18n] through the DOM. There is no DOM here and
   the project takes no build dependency to get one, so the same two
   attributes are honoured against the text.

   Every data-i18n element on this site holds text and nothing else, which is
   why index.html wraps the asterisk paragraph's translated half in its own
   span. That is a real constraint, so it throws rather than silently
   swallowing markup: a nested tag inside a translated element would be
   discarded, and the page would still look plausible. */
function translateStatic(html, locale) {
  let count = 0;
  let out = html.replace(
    /<([a-z0-9]+)([^>]*\sdata-i18n="([^"]+)"[^>]*)>([^<]*)<\/\1>/g,
    (whole, tag, attrs, key, inner) => {
      count += 1;
      return "<" + tag + attrs + ">" + escapeText(I18N.t(key, locale)) + "</" + tag + ">";
    }
  );
  const marked = (html.match(/\sdata-i18n="/g) || []).length;
  if (count !== marked) {
    throw new Error(
      "build-types: " + marked + " elements carry data-i18n but only " + count +
      " could be rewritten. A translated element must hold text and no markup."
    );
  }

  /* data-i18n-attr="aria-label:question.scaleLabel,title:x.y" */
  out = out.replace(/<([a-z0-9]+)([^>]*\sdata-i18n-attr="([^"]+)"[^>]*)>/g,
    (whole, tag, attrs, spec) => {
      let next = attrs;
      spec.split(",").forEach((pair) => {
        const at = pair.indexOf(":");
        const name = pair.slice(0, at).trim();
        const value = escapeAttr(I18N.t(pair.slice(at + 1).trim(), locale));
        const re = new RegExp('\\s' + name.replace(/-/g, "\\-") + '="[^"]*"');
        if (!re.test(next)) {
          throw new Error("build-types: data-i18n-attr names " + name + ", which the element does not have");
        }
        next = next.replace(re, ' ' + name + '="' + value + '"');
      });
      return "<" + tag + next + ">";
    });
  return out;
}

/* ---- head ---- */

function titleFor(code, locale) {
  const t = I18N.type(code, locale);
  return I18N.format("seo.title", { name: t.name, code: code }, locale);
}

function descriptionFor(code, locale) {
  const t = I18N.type(code, locale);
  return I18N.format("seo.description", { line: t.line, code: code }, locale);
}

/* rest is the locale-free path: "/" for a root page, "/enfj" for a type. */
function urlFor(locale, rest) {
  return ORIGIN + I18N.pathFor(locale, rest);
}

/* Reciprocal by construction: every indexed locale's page lists the same set,
   so there is no direction in which the pairs can disagree. x-default points
   at English, which is the locale a reader with no matching preference gets.

   An unindexed locale is left out entirely rather than listed and marked: an
   hreflang pointing at a noindex page is a contradiction, and Search Console
   reports it as one. */
function alternates(rest) {
  if (INDEXED.length < 2) { return []; }
  return INDEXED.map((loc) =>
    '  <link rel="alternate" hreflang="' + I18N.HTML_LANG[loc] + '" href="' +
      urlFor(loc, rest) + '">'
  ).concat([
    '  <link rel="alternate" hreflang="x-default" href="' + urlFor(I18N.DEFAULT, rest) + '">'
  ]);
}

function robotsLine(locale) {
  return INDEXED.indexOf(locale) === -1
    ? ['  <meta name="robots" content="noindex, follow">']
    : [];
}

function headBlock(locale, rest, title, desc, image) {
  const url = urlFor(locale, rest);
  return robotsLine(locale).concat([
    "  <title>" + escapeText(title) + "</title>",
    '  <meta name="description" content="' + escapeAttr(desc) + '">',
    '  <link rel="canonical" href="' + url + '">'
  ]).concat(alternates(rest)).concat([
    '  <meta property="og:type" content="website">',
    '  <meta property="og:url" content="' + url + '">',
    '  <meta property="og:site_name" content="' + escapeAttr(I18N.t("brand", locale)) + '">',
    '  <meta property="og:locale" content="' + I18N.HTML_LANG[locale].replace(/-/g, "_") + '">',
    '  <meta property="og:title" content="' + escapeAttr(title) + '">',
    '  <meta property="og:description" content="' + escapeAttr(desc) + '">',
    '  <meta property="og:image" content="' + image + '">',
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    '  <meta property="og:image:alt" content="' + escapeAttr(title) + '">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '  <meta name="twitter:title" content="' + escapeAttr(title) + '">',
    '  <meta name="twitter:description" content="' + escapeAttr(desc) + '">',
    '  <meta name="twitter:image" content="' + image + '">'
  ]).join("\n");
}

/* Rendered by scripts/build-og.js into the same staged directory. Absolute,
   because a scraper resolves this against nothing. One card per type, shared
   by every locale: the cards are drawn in Fraunces and Karla, which hold no
   CJK glyph, so a Chinese card needs a CJK face in that generator first. */
function cardFor(rest) {
  return ORIGIN + "/og" + (rest === "/" ? "/index" : rest) + ".png";
}

function headFor(code, locale) {
  const rest = "/" + code.toLowerCase();
  return headBlock(locale, rest, titleFor(code, locale), descriptionFor(code, locale), cardFor(rest));
}

function rootHeadFor(locale) {
  return headBlock(locale, "/", I18N.t("seo.rootTitle", locale),
    I18N.t("seo.rootDescription", locale), cardFor("/"));
}

/* ---- body pieces ---- */

function listItems(values) {
  return values.map((v) => "<li>" + escapeText(v) + "</li>").join("");
}

/* The sixteen cards, rendered into the static HTML in the same sorted order
   and with the same structure js/render.js builds, so a crawler sees the
   links without running any JavaScript and the two never disagree. Every
   href carries the page's own locale prefix: a Chinese card linking to the
   English page would drop the reader out of their language. */
function galleryItems(locale) {
  return Object.keys(BY_CODE).sort().map(function (code) {
    const t = I18N.type(code, locale);
    return '<li><a class="gallery-card" href="' + I18N.pathFor(locale, "/" + code.toLowerCase()) + '">' +
      '<span class="gallery-code">' + escapeText(code) + "</span>" +
      '<span class="gallery-name">' + escapeText(t.name) + "</span>" +
      '<span class="gallery-line">' + escapeText(t.line) + "</span>" +
      "</a></li>";
  }).join("");
}

/* Replaces one attribute's value on the element carrying the given id. Like
   fillById and setHidden, it throws rather than guessing: the attribute has
   to already be on the tag as a placeholder, exactly as aria-label="Language"
   already sits beside data-i18n-attr in index.html. */
function setAttr(html, id, name, value) {
  const openTag = new RegExp('<([a-z0-9]+)([^>]*\\sid="' + id + '"[^>]*)>');
  return replaceOnce(html, openTag, (m, tag, attrs) => {
    const attrRe = new RegExp('\\s' + name + '="[^"]*"');
    if (!attrRe.test(attrs)) {
      throw new Error('build-types: element with id="' + id + '" has no ' + name + ' attribute to set');
    }
    return "<" + tag + attrs.replace(attrRe, ' ' + name + '="' + escapeAttr(value) + '"') + ">";
  }, 'element with id="' + id + '"');
}

/* The same single anchor js/render.js builds: one control, not a list, named
   for the slot the page's own locale sits in (EN, 简 or 繁) and linking
   forward to the next slot in rotation. Without JavaScript it is still a
   real link to that next locale, so a reader with no script and a crawler
   with no JavaScript both reach it. This is not the SEO claim either way:
   the hreflang set in the head is, and that still names only the indexed
   locales, so an unfinished page stays noindex and unlisted while being one
   click away for a reader. */
function applyLangSwitch(html, locale, rest) {
  const seq = I18N.rotation();
  if (seq.length < 2) { return html; }
  const next = I18N.nextInSwitch(locale);
  let out = setHidden(html, "lang-switch", false);
  out = setAttr(out, "lang-switch", "href", I18N.pathFor(next, rest));
  out = setAttr(out, "lang-switch", "hreflang", I18N.HTML_LANG[next]);
  out = setAttr(out, "lang-switch", "lang", I18N.HTML_LANG[locale]);
  return fillById(out, "lang-switch", escapeText(I18N.slotLabel(locale)));
}

/* The same markup js/render.js builds, so the static page and the rendered one
   never disagree. Written into every page because these five sections are now
   most of what a crawler, and a reader with no JavaScript, would come for. */
function sectionsHtml(type, locale) {
  return I18N.sections(locale).map(function (section) {
    return '<section class="type-section">' +
      "<h3>" + escapeText(section.heading) + "</h3>" +
      type[section.key].map(function (paragraph) {
        return '<p class="type-paragraph">' + escapeText(paragraph) + "</p>";
      }).join("") +
      "</section>";
  }).join("");
}

/* The comment naming the generator and its contract test is for whoever edits
   index.html. It names private paths, so it does not belong on a public page.
   The pages.dev canonical comment above it explains a real thing to a real
   reader and stays. */
function dropBuildComment(html) {
  return replaceOnce(
    html,
    /\n  <!-- Everything between these markers[\s\S]*?-->/,
    () => "",
    "build-internals comment"
  );
}

/* Every locale's own <html lang> and the data-lang app.css reads to pick a
   CJK face. Stamped here rather than left to js/i18n.js so the right face is
   chosen on the first paint, before any script has run. */
function setLang(html, locale) {
  return replaceOnce(html, /<html lang="en">/,
    () => '<html lang="' + I18N.HTML_LANG[locale] + '" data-lang="' + locale + '">',
    "<html> tag");
}

function addCjkFont(html, locale) {
  const sub = CJK_SUBFAMILY[locale];
  if (!sub) { return html; }
  return replaceOnce(html, /(<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Fraunces[^"]*" rel="stylesheet">)/,
    (whole) => whole +
      '\n  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+' + sub +
      ':wght@400;500;700&family=Noto+Serif+' + sub + ':wght@400;600;700&display=swap" rel="stylesheet">',
    "Google Fonts stylesheet link");
}

/* A page below the root cannot reach a relative app.css, and a page two
   segments deep (/zh-hk/enfj) cannot reach it by accident either, which is
   what the one-level-deep English pages were quietly relying on. Everything
   except the English root is absolutised. */
function absolutiseAssets(html) {
  let out = replaceOnce(html, /href="app\.css"/, () => 'href="/app.css"', 'href="app.css"');
  ["favicon.svg", "favicon-32.png", "apple-touch-icon.png"].forEach((name) => {
    out = replaceOnce(out, new RegExp('href="' + name.replace(/\./g, "\\.") + '"'),
      () => 'href="/' + name + '"', 'href="' + name + '"');
  });
  const jsHits = (out.match(/src="js\//g) || []).length;
  if (jsHits !== 13) {
    throw new Error("build-types: expected 13 script tags, found " + jsHits);
  }
  return out.replace(/src="js\//g, 'src="/js/');
}

/* ---- pages ---- */

/* The root page is generated for its head, its sixteen links and its
   language. / is the page a crawler reaches first, and without the links it
   would be the one page on the site with no outbound ones. The English root
   keeps the relative asset paths that let index.html open by double-clicking
   it; every other root is one segment deep and cannot. */
function buildRoot(indexHtml, locale) {
  const loc = locale || I18N.DEFAULT;
  let html = dropBuildComment(indexHtml);
  html = replaceOnce(
    html,
    /<!-- BUILD:HEAD:START -->[\s\S]*?<!-- BUILD:HEAD:END -->/,
    () => "<!-- BUILD:HEAD:START -->\n" + rootHeadFor(loc) + "\n  <!-- BUILD:HEAD:END -->",
    "BUILD:HEAD marker pair"
  );
  html = setLang(html, loc);
  html = addCjkFont(html, loc);
  if (loc !== I18N.DEFAULT) { html = absolutiseAssets(html); }
  html = translateStatic(html, loc);
  html = setAttr(html, "btn-brand", "href", I18N.pathFor(loc, "/"));
  html = fillById(html, "gallery-grid", galleryItems(loc));
  html = applyLangSwitch(html, loc, "/");
  html = setHidden(html, "locale-notice", I18N.isComplete(loc));
  return html;
}

function buildPage(indexHtml, code, locale) {
  if (!/^[A-Z]{4}$/.test(code) || !BY_CODE[code]) {
    throw new Error("build-types: unknown type code " + code);
  }
  const loc = locale || I18N.DEFAULT;
  const type = I18N.type(code, loc);
  const rest = "/" + code.toLowerCase();
  let html = dropBuildComment(indexHtml);

  html = replaceOnce(
    html,
    /<!-- BUILD:HEAD:START -->[\s\S]*?<!-- BUILD:HEAD:END -->/,
    () => "<!-- BUILD:HEAD:START -->\n" + headFor(code, loc) + "\n  <!-- BUILD:HEAD:END -->",
    "BUILD:HEAD marker pair"
  );

  html = setLang(html, loc);
  html = addCjkFont(html, loc);
  html = absolutiseAssets(html);
  html = translateStatic(html, loc);
  html = setAttr(html, "btn-brand", "href", I18N.pathFor(loc, "/"));

  html = replaceOnce(html, /<body>/, () => '<body data-initial-type="' + code + '">', "<body> tag");

  html = setHidden(html, "view-intro", true);
  html = setHidden(html, "view-type", false);
  html = setHidden(html, "btn-back-gallery", false);
  html = setHidden(html, "type-test-cta", false);
  html = setHidden(html, "share-block", true);
  html = setHidden(html, "btn-restart", true);

  html = fillById(html, "type-code", escapeText(code));
  html = fillById(html, "type-name", escapeText(type.name));
  html = fillById(html, "type-opening", escapeText(type.opening));
  html = fillById(html, "type-best",
    escapeText(I18N.format("type.best", { clause: type.best }, loc)));
  html = fillById(html, "type-undone",
    escapeText(I18N.format("type.undone", { clause: type.undone }, loc)));
  html = fillById(html, "type-chips", listItems(type.chips));
  html = fillById(html, "type-often", listItems(type.often));
  html = fillById(html, "type-sections", sectionsHtml(type, loc));
  html = fillById(html, "gallery-grid", galleryItems(loc));
  html = applyLangSwitch(html, loc, rest);
  html = setHidden(html, "locale-notice", I18N.isComplete(loc));

  return html;
}

/* Indexed locales only. A noindex page in the sitemap asks a search engine to
   fetch something it has been told to ignore. */
function buildSitemap(codes) {
  const urls = [];
  INDEXED.forEach((loc) => {
    urls.push(urlFor(loc, "/"));
    codes.forEach((c) => urls.push(urlFor(loc, "/" + c.toLowerCase())));
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
    .concat(urls.map((u) => "  <url><loc>" + u + "</loc></url>"))
    .concat(["</urlset>", ""])
    .join("\n");
}

function build(outDir) {
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const codes = Object.keys(BY_CODE).sort();
  if (codes.length !== 16) {
    throw new Error("build-types: expected 16 types, found " + codes.length);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const written = [];

  /* <code>.html, not <code>/index.html. Cloudflare Pages serves <name>.html at
     the extensionless path /<name> with a plain 200, but it appends a trailing
     slash to the directory form: /enfj then 308s to /enfj/. Measured on the
     live site. The directory form therefore made every canonical, every
     sitemap entry and every gallery href point at a redirect.

     A locale is a directory for exactly that reason in reverse: /zh-hk is the
     directory form and 308s to /zh-hk/, which is why every canonical and
     every link to a locale root carries the trailing slash. */
  LOCALES.forEach((loc) => {
    const dir = loc === I18N.DEFAULT ? outDir : path.join(outDir, loc);
    fs.mkdirSync(dir, { recursive: true });
    codes.forEach((code) => {
      const file = path.join(dir, code.toLowerCase() + ".html");
      fs.writeFileSync(file, buildPage(indexHtml, code, loc));
      written.push(file);
    });
    /* stage.js copies index.html first and then calls build(), so the English
       root here deliberately overwrites the verbatim copy. Do not reorder
       those two. */
    const rootFile = path.join(dir, "index.html");
    fs.writeFileSync(rootFile, buildRoot(indexHtml, loc));
    written.push(rootFile);
  });

  const sitemap = path.join(outDir, "sitemap.xml");
  fs.writeFileSync(sitemap, buildSitemap(codes));
  written.push(sitemap);
  return written;
}

module.exports = {
  ORIGIN, LOCALES, INDEXED, escapeText, escapeAttr, titleFor, descriptionFor,
  translateStatic, alternates, galleryItems, applyLangSwitch, sectionsHtml,
  buildRoot, buildPage, buildSitemap, build
};

if (require.main === module) {
  const out = path.resolve(process.argv[2] || "public");
  const written = build(out);
  process.stdout.write("build-types: wrote " + written.length + " files into " + out + "\n");
}
