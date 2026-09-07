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

function resolveFile(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = path.resolve(root, "." + (clean === "/" ? "/index.html" : clean));
  if (target !== root && !target.startsWith(root + path.sep)) { return null; }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) { return target; }
  const asDir = path.join(target, "index.html");
  if (fs.existsSync(asDir) && fs.statSync(asDir).isFile()) { return asDir; }
  return null;
}

function start(dir) {
  const root = path.resolve(dir);
  const server = http.createServer(function (req, res) {
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

module.exports = { start, resolveFile };

if (require.main === module) {
  start(process.argv[2] || "public").then(function (s) {
    process.stdout.write("serving " + path.resolve(process.argv[2] || "public") + " at " + s.url + "\n");
  });
}
