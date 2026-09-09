"use strict";
const test = require("node:test");
const assert = require("node:assert");

require("../js/ns.js");
require("../js/i18n.js");
require("../js/locale-en.js");
require("../js/locale-zh-cn.js");
require("../js/locale-zh-tw.js");
require("../js/locale-zh-hk.js");
require("../js/types.js");
const I18N = globalThis.SG.i18n;

test("English is the fallback, so a locale can ship in stages", () => {
  /* This is the whole staging plan: a Chinese page renders its Chinese name
     and its Chinese chrome today, and the English prose shows through until
     that prose is written, rather than a key or an empty box. */
  assert.strictEqual(I18N.t("intro.start", "zh-hk"), "開始");
  assert.strictEqual(I18N.t("seo.rootTitle", "en"), "Personality");
  assert.strictEqual(I18N.t("nothing.here.at.all", "zh-hk"), "nothing.here.at.all",
    "a key that exists in no locale must render as itself, not as undefined");
});

test("a type merges the locale's overrides onto the English base", () => {
  const base = globalThis.SG.types.byCode.ISFJ;
  const hk = I18N.type("ISFJ", "zh-hk");
  assert.strictEqual(hk.name, "避風塘", "the name is the locale's");
  /* The celebrity names are deferred by decision and stay English in every
     locale, so they are the field that proves the fallback still works. The
     prose used to serve here and no longer can: it is translated now. */
  assert.deepStrictEqual(hk.often, base.often, "an unwritten field falls back to English");
  assert.strictEqual(base.name, "Safe Harbour",
    "merging must not write through to the English base");
  assert.notStrictEqual(hk.opening, base.opening, "a written field must win over the base");
});

test("the progress line spells numerals in English and uses digits in Chinese", () => {
  /* Spelled-out numerals read as formal or archaic in Chinese where a digit
     reads as plain modern prose, which is the opposite of what the English
     words are doing. */
  assert.strictEqual(I18N.progress(0, 36, "en"), "Zero down, thirty-six to go");
  assert.strictEqual(I18N.progress(35, 1, "en"), "Thirty-five down, one to go");
  assert.strictEqual(I18N.progress(9, 27, "zh-hk"), "已完成 9 題，尚餘 27 題");
  assert.strictEqual(I18N.progress(9, 27, "zh-cn"), "已完成 9 题，还剩 27 题");
});

test("a template keeps its pieces in the order its own language wants", () => {
  assert.strictEqual(I18N.format("seo.title", { name: "Deep Water", code: "INTJ" }, "en"),
    "Deep Water (INTJ)");
  assert.strictEqual(I18N.format("seo.title", { name: "深潭", code: "INTJ" }, "zh-hk"),
    "深潭（INTJ）", "Chinese uses full-width brackets, not a space and an ASCII pair");
});

test("an unfilled placeholder is left alone rather than blanked", () => {
  /* Blanking would produce a sentence that reads fine and is missing a fact.
     Leaving the brace in makes the bug visible the first time anyone looks. */
  assert.strictEqual(I18N.fill("a {one} b {two}", { one: "X" }), "a X b {two}");
});

test("English is the site root and every other locale is one segment deep", () => {
  assert.strictEqual(I18N.pathFor("en", "/enfj"), "/enfj");
  assert.strictEqual(I18N.pathFor("en", "/"), "/");
  assert.strictEqual(I18N.pathFor("zh-hk", "/enfj"), "/zh-hk/enfj");
  /* A locale root is a directory, and Cloudflare Pages 308s /zh-hk to
     /zh-hk/, so the trailing slash is what keeps every canonical and every
     link off a redirect. */
  assert.strictEqual(I18N.pathFor("zh-hk", "/"), "/zh-hk/");
});

test("reading a locale back out of a path is the exact inverse of writing it", () => {
  ["/", "/enfj", "/istp"].forEach((rest) => {
    I18N.SUPPORTED.forEach((loc) => {
      const url = I18N.pathFor(loc, rest);
      assert.strictEqual(I18N.localeFromPath(url), loc, url + " lost its locale");
      assert.strictEqual(I18N.pathWithoutLocale(url), rest, url + " lost its page");
    });
  });
});

test("an unknown first segment is English, not a fifth locale", () => {
  /* /enfj must never be read as a locale named enfj. */
  assert.strictEqual(I18N.localeFromPath("/enfj"), "en");
  assert.strictEqual(I18N.localeFromPath("/zh-yue/enfj"), "en");
  assert.strictEqual(I18N.localeFromPath("/en/enfj"), "en",
    "English has no prefix of its own, so /en/ is not one");
  assert.strictEqual(I18N.pathWithoutLocale("/enfj"), "/enfj");
});

test("apply falls back to English rather than accepting a locale that does not exist", () => {
  assert.strictEqual(I18N.apply("zh-hk"), "zh-hk");
  assert.strictEqual(I18N.apply("klingon"), "en");
  I18N.apply("en");
});

test("only a locale that says so is complete, and English always is", () => {
  assert.ok(I18N.isComplete("en"));
  assert.deepStrictEqual(I18N.completed(), I18N.SUPPORTED.filter((l) => I18N.isComplete(l)));
  assert.strictEqual(I18N.completed()[0], "en", "English must lead, it is the x-default");
});

test("every supported locale has a BCP-47 tag and names itself in its own language", () => {
  /* A bare zh-Hant would misrepresent the content: Hong Kong and Taiwan
     diverge on vocabulary, so a page has to say which one it is. */
  I18N.SUPPORTED.forEach((loc) => {
    const tag = I18N.HTML_LANG[loc];
    assert.ok(tag, loc + " has no lang tag");
    assert.notStrictEqual(tag, "zh-Hant", "zh-Hant alone does not say which Traditional");
    assert.notStrictEqual(tag, "zh", loc + " must name a script or a region");
    assert.ok(I18N.NAME[loc], loc + " has no name for the switcher");
  });
  assert.strictEqual(new Set(Object.values(I18N.HTML_LANG)).size, I18N.SUPPORTED.length,
    "two locales share a lang tag");
  assert.strictEqual(new Set(Object.values(I18N.NAME)).size, I18N.SUPPORTED.length,
    "two locales are offered under the same name");
});

test("the switcher shows a name and nothing else", () => {
  /* The unfinished note moved onto the page it describes. Putting it back
     beside each name takes the control from one row to three at 320px. */
  I18N.SUPPORTED.forEach((loc) => {
    assert.strictEqual(I18N.label(loc), I18N.NAME[loc], loc + " carries a suffix");
  });
});

test("an unfinished locale has a notice, written in its own language", () => {
  I18N.SUPPORTED.filter((loc) => !I18N.isComplete(loc)).forEach((loc) => {
    const notice = I18N.t("lang.unfinished", loc);
    assert.ok(/[㐀-䶿一-鿿]/.test(notice), loc + " explains itself in English");
    assert.notStrictEqual(notice, I18N.t("lang.unfinished", "en"), loc + " kept the English notice");
  });
});
