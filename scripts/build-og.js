"use strict";
/* Deploy-time only. Renders the social preview image for every page, plus the
   raster icons, into <outDir>/og and <outDir>. Nothing here ships to the
   browser.

   This runs AFTER scripts/stage.js, never inside it. stage() deletes its
   output directory and is synchronous, and both of those are relied on by
   test/stage.test.js. Rendering needs a browser and a promise, so it is its
   own step in the deploy workflow.

   Chromium rather than a canvas library: the deploy already installs one for
   the tests, so this adds no dependency, and a card drawn as ordinary HTML
   and CSS uses the same two fonts and the same six colours as the site
   instead of a second hand-built approximation of them that can drift. */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

require(path.join(ROOT, "js", "ns.js"));
require(path.join(ROOT, "js", "types.js"));
const BY_CODE = globalThis.SG.types.byCode;

/* 1200x630 is the size every major platform crops toward. Anything taller
   gets letterboxed in a timeline. */
const OG_W = 1200;
const OG_H = 630;

/* The site's tokens, dark theme. A preview is always dark: there is no
   viewer preference to read inside somebody else's timeline. */
const GROUND = "#17141F";
const TEXT = "#F3EDE3";
const PEACH = "#F2A17B";
const MUTED = "#9d97ac";

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Karla:wght@400;500;700&display=swap";

function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* The card is deliberately close to the top of a type page: spaced code,
   the name in Fraunces, the one-liner under it, the wordmark at the foot. */
function cardHtml(code, name, line) {
  return [
    "<!doctype html><html><head><meta charset='utf-8'>",
    '<link href="' + FONTS_URL + '" rel="stylesheet">',
    "<style>",
    "  * { box-sizing: border-box; margin: 0; }",
    "  html, body { width: " + OG_W + "px; height: " + OG_H + "px; }",
    "  body {",
    "    background: " + GROUND + "; color: " + TEXT + ";",
    "    font-family: 'Karla', sans-serif;",
    "    padding: 76px 88px;",
    "    display: flex; flex-direction: column; justify-content: space-between;",
    "  }",
    "  .code { font-family: 'Fraunces', Georgia, serif; font-size: 34px;",
    "          letter-spacing: 0.35em; color: " + PEACH + "; text-transform: uppercase; }",
    "  .name { font-family: 'Fraunces', Georgia, serif; font-weight: 600;",
    "          font-size: 96px; line-height: 1.05; margin-top: 26px; }",
    "  .name.wide { font-size: 76px; }",
    "  .line { font-size: 38px; line-height: 1.35; color: " + MUTED + ";",
    "          margin-top: 30px; max-width: 900px; }",
    "  .brand { font-family: 'Fraunces', Georgia, serif; font-weight: 600;",
    "           font-size: 28px; color: " + MUTED + "; }",
    "</style></head><body>",
    "<div>",
    code ? '<p class="code">' + escapeText(code) + "</p>" : "",
    '<h1 class="name' + (name.length > 14 ? " wide" : "") + '">' + escapeText(name) + "</h1>",
    '<p class="line">' + escapeText(line) + "</p>",
    "</div>",
    /* The root card's headline already is the wordmark, so repeating it at
       the foot reads as a mistake. Only type cards get the footer. */
    code ? '<p class="brand">Personality</p>' : "<p></p>",
    "</body></html>"
  ].join("\n");
}

/* The mark is the thesis: your type and the second one living in it, as two
   circles that overlap. Small enough to read at 16px, where any lettering
   would turn to mud. */
const ICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Personality">',
  '  <rect width="32" height="32" rx="7" fill="' + GROUND + '"/>',
  '  <circle cx="12.6" cy="16" r="7.6" fill="' + PEACH + '" opacity="0.92"/>',
  '  <circle cx="19.4" cy="16" r="7.6" fill="#ABA0EA" opacity="0.72"/>',
  "</svg>",
  ""
].join("\n");

/* squared drops the rounded corners and paints the ground behind them. iOS
   masks a touch icon to its own shape and composites anything transparent
   onto black or white, so a rounded PNG with clear corners gets a dark halo
   inside Apple's rounding. A favicon has no such masking and keeps its
   corners. */
function iconHtml(size, squared) {
  return [
    "<!doctype html><html><head><meta charset='utf-8'><style>",
    "  * { margin: 0; }",
    "  html, body { width: " + size + "px; height: " + size + "px;",
    "                background: " + (squared ? GROUND : "transparent") + "; }",
    "  svg { display: block; width: " + size + "px; height: " + size + "px; }",
    "</style></head><body>",
    squared ? ICON_SVG.replace(' rx="7"', "") : ICON_SVG,
    "</body></html>"
  ].join("\n");
}

