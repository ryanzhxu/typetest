"use strict";
/* Deploy-time only. Reads index.html and emits one page per type, each with
   its own head meta and its own copy already in the HTML. Nothing here ships
   to the browser.

   Every helper below throws rather than guessing. A generator that quietly
   emits sixteen pages with the homepage's title is worse than one that fails
   the build, because nothing downstream would notice. */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://personality.ryanxu.dev";

require(path.join(ROOT, "js", "ns.js"));
require(path.join(ROOT, "js", "types.js"));
const BY_CODE = globalThis.SG.types.byCode;
const SECTIONS = globalThis.SG.types.SECTIONS;

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

function titleFor(code, type) {
  return type.name + " (" + code + ")";
}

function descriptionFor(code, type) {
  return type.line + " What " + code +
    " looks like up close, and the second type that lives in it.";
}

function headFor(code, type) {
  const title = escapeAttr(titleFor(code, type));
  const desc = escapeAttr(descriptionFor(code, type));
  const url = ORIGIN + "/" + code.toLowerCase();
  /* Rendered by scripts/build-og.js into the same staged directory. Absolute,
     because a scraper resolves this against nothing. */
  const image = ORIGIN + "/og/" + code.toLowerCase() + ".png";
  return [
    "  <title>" + escapeText(titleFor(code, type)) + "</title>",
    '  <meta name="description" content="' + desc + '">',
    '  <link rel="canonical" href="' + url + '">',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:url" content="' + url + '">',
    '  <meta property="og:site_name" content="Personality">',
    '  <meta property="og:title" content="' + title + '">',
    '  <meta property="og:description" content="' + desc + '">',
    '  <meta property="og:image" content="' + image + '">',
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    '  <meta property="og:image:alt" content="' + title + '">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '  <meta name="twitter:title" content="' + title + '">',
    '  <meta name="twitter:description" content="' + desc + '">',
    '  <meta name="twitter:image" content="' + image + '">'
  ].join("\n");
}

function listItems(values) {
  return values.map((v) => "<li>" + escapeText(v) + "</li>").join("");
}

/* The sixteen cards, rendered into the static HTML in the same sorted order
   and with the same structure js/render.js builds, so a crawler sees the
   links without running any JavaScript and the two never disagree. */
function galleryItems(byCode) {
  return Object.keys(byCode).sort().map(function (code) {
    const t = byCode[code];
    return '<li><a class="gallery-card" href="/' + code.toLowerCase() + '">' +
      '<span class="gallery-code">' + escapeText(code) + "</span>" +
      '<span class="gallery-name">' + escapeText(t.name) + "</span>" +
      '<span class="gallery-line">' + escapeText(t.line) + "</span>" +
      "</a></li>";
  }).join("");
}

/* The same markup js/render.js builds, so the static page and the rendered one
   never disagree. Written into every page because these five sections are now
   most of what a crawler, and a reader with no JavaScript, would come for. */
function sectionsHtml(type) {
  return SECTIONS.map(function (section) {
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

/* The root page is generated too, and only so it carries the sixteen links.
   / is the page a crawler reaches first, and without this it would be the one
   page on the site with no outbound links. Everything else about it, the head,
   the <body> tag, every view's hidden state and the relative asset paths that
   let index.html open from the filesystem, is left exactly as it is. */
function buildRoot(indexHtml) {
  let html = dropBuildComment(indexHtml);
  html = fillById(html, "gallery-grid", galleryItems(BY_CODE));
  return html;
}

function buildPage(indexHtml, code, type) {
  if (!/^[A-Z]{4}$/.test(code) || !BY_CODE[code]) {
    throw new Error("build-types: unknown type code " + code);
  }
  let html = dropBuildComment(indexHtml);

  html = replaceOnce(
    html,
    /<!-- BUILD:HEAD:START -->[\s\S]*?<!-- BUILD:HEAD:END -->/,
    () => "<!-- BUILD:HEAD:START -->\n" + headFor(code, type) + "\n  <!-- BUILD:HEAD:END -->",
    "BUILD:HEAD marker pair"
  );

  /* A page served at /enfj cannot reach a relative app.css. The root page
     keeps relative paths so index.html still opens from the filesystem. */
  html = replaceOnce(html, /href="app\.css"/, () => 'href="/app.css"', 'href="app.css"');
  /* The three icons are relative for the same reason app.css is, and have to
     be absolutised for the same reason: a page served at /enfj resolves a
     relative href against /, which happens to work, but only by accident of
     these pages being one level deep. Do not rely on that. */
  [["favicon.svg", "favicon.svg"], ["favicon-32.png", "favicon-32.png"],
   ["apple-touch-icon.png", "apple-touch-icon.png"]].forEach(([name]) => {
    html = replaceOnce(html, new RegExp('href="' + name.replace(".", "\\.") + '"'),
      () => 'href="/' + name + '"', 'href="' + name + '"');
  });
  const jsHits = (html.match(/src="js\//g) || []).length;
  if (jsHits !== 8) {
    throw new Error("build-types: expected 8 script tags, found " + jsHits);
  }
  html = html.replace(/src="js\//g, 'src="/js/');

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
  html = fillById(html, "type-best", escapeText("You are at your best " + type.best));
  html = fillById(html, "type-undone", escapeText("You come undone " + type.undone));
  html = fillById(html, "type-chips", listItems(type.chips));
  html = fillById(html, "type-often", listItems(type.often));
  html = fillById(html, "type-sections", sectionsHtml(type));
  html = fillById(html, "gallery-grid", galleryItems(BY_CODE));

  return html;
}

function buildSitemap(codes) {
  const urls = [ORIGIN + "/"].concat(codes.map((c) => ORIGIN + "/" + c.toLowerCase()));
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
     sitemap entry and every gallery href point at a redirect. */
  codes.forEach((code) => {
    const file = path.join(outDir, code.toLowerCase() + ".html");
    fs.writeFileSync(file, buildPage(indexHtml, code, BY_CODE[code]));
    written.push(file);
  });
  /* stage.js copies index.html first and then calls build(), so this
     deliberately overwrites the verbatim copy. Do not reorder those two. */
  const rootFile = path.join(outDir, "index.html");
  fs.writeFileSync(rootFile, buildRoot(indexHtml));
  written.push(rootFile);

  const sitemap = path.join(outDir, "sitemap.xml");
  fs.writeFileSync(sitemap, buildSitemap(codes));
  written.push(sitemap);
  return written;
}

module.exports = {
  ORIGIN, escapeText, escapeAttr, titleFor, descriptionFor,
  galleryItems, sectionsHtml, buildRoot, buildPage, buildSitemap, build
};

if (require.main === module) {
  const out = path.resolve(process.argv[2] || "public");
  const written = build(out);
  process.stdout.write("build-types: wrote " + written.length + " files into " + out + "\n");
}
