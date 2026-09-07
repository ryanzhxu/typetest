"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const serve = require("./serve.js");

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-serve-"));
  fs.writeFileSync(path.join(dir, "index.html"), "<p>root</p>");
  fs.writeFileSync(path.join(dir, "404.html"), "<p>not here</p>");
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\n");
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset/>");
  fs.writeFileSync(path.join(dir, "app.css"), "body{}");
  /* The shape the generator actually emits: <code>.html, served at /<code>. */
  fs.writeFileSync(path.join(dir, "enfj.html"), "<p>enfj</p>");
  /* The directory form, kept so the fallback stays covered. */
  fs.mkdirSync(path.join(dir, "old"));
  fs.writeFileSync(path.join(dir, "old", "index.html"), "<p>old</p>");
  return dir;
}

async function get(base, p) {
  const res = await fetch(base + p);
  return { status: res.status, type: res.headers.get("content-type"), body: await res.text() };
}

/* Redirects must stay visible: a followed redirect looks exactly like a 200,
   which is how a site shipped with every canonical pointing at a 308. */
async function getRaw(base, p) {
  const res = await fetch(base + p, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), body: await res.text() };
}

/* fetch() runs its path through the WHATWG URL parser, which collapses
   ".." segments before the request is ever sent, so it cannot exercise a
   traversal attempt. http.request's `path` option is not normalized: it
   goes over the wire exactly as given. */
function rawGet(port, rawPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path: rawPath }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode }));
    });
    req.on("error", reject);
    req.end();
  });
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
    /* The case that matters: Pages serves enfj.html at /enfj, with a plain
       200 and no trailing slash. */
    const type = await getRaw(server.url, "/enfj");
    assert.strictEqual(type.status, 200, "/enfj must be 200 directly, not a redirect");
    assert.strictEqual(type.body, "<p>enfj</p>", "/enfj must serve enfj.html");

    /* The directory form, and the reason the generator abandoned it: Pages
       appends the trailing slash, so the bare path is a redirect. */
    const bare = await getRaw(server.url, "/old");
    assert.strictEqual(bare.status, 308, "a directory must not be served at the bare path");
    assert.strictEqual(bare.location, "/old/");

    const dirForm = await getRaw(server.url, "/old/");
    assert.strictEqual(dirForm.status, 200);
    assert.strictEqual(dirForm.body, "<p>old</p>", "/old/ must serve old/index.html");

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

/* The rule this server got wrong once. Pages owns the extensionless path and
   308s the .html URL to it, so a generator that emits the directory form
   turns every canonical into a redirect. Measured on the live site:
   /404.html -> /404, /index.html -> /, /enfj/index.html -> /enfj/. */
test("the test server redirects a .html URL to the extensionless path, as Pages does", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const page = await getRaw(server.url, "/enfj.html");
    assert.strictEqual(page.status, 308, "/enfj.html must redirect, not serve");
    assert.strictEqual(page.location, "/enfj");

    const notFound = await getRaw(server.url, "/404.html");
    assert.strictEqual(notFound.status, 308);
    assert.strictEqual(notFound.location, "/404");

    const root = await getRaw(server.url, "/index.html");
    assert.strictEqual(root.status, 308);
    assert.strictEqual(root.location, "/", "/index.html belongs to /, not to /index");

    const dirForm = await getRaw(server.url, "/old/index.html");
    assert.strictEqual(dirForm.status, 308);
    assert.strictEqual(dirForm.location, "/old/", "the directory form keeps its trailing slash");

    /* A .html URL with no file behind it is still a 404, not a redirect. */
    const missing = await getRaw(server.url, "/nope.html");
    assert.strictEqual(missing.status, 404);
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
  /* A canary file one directory above root, reachable with a single "..".
     A literal path like "/../../etc/passwd" is not a portable proof: how
     many ".." it takes to reach a real filesystem file depends on how deep
     os.tmpdir() nests on the machine running the test (two levels reaches
     real /etc on a typical Linux /tmp, but not on macOS's deeper
     /var/folders/... tmpdir, verified by hand on this checkout). A sibling
     temp directory is exactly one level up from root on every platform. */
  const canaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "a3-canary-"));
  fs.writeFileSync(path.join(canaryDir, "secret.txt"), "should not be reachable");
  const escapePath = "/../" + path.basename(canaryDir) + "/secret.txt";
  try {
    /* Unit-level proof that the guard in resolveFile fires: fetch() would
       normalize this path before the server ever saw it, which would make
       an equivalent assertion pass even with the guard clause deleted. */
    assert.strictEqual(
      serve.resolveFile(dir, escapePath), null,
      "resolveFile must not resolve a path outside its root"
    );

    /* Over-the-wire proof, sent unnormalized via http.request. */
    const escaped = await rawGet(server.port, escapePath);
    assert.strictEqual(escaped.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(canaryDir, { recursive: true, force: true });
  }
});

test("a malformed percent-encoded path 404s instead of crashing the server", async () => {
  const dir = fixture();
  const server = await serve.start(dir);
  try {
    const malformed = await get(server.url, "/%");
    assert.strictEqual(malformed.status, 404, "malformed percent-encoding must 404, not throw");

    /* The part that matters: the server must still be alive and serving
       afterward, not dead from an uncaught exception in the request
       callback. */
    const stillAlive = await get(server.url, "/");
    assert.strictEqual(stillAlive.body, "<p>root</p>", "the server must still serve requests after a malformed one");
  } finally {
    await server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
