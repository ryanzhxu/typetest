"use strict";
/* Test and local-preview server. Zero dependencies. It exists because the
   deployed site is served over HTTP at real paths, and a file:// page cannot
   test /enfj, a 404, or the History API.

   It mimics Cloudflare Pages path resolution. That mimicry is an assumption,
   not a proof, which is why the plan also verifies the live site with curl
   after deploying. */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

/* What Pages actually does, measured on the live site rather than guessed:

     /                200, index.html
     /enfj            200, enfj.html          no trailing slash appended
     /enfj.html       308 -> /enfj
     /index.html      308 -> /
     /enfj/           200, enfj/index.html
     /enfj            308 -> /enfj/           when enfj is a DIRECTORY

   The last line is why the generator emits enfj.html and not enfj/index.html.
   Every canonical, every sitemap entry and every gallery href on this site
   says /enfj, and under the directory form all of them were redirects. A
   server that answered 200 to both forms could not see that, which is exactly
   what happened. */

function cleanPath(urlPath) {
  const rawPath = urlPath.split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(rawPath);
  } catch (e) {
    if (e instanceof URIError) { return null; }
    throw e;
  }
}

/* The traversal guard. Returns null for any path that leaves the root. */
function safeTarget(root, clean) {
  const target = path.resolve(root, "." + (clean === "/" ? "/index.html" : clean));
  if (target !== root && !target.startsWith(root + path.sep)) { return null; }
  return target;
}

function isFile(p) {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

function resolveFile(root, urlPath) {
  const clean = cleanPath(urlPath);
  if (clean === null) { return null; }
  const target = safeTarget(root, clean);
  if (target === null) { return null; }

  if (isFile(target)) { return target; }
  if (!clean.endsWith("/") && isFile(target + ".html")) { return target + ".html"; }
  const asDir = path.join(target, "index.html");
  if (isFile(asDir)) { return asDir; }
  return null;
}

/* Returns the Location for a request Pages answers with a 308, or null when
   the request is not a redirect. */
function redirectFor(root, urlPath) {
  const clean = cleanPath(urlPath);
  if (clean === null) { return null; }
  const target = safeTarget(root, clean);
  if (target === null) { return null; }

  /* The extensionless path owns the document, so the .html URL redirects. */
  if (clean.endsWith(".html") && isFile(target)) {
    const base = clean.slice(0, -".html".length);
    return base.endsWith("/index") ? base.slice(0, -"index".length) : base;
  }
  /* A directory gets its trailing slash appended, rather than being served at
     the bare path. */
  if (!clean.endsWith("/") && !isFile(target) && !isFile(target + ".html") &&
      isFile(path.join(target, "index.html"))) {
    return clean + "/";
  }
  return null;
}

function start(dir) {
  const root = path.resolve(dir);
  const server = http.createServer(function (req, res) {
    const redirect = redirectFor(root, req.url);
    if (redirect) {
      res.writeHead(308, { location: redirect });
      res.end();
      return;
    }
    const file = resolveFile(root, req.url);
    if (file) {
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
      return;
    }
    const notFound = path.join(root, "404.html");
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found";
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  });

  return new Promise(function (resolve) {
    server.listen(0, "127.0.0.1", function () {
      const port = server.address().port;
      resolve({
        port: port,
        url: "http://127.0.0.1:" + port,
        close: function () {
          return new Promise(function (done) { server.close(done); });
        }
      });
    });
  });
}

module.exports = { start, resolveFile, redirectFor };

if (require.main === module) {
  start(process.argv[2] || "public").then(function (s) {
    process.stdout.write("serving " + path.resolve(process.argv[2] || "public") + " at " + s.url + "\n");
  });
}
