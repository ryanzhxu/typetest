"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const stage = require("../scripts/stage.js");
const og = require("../scripts/build-og.js");
require("../js/ns.js");
require("../js/types.js");
const byCode = globalThis.SG.types.byCode;

/* Same policy as the smoke tests: optional at require-time so a bare checkout
   still runs, but a miss under CI is a failure, because a skipped render
   means the deploy is about to ship pages whose og:image is a 404. */
let chromium = null;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  chromium = null;
}

if (!chromium && process.env.CI) {
  throw new Error(
    "playwright's chromium is unavailable under CI. build-og would be skipped " +
    "and every page would ship pointing at a social card that does not exist."
  );
}

/* The PNG header carries the dimensions: bytes 16-23 of an IHDR chunk are
   width then height, big-endian. Read them rather than trusting the
   screenshot call, because a wrong viewport still produces a valid file. */
function pngSize(file) {
  const buf = fs.readFileSync(file);
  assert.strictEqual(buf.subarray(1, 4).toString("ascii"), "PNG", file + " is not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/* IHDR byte 25 is the colour type. 6 is RGBA, 2 is RGB. */
function pngHasAlpha(file) {
  return fs.readFileSync(file).readUInt8(25) === 6;
}

test("build-og renders a card for every type, the root, and both raster icons",
  { skip: !chromium }, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
    try {
      stage.stage(dir);
      const written = await og.build(dir);

      const codes = Object.keys(byCode).sort();
      assert.strictEqual(written.length, codes.length + 3, "16 cards, the root card, two icons");

      codes.forEach((code) => {
        const file = path.join(dir, "og", code.toLowerCase() + ".png");
        assert.ok(fs.existsSync(file), "no card for " + code);
        assert.deepStrictEqual(pngSize(file), { width: 1200, height: 630 }, code + " is the wrong size");
        assert.ok(fs.statSync(file).size > 5000, code + " card is suspiciously small");
      });

      assert.deepStrictEqual(pngSize(path.join(dir, "og", "index.png")), { width: 1200, height: 630 });
      assert.deepStrictEqual(pngSize(path.join(dir, "favicon-32.png")), { width: 32, height: 32 });
      assert.deepStrictEqual(pngSize(path.join(dir, "apple-touch-icon.png")), { width: 180, height: 180 });

      /* iOS masks a touch icon to its own rounded shape and composites any
         transparency onto black or white, so clear corners show as a halo
         inside Apple's rounding. Invisible in review, so assert it. */
      assert.strictEqual(
        pngHasAlpha(path.join(dir, "apple-touch-icon.png")), false,
        "the apple touch icon must be full-bleed, with no alpha channel"
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

test("every page's og:image names a file that build-og actually wrote",
  { skip: !chromium }, async () => {
    /* The generator writes the URL and build-og writes the file, and nothing
       else connects the two. A rename on either side would ship sixteen
       pages whose preview is a 404, which no other test here would see. */
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "og-link-"));
    try {
      stage.stage(dir);
      await og.build(dir);

      const pages = Object.keys(byCode).sort().map((c) => c.toLowerCase() + ".html").concat(["index.html"]);
      pages.forEach((name) => {
        const html = fs.readFileSync(path.join(dir, name), "utf8");
        const match = html.match(/<meta property="og:image" content="([^"]+)">/);
        assert.ok(match, name + " has no og:image");
        const local = path.join(dir, match[1].replace("https://personality.ryanxu.dev/", ""));
        assert.ok(fs.existsSync(local), name + " points at " + match[1] + ", which was not written");
      });

      /* The same for the three icons every page links. */
      const html = fs.readFileSync(path.join(dir, "infj.html"), "utf8");
      ["/favicon.svg", "/favicon-32.png", "/apple-touch-icon.png"].forEach((href) => {
        assert.ok(html.includes('href="' + href + '"'), "infj.html does not link " + href);
        assert.ok(fs.existsSync(path.join(dir, href.slice(1))), href + " was never written");
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

test("a card refuses to render when the fonts did not arrive", { skip: !chromium }, async () => {
  /* The font guard is the only thing standing between a network blip and
     sixteen finished-looking cards set in Georgia. Block the stylesheet and
     the guard must throw rather than let a screenshot be taken.

     This is the case document.fonts.check alone cannot see: with no
     @font-face rule loaded, check() returns true, because the browser can
     indeed render the text, just in the wrong face. */
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(og.cardHtml("INFJ", "The Quiet Read", "A line."),
      { waitUntil: "domcontentloaded" });

    const faces = og.facesFor("INFJ", "The Quiet Read", "A line.");
    assert.strictEqual(
      await page.evaluate(() => document.fonts.check('600 96px Fraunces', 'The Quiet Read')), true,
      "check() alone reports true here, which is why the guard cannot rely on it"
    );
    await assert.rejects(
      () => og.assertFonts(page, faces),
      /did not load/,
      "the guard must refuse a card whose fonts never arrived"
    );
  } finally {
    await browser.close();
  }
});

test("the guard passes when the fonts did arrive", { skip: !chromium }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(og.cardHtml("INFJ", "The Quiet Read", "A line."),
      { waitUntil: "networkidle" });
    await og.assertFonts(page, og.facesFor("INFJ", "The Quiet Read", "A line."));
  } finally {
    await browser.close();
  }
});

test("facesFor asks about the weights a card actually paints", () => {
  /* The root card has no type code, so it never paints Fraunces 400, and an
     earlier version of the guard failed it for exactly that. */
  const typeCard = og.facesFor("INFJ", "The Quiet Read", "A line.");
  const rootCard = og.facesFor("", "Personality", "A line.");

  assert.ok(typeCard.some((f) => f.font.includes("400") && f.font.includes("Fraunces")),
    "a type card paints Fraunces 400 in its code and must check for it");
  assert.ok(!rootCard.some((f) => f.font.includes("400") && f.font.includes("Fraunces")),
    "the root card paints no Fraunces 400 and must not require it");
  [typeCard, rootCard].forEach((faces) => {
    assert.ok(faces.some((f) => f.font.includes("600 96px Fraunces")), "the name is always Fraunces 600");
    assert.ok(faces.every((f) => typeof f.text === "string" && f.text.length > 0),
      "every check needs text, because the font is split by unicode-range");
  });
});
