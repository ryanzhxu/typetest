(function (root) {
  "use strict";
  var SG = root.SG;

  var DEFAULT = "en";

  /* The internal ids are also URL path segments, which is why they are short
     and lower case. English is the site root and has no segment of its own.
     The order here is the order the switcher offers them in. */
  var SUPPORTED = ["en", "zh-cn", "zh-hk", "zh-tw"];

  /* What goes in <html lang>, and what a screen reader and a search engine
     actually read. Never a bare zh-Hant: Hong Kong and Taiwan diverge on
     vocabulary (質素/品質, 網絡/網路, 軟件/軟體), so a page has to say which
     one it is. */
  var HTML_LANG = {
    "en": "en",
    "zh-cn": "zh-Hans-CN",
    "zh-tw": "zh-Hant-TW",
    "zh-hk": "zh-Hant-HK"
  };

  /* What the switcher calls each locale, and the one rule every authority
     agrees on: each name is written in its own script. 中国大陆 is in
     Simplified because that is what it links to; 香港 and 台灣 are in
     Traditional for the same reason. Writing 台湾 here, in Simplified, would
     be the single most visible error on the control.

     Region names rather than script names, which is what Apple's own chooser
     does. Naming the script instead (简体中文 / 繁體中文) forces a region into
     brackets to tell Hong Kong from Taiwan, and that took the row from 44px
     to 132px on a 320px phone. Region implies script unambiguously for these
     three, so nothing is lost. What matters is that all four are the same
     kind of thing: a list mixing a script name with a region name leaves a
     reader unable to tell which one means Hong Kong. */
  var NAME = {
    "en": "English",
    "zh-cn": "中国大陆",
    "zh-hk": "香港",
    "zh-tw": "台灣"
  };

  var dicts = {};
  var current = DEFAULT;

  function register(locale, dict) { dicts[locale] = dict; }

  function lookup(dict, key) {
    if (!dict) { return undefined; }
    return key.split(".").reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, dict);
  }

  /* English is the source of truth for meaning, so it is also the fallback.
     A locale being written in stages therefore renders English where its own
     words do not exist yet, rather than rendering a key. */
  function t(key, locale) {
    var value = lookup(dicts[locale || current], key);
    if (value === undefined) { value = lookup(dicts[DEFAULT], key); }
    return value === undefined ? key : value;
  }

  /* {name} placeholders, filled from a plain object. Chinese and English put
     the same pieces in different orders, which is the whole reason the copy
     holds a template rather than being concatenated at the call site. */
  function fill(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function (whole, name) {
      return Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole;
    });
  }

  function format(key, values, locale) {
    return fill(t(key, locale), values || {});
  }

  /* ---- numbers ---- */

  var ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"
  ];
  var TENS = ["", "", "twenty", "thirty"];

  /* Number to words, 0 through 36, so English progress reads like a person
     talking and never like a counter. Chinese does the opposite: spelled-out
     numerals (三十六) read as formal or archaic where a digit reads as plain
     modern prose, so every Chinese locale uses the digit. */
  function numberWords(n) {
    if (n < 20) { return ONES[n]; }
    var ten = Math.floor(n / 10);
    var one = n % 10;
    return one === 0 ? TENS[ten] : TENS[ten] + "-" + ONES[one];
  }

  function numeral(n, locale) {
    return (locale || current) === "en" ? numberWords(n) : String(n);
  }

  /* Upper-casing a CJK character returns the same character, so this is a
     no-op in three of the four locales and needs no branch. */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function progress(done, left, locale) {
    var loc = locale || current;
    return cap(format("question.progress", {
      done: numeral(done, loc),
      left: numeral(left, loc)
    }, loc));
  }

  /* ---- types ---- */

  /* The English type in js/types.js is the base; a locale dictionary carries
     only the fields it has words for yet. Merging here rather than at each
     call site is what lets the Chinese locales ship a name and a one-liner
     before the five long sections are written. */
  function type(code, locale) {
    var base = SG.types.byCode[code];
    if (!base) { return null; }
    var over = lookup(dicts[locale || current], "types." + code);
    if (!over) { return base; }
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    return out;
  }

  /* The statement a reader sees, in their language. js/items.js keys every
     item, and a locale dictionary carries one string per id: the shown pole
     and only that one. The unshown pole is a design record, checked at build
     time and never rendered, so it stays English in every locale. */
  function statement(item, locale) {
    if (!item) { return ""; }
    var own = lookup(dicts[locale || current], "items." + item.id);
    return typeof own === "string" ? own : item[item.show];
  }

  function sections(locale) {
    return SG.types.SECTIONS.map(function (s) {
      return { key: s.key, heading: t("sections." + s.key, locale) };
    });
  }

  /* Two questions, not one, and they have different answers while a locale is
     being written.

     meta.complete asks whether a search engine should be told about it. Until
     it is true the locale's pages carry noindex, stay out of sitemap.xml, and
     appear in no hreflang set: a half-translated page in the index is worse
     than no page at all.

     meta.offered asks whether a reader should be able to click to it. That
     can be true first, and for the review pass it has to be: the only way to
     get a native read of a locale is for someone to be able to reach it. An
     offered locale that is not complete is labelled as such in the switcher,
     in its own language, so nobody arrives thinking it is finished. */
  function isComplete(locale) {
    return locale === DEFAULT || lookup(dicts[locale], "meta.complete") === true;
  }

  function completed() {
    return SUPPORTED.filter(isComplete);
  }

  function isOffered(locale) {
    return locale === DEFAULT || lookup(dicts[locale], "meta.offered") === true;
  }

  function offered() {
    return SUPPORTED.filter(isOffered);
  }

  /* The switcher shows the name and nothing else. An unfinished locale used to
     carry its note here, and that note is what pushed the control to three
     rows: the warning now lives on the unfinished page itself, where it is
     read by the person who actually landed there rather than by everyone who
     did not. */
  function label(locale) { return NAME[locale]; }

  /* ---- URLs ---- */

  /* English is the root, every other locale is one segment deep. Both
     directions live here so a path and the locale it means cannot drift. */
  function prefixFor(locale) {
    return locale === DEFAULT ? "" : "/" + locale;
  }

  function localeFromPath(pathname) {
    var seg = String(pathname || "/").split("/")[1] || "";
    return (seg !== DEFAULT && SUPPORTED.indexOf(seg) !== -1) ? seg : DEFAULT;
  }

  /* The path with its locale segment taken off: "/zh-hk/enfj" and "/enfj"
     both give "/enfj", and both roots give "/". */
  function pathWithoutLocale(pathname) {
    var p = String(pathname || "/");
    var loc = localeFromPath(p);
    if (loc === DEFAULT) { return p || "/"; }
    var rest = p.slice(("/" + loc).length);
    return rest === "" ? "/" : rest;
  }

  /* rest is a locale-free path: "/" or "/enfj". */
  function pathFor(locale, rest) {
    var tail = rest === "/" || !rest ? "/" : rest;
    return prefixFor(locale) + tail;
  }

  /* ---- applying ---- */

  function applyTo(doc, locale) {
    doc.documentElement.lang = HTML_LANG[locale] || locale;
    /* Lets the stylesheet pick a CJK face without knowing which Chinese. */
    doc.documentElement.setAttribute("data-lang", locale);

    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n]"), function (el) {
      var value = t(el.getAttribute("data-i18n"), locale);
      /* textContent, never innerHTML. A translation is content, not markup,
         and innerHTML here is an XSS hole the day a string arrives from
         anywhere less trusted than this repo. */
      if (typeof value === "string") { el.textContent = value; }
    });

    /* data-i18n-attr="aria-label:question.scaleLabel" */
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":");
        var value = t(bits.slice(1).join(":").trim(), locale);
        if (typeof value === "string") { el.setAttribute(bits[0].trim(), value); }
      });
    });
  }

  function apply(locale) {
    current = SUPPORTED.indexOf(locale) === -1 ? DEFAULT : locale;
    if (typeof document !== "undefined") { applyTo(document, current); }
    return current;
  }

  /* The URL decides, and nothing else. localStorage and navigator.languages
     are deliberately not consulted: the generator has already written this
     page in one language and stamped data-lang on it, and a runtime that
     disagreed with the address bar would serve Chinese under an English URL,
     which is the one thing the whole path-prefix scheme exists to prevent. */
  function detect(pathname) {
    if (pathname !== undefined) { return localeFromPath(pathname); }
    if (typeof document !== "undefined") {
      var stamped = document.documentElement.getAttribute("data-lang");
      if (SUPPORTED.indexOf(stamped) !== -1) { return stamped; }
    }
    if (typeof location !== "undefined") { return localeFromPath(location.pathname); }
    return DEFAULT;
  }

  function init() { return apply(detect()); }

  SG.i18n = {
    DEFAULT: DEFAULT,
    SUPPORTED: SUPPORTED,
    HTML_LANG: HTML_LANG,
    NAME: NAME,
    register: register,
    t: t,
    format: format,
    fill: fill,
    numeral: numeral,
    progress: progress,
    type: type,
    statement: statement,
    sections: sections,
    isComplete: isComplete,
    completed: completed,
    isOffered: isOffered,
    offered: offered,
    label: label,
    prefixFor: prefixFor,
    localeFromPath: localeFromPath,
    pathWithoutLocale: pathWithoutLocale,
    pathFor: pathFor,
    applyTo: applyTo,
    apply: apply,
    detect: detect,
    init: init,
    dict: function (locale) { return dicts[locale]; },
    get current() { return current; }
  };
}(typeof window !== "undefined" ? window : globalThis));
