(function (root) {
  "use strict";
  var SG = root.SG;

  document.addEventListener("DOMContentLoaded", function () {
    SG.render.mount(SG.flow.create());
  });
}(typeof window !== "undefined" ? window : globalThis));
