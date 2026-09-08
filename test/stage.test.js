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
    /* One file per type, not one directory: Pages serves enfj.html at /enfj,
       but 308s /enfj to /enfj/ when enfj is a directory. */
    const expectedTypes = [
      "enfj", "enfp", "entj", "entp", "esfj", "esfp", "estj", "estp",
      "infj", "infp", "intj", "intp", "isfj", "isfp", "istj", "istp"
    ].map((code) => code + ".html");
    /* favicon.svg is a source file so that staging alone yields a site with
       an icon. The two raster icons and og/ are NOT here: scripts/build-og.js
       renders those into this directory as a separate deploy step. */
    const expected = ["404.html", "app.css", "favicon.svg", "index.html", "js",
                      "robots.txt", "sitemap.xml"]
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

  /* stage() deletes its output directory before it writes anything, so a
     broken guard would destroy a real source directory before this test could
     notice. Two layers stop that. First, isProtected is a pure function, so
     every decision is asserted with no filesystem access at all, and a wrong
     answer fails the test before any call to stage(). Second, every path that
     is then handed to stage() for real is backed up first and restored in the
     finally block. */
  const cases = [
    "index.html", "app.css", "404.html", "robots.txt",
    "js", path.join("js", "render.js"),
    "scripts", "test", "docs", ".github", ".superpowers", "package.json"
  ];

  cases.forEach((name) => {
    assert.strictEqual(
      stage.isProtected(path.join(root, name)), true,
      name + " must be refused: staging over it would delete it"
    );
  });
  assert.strictEqual(stage.isProtected(root), true, "the repo root must be refused");

  /* public is the real staging target and must stay allowed, or `npm run
     stage` and the deploy workflow both stop working. */
  assert.strictEqual(stage.isProtected(path.resolve(root, "public")), false, "public must stay stageable");
  assert.strictEqual(stage.isProtected(path.resolve(os.tmpdir(), "a3-out")), false, "a temp dir must stay stageable");

  /* Some protected names are git-ignored, so a fresh checkout does not have
     them: .superpowers is the agent workspace and is absent in CI. They still
     belong in the guard, because a wrong argument can delete them on a
     developer's machine, so the two assertion sets above cover the full list
     and so does the throw below. stage() refuses before it touches the
     filesystem, so a path that does not exist is fine to hand it.

     Only the filesystem half has to be conditional. Compute what is actually
     on disk once, and use that same list for the backup, the survival
     assertions and the restore. */
  const onDisk = (names) => names.filter((name) => fs.existsSync(path.join(root, name)));

  /* Back up only the top-level entries: a nested case such as js/render.js is
     covered by the backup of js/. */
  const roots = onDisk(["index.html", "app.css", "404.html", "robots.txt",
                        "js", "scripts", "test", "docs", ".github", ".superpowers", "package.json"]);
  /* A guard against this half quietly emptying itself out. */
  ["js", "scripts", "test"].forEach((name) => {
    assert.ok(roots.includes(name), name + " is tracked and must be on disk in any checkout");
  });

  const backup = fs.mkdtempSync(path.join(os.tmpdir(), "a3-src-backup-"));
  roots.forEach((name) => {
    fs.cpSync(path.join(root, name), path.join(backup, name), { recursive: true });
  });

  try {
    /* Prove the guard is actually wired into stage(), not merely correct in
       isolation, and that each of these survives the attempt. */
    const survivors = onDisk(cases);
    cases.forEach((name) => {
      const target = path.join(root, name);
      assert.throws(() => stage.stage(target), /refusing to stage over the source path/, name);
      if (survivors.includes(name)) {
        assert.ok(fs.existsSync(target), name + " must survive the attempt to stage over it");
      }
    });
    assert.ok(fs.existsSync(path.join(root, "js", "render.js")), "js/render.js must survive");
    assert.ok(fs.existsSync(path.join(root, "scripts", "stage.js")), "scripts/stage.js must survive");
    assert.ok(fs.existsSync(path.join(root, "test", "stage.test.js")), "test/stage.test.js must survive");

    /* The root last: by now stage() has been shown to consult the guard. */
    assert.throws(() => stage.stage(root), /refusing to stage over the source path/);
  } finally {
    /* A staged directory always contains 404.html and sitemap.xml, so their
       presence inside a source directory is the signal that it was clobbered. */
    roots.forEach((name) => {
      const target = path.join(root, name);
      const damaged = !fs.existsSync(target) ||
        (fs.statSync(target).isDirectory() && fs.existsSync(path.join(target, "sitemap.xml")));
      if (damaged) {
        fs.rmSync(target, { recursive: true, force: true });
        fs.cpSync(path.join(backup, name), target, { recursive: true });
      }
    });
    fs.rmSync(backup, { recursive: true, force: true });
  }
});

/* Regression. The live site serves index.html with max-age=0, must-revalidate
   and app.css and js/ with max-age=14400, so for four hours after a deploy a
   returning reader ran the new HTML against the old CSS and the old scripts.
   That combination is not a degraded site, it is a broken one: the old
   render.js filled #q-statement-a and #q-statement-b, which the new HTML does
   not have, so no question text appeared at all; the old CSS laid the card out
   in two columns, so the dot row sat off to the right; and the old render.js
   advanced on a click, from before Next existed, so touching a dot skipped the
   question. Stamping the asset URLs with the build's own content hash is what
   stops the two halves ever being from different builds. */
test("every staged page asks for this build's assets, by content hash", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    const id = stage.buildId(dir);
    assert.match(id, /^[0-9a-f]{12}$/, "the build id must be a content hash");

    const pages = fs.readdirSync(dir).filter((n) => n.endsWith(".html"));
    assert.strictEqual(pages.length, 18, "one root page, sixteen types and the 404");

    pages.forEach((name) => {
      const html = fs.readFileSync(path.join(dir, name), "utf8");

      /* The invariant that matters: nothing on a deployed page may ask for an
         asset by a URL that outlives the build it belongs to. */
      const bare = html.match(/(?:href|src)="\/?(?:app\.css|js\/[^"]+\.js)"/g) || [];
      assert.deepStrictEqual(bare, [], name + " still asks for an unversioned asset");

      const css = html.match(/href="\/?app\.css\?v=([0-9a-f]{12})"/g) || [];
      assert.strictEqual(css.length, 1, name + " must link app.css exactly once");
      assert.ok(css[0].includes(id), name + " links app.css at the wrong build id");

      /* 404.html is a dead end with no scripts on it. Every page that runs the
         app carries all eight, and all eight must move together. */
      const js = html.match(/src="\/?js\/[a-z0-9-]+\.js\?v=([0-9a-f]{12})"/g) || [];
      assert.strictEqual(js.length, name === "404.html" ? 0 : 8, name + " script count");
      js.forEach((tag) => assert.ok(tag.includes(id), name + " loads a script at the wrong build id"));
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the build id follows the asset contents, so a changed asset is a new URL", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-stage-"));
  try {
    stage.stage(dir);
    const before = stage.buildId(dir);

    /* A constant, a date or the git SHA would all pass the test above and none
       of them would notice this. Only the contents may decide the id. */
    fs.appendFileSync(path.join(dir, "app.css"), "\n/* edited */\n");
    assert.notStrictEqual(stage.buildId(dir), before, "a changed stylesheet must change the id");

    stage.stage(dir);
    assert.strictEqual(stage.buildId(dir), before, "identical contents must give an identical id");

    fs.appendFileSync(path.join(dir, "js", "render.js"), "\n/* edited */\n");
    assert.notStrictEqual(stage.buildId(dir), before, "a changed script must change the id");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
