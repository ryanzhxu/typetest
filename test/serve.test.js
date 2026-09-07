"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const serve = require("./serve.js");

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-serve-"));
  fs.writeFileSync(path.join(dir, "index.html"), "<p>root</p>");
  fs.writeFileSync(path.join(dir, "404.html"), "<p>not here</p>");
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\n");
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset/>");
  fs.writeFileSync(path.join(dir, "app.css"), "body{}");
  fs.mkdirSync(path.join(dir, "enfj"));
  fs.writeFileSync(path.join(dir, "enfj", "index.html"), "<p>enfj</p>");
  return dir;
}

async function get(base, p) {
  const res = await fetch(base + p);
  return { status: res.status, type: res.headers.get("content-type"), body: await res.text() };
}

/* The smoke tests in test/smoke.test.js rest on this server. A server that
   answered 200 to everything would make "a garbage path 404s" vacuous, so
   these four cases are asserted directly rather than assumed. */
test("the test server resolves paths the way Cloudflare Pages does", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    assert.deepStrictEqual(
      (await get(server.url, "/")).body, "<p>root</p>", "/ must serve index.html"
    );
    const type = await get(server.url, "/enfj");
    assert.strictEqual(type.status, 200);
    assert.strictEqual(type.body, "<p>enfj</p>", "/enfj must serve enfj/index.html");

    const robots = await get(server.url, "/robots.txt");
    assert.strictEqual(robots.status, 200);
    assert.match(robots.type, /text\/plain/);

    const sitemap = await get(server.url, "/sitemap.xml");
    assert.strictEqual(sitemap.status, 200);
    assert.match(sitemap.type, /xml/);

    const css = await get(server.url, "/app.css");
    assert.match(css.type, /text\/css/);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the test server returns a real 404, with the 404 page as the body", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const missing = await get(server.url, "/totally-made-up-path");
    assert.strictEqual(missing.status, 404, "an unknown path must not be 200");
    assert.strictEqual(missing.body, "<p>not here</p>");

    const deep = await get(server.url, "/a/b/c");
    assert.strictEqual(deep.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the test server refuses to escape its root", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const escaped = await get(server.url, "/../../etc/passwd");
    assert.strictEqual(escaped.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
