"use strict";
/* Builds the exact directory that gets deployed. Both the workflow and the
   smoke tests call this, so the tests exercise the real artifact rather than
   a second, hopefully-identical copy of it.

   The list below is an allowlist on purpose. Everything not named here stays
   out, whatever else is sitting in the repo. */

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
  return fs.readdirSync(out).sort();
}

module.exports = { stage, isProtected, FILES, DIRS, PROTECTED };

if (require.main === module) {
  const out = process.argv[2] || "public";
  const entries = stage(out);
  process.stdout.write("stage: " + entries.length + " entries in " + path.resolve(out) + "\n");
}
