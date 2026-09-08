(function (root) {
  "use strict";
  var SG = root.SG;

  document.addEventListener("DOMContentLoaded", function () {
    /* Before mount, so the first render already knows which language it is
       painting. The generator has stamped data-lang on every page it emits,
       and js/i18n.js reads that rather than localStorage or navigator: the
       address bar is what decides the language on this site. */
    SG.i18n.init();
    SG.render.mount(SG.flow.create());
  });
}(typeof window !== "undefined" ? window : globalThis));
