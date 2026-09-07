"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const stage = require("../scripts/stage.js");

test("the deploy directory holds the public site and nothing else", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    const top = fs.readdirSync(dir).sort();
    const expectedTypes = [
      "enfj", "enfp", "entj", "entp", "esfj", "esfp", "estj", "estp",
      "infj", "infp", "intj", "intp", "isfj", "isfp", "istj", "istp"
    ];
    const expected = ["404.html", "app.css", "index.html", "js", "robots.txt", "sitemap.xml"]
      .concat(expectedTypes).sort();
    assert.deepStrictEqual(top, expected);

    /* This leak was shipped once already. Assert the negative directly. */
    ["docs", "test", "scripts", ".github", ".superpowers", "package.json",
     "package-lock.json", ".gitignore", ".pagesignore", "node_modules"]
      .forEach((name) => {
        assert.ok(!fs.existsSync(path.join(dir, name)), name + " must never reach the deploy directory");
      });

    const js = fs.readdirSync(path.join(dir, "js")).sort();
    assert.deepStrictEqual(js, [
      "app.js", "flow.js", "items.js", "ns.js", "render.js", "score.js", "share.js", "types.js"
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("staging twice in a row leaves no stale files behind", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    fs.writeFileSync(path.join(dir, "leftover.html"), "stale");
    stage.stage(dir);
    assert.ok(!fs.existsSync(path.join(dir, "leftover.html")), "staging must clear the directory first");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("stage refuses any source path, so a wrong argument cannot delete the repo", () => {
  const root = path.resolve(__dirname, "..");
  const jsDir = path.join(root, "js");

  /* stage() deletes its output directory before it writes anything, so a
     broken guard would destroy the real js/ before this test could notice.
     Back it up first, and put it back in the finally block. */
  const backup = fs.mkdtempSync(path.join(os.tmpdir(), "a3-js-backup-"));
  fs.cpSync(jsDir, path.join(backup, "js"), { recursive: true });
  try {
    assert.throws(() => stage.stage(jsDir), /refusing to stage over the source path/);
    assert.ok(fs.existsSync(path.join(jsDir, "render.js")), "the source js/ directory must survive");
    assert.throws(() => stage.stage(root), /refusing to stage over the source path/);
    assert.throws(() => stage.stage(path.join(root, "index.html")), /refusing to stage over the source path/);
    assert.throws(() => stage.stage(path.join(root, "app.css")), /refusing to stage over the source path/);
  } finally {
    const intact = fs.existsSync(path.join(jsDir, "render.js")) &&
      !fs.existsSync(path.join(jsDir, "index.html"));
    if (!intact) {
      fs.rmSync(jsDir, { recursive: true, force: true });
      fs.cpSync(path.join(backup, "js"), jsDir, { recursive: true });
    }
    fs.rmSync(backup, { recursive: true, force: true });
  }
});
