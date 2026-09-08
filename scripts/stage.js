"use strict";
/* Builds the exact directory that gets deployed. Both the workflow and the
   smoke tests call this, so the tests exercise the real artifact rather than
   a second, hopefully-identical copy of it.

   The list below is an allowlist on purpose. Everything not named here stays
   out, whatever else is sitting in the repo. */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const buildTypes = require("./build-types.js");

const ROOT = path.resolve(__dirname, "..");
const FILES = ["index.html", "app.css", "404.html", "robots.txt", "favicon.svg"];
const DIRS = ["js"];

/* The staging directory is deleted before it is written. A wrong argument to
   `npm run stage` must therefore never name a source path, nor anything
   inside one: `node scripts/stage.js scripts` would otherwise delete
   stage.js and build-types.js along with the rest of the directory.

   This is a literal list, not FILES.concat(DIRS). Those two name only what
   gets copied; the repo holds plenty more that a wrong argument can reach.
   `public`, the real staging target, is deliberately absent. */
const PROTECTED = ["index.html", "app.css", "404.html", "robots.txt", "favicon.svg", "js",
                   "scripts", "test", "docs", ".github", ".superpowers",
                   "package.json", "node_modules", ".git"];

/* Containment, not equality: a child of a protected path is not itself in the
   list, and js/render.js must be refused just as js/ is. */
function isProtected(out) {
  if (out === ROOT) { return true; }
  return PROTECTED.some(function (name) {
    const source = path.join(ROOT, name);
    return out === source || out.startsWith(source + path.sep);
  });
}

/* ---- cache busting ---- */

/* Cloudflare Pages serves the HTML with max-age=0, must-revalidate and
   everything under app.css and js/ with max-age=14400. Those two numbers are
   the whole problem: for four hours after a deploy, a reader who had been here
   before ran this build's HTML against the last build's stylesheet and
   scripts, and the site was not merely stale, it was broken. The old
   render.js wrote the question into #q-statement-a and #q-statement-b, which
   this HTML does not have, so no question appeared; the old stylesheet laid
   the card out in two columns, so the dot row sat off to the right of it; and
   the old render.js still advanced on a click, from before the Next button,
   so touching a dot skipped the question.

   The fix is to make an asset URL name the build it belongs to. A page can
   then only ever load the assets it was built with, and a reader carrying the
   old ones asks for a URL they have never seen and gets this build's. Long
   caching stays, and is now safe rather than dangerous.

   The stamp goes on the staged copies only. The source index.html keeps its
   plain relative paths so it still opens by double-clicking it. */

/* Read from the staged directory, never from ROOT: what the id has to
   describe is what is about to be uploaded. */
function assets(dir) {
  return ["app.css"].concat(
    fs.readdirSync(path.join(dir, "js")).sort().map(function (name) { return "js/" + name; })
  );
}

/* The name is hashed alongside the bytes, so renaming a script is a new id
   even when no file's contents changed. */
function buildId(dir) {
  const h = crypto.createHash("sha256");
  assets(dir).forEach(function (rel) {
    h.update(rel);
    h.update(fs.readFileSync(path.join(dir, rel)));
  });
  return h.digest("hex").slice(0, 12);
}

/* One id for the whole build rather than one per file. The eight scripts share
   a single SG namespace and are written against each other, so a build is the
   unit that has to move together anyway, and a per-file hash would only buy a
   spared request at the cost of letting the halves diverge again. */
function stampAssets(dir, id) {
  fs.readdirSync(dir).filter(function (name) {
    return name.endsWith(".html");
  }).forEach(function (name) {
    const file = path.join(dir, name);
    /* Both forms of every path: the root page keeps app.css and js/ relative,
       and build-types.js absolutises them to /app.css and /js/ on the sixteen
       type pages, which are served one level deep. */
    const html = fs.readFileSync(file, "utf8")
      .replace(/href="(\/?)app\.css"/g, 'href="$1app.css?v=' + id + '"')
      .replace(/src="(\/?)(js\/[a-z0-9-]+\.js)"/g, 'src="$1$2?v=' + id + '"');
    fs.writeFileSync(file, html);
  });
}

function stage(outDir) {
  const out = path.resolve(outDir);
  if (isProtected(out)) {
    throw new Error("stage: refusing to stage over the source path " + out);
  }
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  FILES.forEach(function (name) {
    fs.copyFileSync(path.join(ROOT, name), path.join(out, name));
  });
  DIRS.forEach(function (name) {
    fs.cpSync(path.join(ROOT, name), path.join(out, name), { recursive: true });
  });

  buildTypes.build(out);
  /* After the generator, so the root page and all sixteen type pages are
     stamped by the one pass. */
  stampAssets(out, buildId(out));
  return fs.readdirSync(out).sort();
}

module.exports = { stage, buildId, isProtected, FILES, DIRS, PROTECTED };

if (require.main === module) {
  const out = process.argv[2] || "public";
  const entries = stage(out);
  process.stdout.write("stage: " + entries.length + " entries in " + path.resolve(out) + "\n");
}
