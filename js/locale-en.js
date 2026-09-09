(function (root) {
  "use strict";
  var SG = root.SG;

  /* English is the source of truth for meaning. Every other locale is written
     by hand against this file, never generated from it and never generated
     from each other: a glyph converter changes characters, not vocabulary,
     and would happily produce 履历 where the Simplified word is 简历.

     types.* here carries only the two fields a locale overrides today. The
     English prose itself stays in js/types.js, which is what js/i18n.js
     merges a locale's overrides onto. */
  SG.i18n.register("en", {
    meta: { complete: true, offered: true },

    brand: "Personality",
    nav: { sixteen: "See all sixteen" },
    /* unfinished is never shown in English, which is always complete, but the
       key has to exist here: this file is the inventory every other locale is
       checked against. */
    lang: { label: "Language", unfinished: "This translation is not finished yet." },

    intro: {
      eyebrow: "A four-letter personality test",
      title: "Personality",
      lede: "Thirty-six questions on a seven-point scale. If two types are genuinely close for you, we say so instead of guessing.",
      start: "Start",
      note: "No account. Nothing saved. Nothing sent anywhere."
    },

    question: {
      heading: "Question",
      progress: "{done} down, {left} to go",
      agree: "Agree",
      disagree: "Disagree",
      scaleLabel: "How much do you agree with this statement",
      back: "Back",
      next: "Next",
      finish: "See your result"
    },

    /* The middle reads "Somewhere in between" and not "Neither". Every one of
       the seven is a real answer, and "Neither" would read as the one that is
       not. */
    feedback: {
      1: "Strongly agree",
      2: "Agree",
      3: "Slightly agree",
      4: "Somewhere in between",
      5: "Slightly disagree",
      6: "Disagree",
      7: "Strongly disagree"
    },

    reveal: {
      alsoIn: "is in you too.",
      settle: "Settle it",
      keepBoth: "Keep both",
      continue: "Continue"
    },

    /* best and undone take the type's own clause. They are templates rather
       than a prefix glued on at the call site because Chinese puts the pieces
       in a different order. Expect to revisit the Chinese shape when the
       clauses themselves are written: a fragment that reads well after "You
       are at your best" may want a different frame in Chinese. */
    type: {
      backToGallery: "Back to the sixteen",
      best: "You are at your best {clause}",
      undone: "You come undone {clause}",
      oftenLabel: "Often typed this way",
      asterisk: "These are guesses, and we would rather say so. Not one of these people has sat the official test and published the result. Every celebrity list on the internet, ours included, is fans voting on strangers. Enjoy it as that.",
      ctaLine: "Not sure this is you?",
      takeTest: "Take the test",
      shareLabel: "Save a card with your result.",
      share: "Share your card",
      restart: "Start over"
    },

    sections: {
      good: "What you are good at",
      snags: "What gets in your way",
      closeUp: "Close up",
      work: "At work",
      oneThing: "The one thing"
    },

    gallery: {
      back: "Back",
      title: "All sixteen",
      note: "No colour by type here. Names and words carry it."
    },

    seo: {
      rootTitle: "Personality",
      rootDescription: "A four-letter test that tells you which second type is living in your result.",
      title: "{name} ({code})",
      description: "{line} What {code} looks like up close, and the second type that lives in it."
    },

    types: {
      ENFJ: { name: "Warm Front",        line: "The room gets easier when they walk in." },
      ENFP: { name: "Wildflower",        line: "Six new plans and genuine love for all of them." },
      ENTJ: { name: "Full Throttle",     line: "Has already decided. Is being polite about it." },
      ENTP: { name: "Sparks Fly",        line: "Will argue your own point back at you, better." },
      ESFJ: { name: "The Glue",          line: "The group chat would have died without them." },
      ESFP: { name: "The Encore",        line: "Leaves last, and the night was better for it." },
      ESTJ: { name: "The Straight Line", line: "Shortest route, stated out loud, twice." },
      ESTP: { name: "No Brakes",         line: "Says yes first, reads the details never." },
      INFJ: { name: "The Quiet Read",    line: "Clocks the room before they are through the door." },
      INFP: { name: "Soft Focus",        line: "Feels it all week. Mentions it on Friday." },
      INTJ: { name: "Deep Water",        line: "Three moves ahead, saying none of them." },
      INTP: { name: "The Rabbit Hole",   line: "Went to check one thing. Gone four hours." },
      ISFJ: { name: "Safe Harbour",      line: "Remembers how you take your tea. Since 2019." },
      ISFP: { name: "Slow Sunday",       line: "Not late. Simply not in a hurry." },
      ISTJ: { name: "The Backbone",      line: "Said they would. Therefore they will." },
      ISTP: { name: "The Fixer",         line: "Has the thing in pieces. Do not panic." }
    }
  });
}(typeof window !== "undefined" ? window : globalThis));