/* A card drawn in Georgia instead of Fraunces is wrong in a way nobody
   downstream would ever notice, because it still looks like a finished
   image. Fail the build rather than ship sixteen of those.

   Ask about the weights the card actually paints, not the family alone.
   document.fonts.check("96px Fraunces") means weight 400, and the root card
   never uses Fraunces 400: it has no type code, so the only Fraunces on it
   is the 600 of the name and the wordmark. Checking the bare family failed
   that card while its fonts were in fact loaded. Google Fonts also splits a
   family by unicode-range, so the text is passed too and only the glyphs
   this card needs are asked about. */
async function assertFonts(page, weights) {
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(function (specs) {
    return specs.filter(function (s) {
      /* document.fonts.check is not enough on its own. For a family with no
         @font-face rule at all it returns TRUE, because the browser is
         perfectly able to render the text in a fallback. So it cannot see the
         failure that matters most here, the stylesheet never arriving.
         Requiring a loaded FontFace of the right family and weight catches
         both: a blocked stylesheet leaves no face to find, and a face that
         is declared but still downloading is not yet "loaded". check() then
         adds the unicode-range question, which the face list cannot answer. */
      /* Array.from, not Array.prototype.some.call: FontFaceSet is a Set, so
         it is iterable but has no length, and the call form silently sees
         zero entries and reports every face missing. */
      var faceLoaded = Array.from(document.fonts).some(function (f) {
        return f.family.replace(/["']/g, "") === s.family &&
               String(f.weight) === String(s.weight) &&
               f.status === "loaded";
      });
      return !faceLoaded || !document.fonts.check(s.font, s.text);
    }).map(function (s) { return s.font; });
  }, weights);
  if (missing.length) {
    throw new Error(
      "build-og: these faces did not load, so the card would render in a " +
      "fallback and still look finished: " + missing.join(", ") + ". " +
      "Refusing to write it. Check network access to fonts.googleapis.com."
    );
  }
}

async function shot(page, html, width, height, file, weights) {
  await page.setViewportSize({ width: width, height: height });
  await page.setContent(html, { waitUntil: "networkidle" });
  await assertFonts(page, weights);
  await page.screenshot({ path: file });
}

/* The faces a given card paints. The type code is the only Fraunces 400 on
   any card, so it is only required when there is a code to draw. */
function facesFor(code, name, line) {
  const faces = [
    { family: "Fraunces", weight: 600, font: '600 96px Fraunces', text: name + (code ? " Personality" : "") },
    { family: "Karla", weight: 400, font: '400 38px Karla', text: line }
  ];
  if (code) {
    faces.push({ family: "Fraunces", weight: 400, font: '400 34px Fraunces', text: code });
  }
  return faces;
}

async function build(outDir) {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    throw new Error(
      "build-og: playwright is not installed. It is a devDependency and the " +
      "deploy installs it for the tests, so this means npm install was skipped."
    );
  }

  const out = path.resolve(outDir);
  if (!fs.existsSync(out)) {
    throw new Error("build-og: " + out + " does not exist. Run scripts/stage.js first.");
  }
  const ogDir = path.join(out, "og");
  fs.mkdirSync(ogDir, { recursive: true });

  const written = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });

    const codes = Object.keys(BY_CODE).sort();
    if (codes.length !== 16) {
      throw new Error("build-og: expected 16 types, found " + codes.length);
    }
    for (const code of codes) {
      const t = BY_CODE[code];
      const file = path.join(ogDir, code.toLowerCase() + ".png");
      await shot(page, cardHtml(code, t.name, t.line), OG_W, OG_H, file,
        facesFor(code, t.name, t.line));
      written.push(file);
    }

    /* The root card carries the site's own promise, not a type's. */
    const rootFile = path.join(ogDir, "index.png");
    const rootLine = "A four-letter test that tells you which second type is living in your result.";
    await shot(page, cardHtml("", "Personality", rootLine), OG_W, OG_H, rootFile,
      facesFor("", "Personality", rootLine));
    written.push(rootFile);

    /* favicon.svg is a source file that stage.js copies, so that `npm run
       stage` on its own still produces a site with an icon. Only the rasters
       are rendered here: Safari's touch icon, and anywhere that still
       refuses an SVG favicon. */
    for (const [name, size, squared] of [["favicon-32.png", 32, false],
                                         ["apple-touch-icon.png", 180, true]]) {
      const file = path.join(out, name);
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(iconHtml(size, squared), { waitUntil: "load" });
      await page.screenshot({ path: file, omitBackground: !squared });
      written.push(file);
    }
  } finally {
    await browser.close();
  }
  return written;
}

module.exports = { build, cardHtml, iconHtml, facesFor, assertFonts, ICON_SVG, OG_W, OG_H };

if (require.main === module) {
  const out = path.resolve(process.argv[2] || "public");
  build(out).then(function (written) {
    process.stdout.write("build-og: wrote " + written.length + " files into " + out + "\n");
  }).catch(function (e) {
    process.stderr.write(String(e && e.message ? e.message : e) + "\n");
    process.exit(1);
  });
}
