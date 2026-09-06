/* Namespace shim. Works as a classic <script> in the browser and as a
   require() target under Node, so the shipped source is the tested source. */
(function (root) {
  "use strict";
  root.SG = root.SG || {};
}(typeof window !== "undefined" ? window : globalThis));
