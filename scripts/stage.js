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
const FILES = ["index.html", "app.css", "404.html", "robots.txt"];
const DIRS = ["js"];

/* The staging directory is deleted before it is written. A wrong argument to
   `npm run stage` must therefore never name a source path: `node
   scripts/stage.js js` would otherwise delete the real js/ directory. */
const PROTECTED = [ROOT].concat(FILES.concat(DIRS).map(function (name) {
  return path.join(ROOT, name);
}));

function stage(outDir) {
  const out = path.resolve(outDir);
  if (PROTECTED.indexOf(out) !== -1) {
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

module.exports = { stage, FILES, DIRS };

if (require.main === module) {
  const out = process.argv[2] || "public";
  const entries = stage(out);
  process.stdout.write("stage: " + entries.length + " entries in " + path.resolve(out) + "\n");
}
