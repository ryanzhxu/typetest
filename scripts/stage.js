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

function stage(outDir) {
  const out = path.resolve(outDir);
  if (out === ROOT) { throw new Error("stage: refusing to stage over the repo root"); }
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
