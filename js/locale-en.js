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
      start: "Start"
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
       in a different order.

       The Chinese frames were revised once the first real clauses existed:
       they used to end in 的時候 while the clauses opened with 當 or 你, so
       the sentence said "the time when" twice, or "you" twice. A Chinese
       clause here opens with neither. */
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

    /* One string per item id, and only the pole that appears on screen. The
       other pole is a design record in js/items.js: it is how each item's
       opposite was checked, it never reaches a reader, and it stays English
       in every locale.

       These mirror js/items.js exactly, and test/locales.test.js fails if the
       two ever disagree. */
    items: {
      EI1: "Talking is how I work a thing out.",
      EI2: "A room full of strangers is a countdown.",
      EI3: "I recharge around people.",
      EI4: "Silence in a conversation is fine.",
      EI5: "I will say the half-formed idea.",
      EI6: "My weekend was good if it was quiet.",
      EI7: "I answer the phone.",
      EI8: "One to one is where I am funniest.",
      EI9: "I meet new people easily and often.",
      SN1: "Show me what is actually there.",
      SN2: "Give me the shape, I will fill it in.",
      SN3: "I trust what I can check.",
      SN4: "Details are satisfying.",
      SN5: "I remember what it meant.",
      SN6: "A proven method is a starting point.",
      SN7: "I describe things literally.",
      SN8: "I am usually somewhere in next year.",
      SN9: "Instructions are for following.",
      TF1: "Decide it on the merits.",
      TF2: "Being liked matters more than being right.",
      TF3: "I give the honest answer first.",
      TF4: "Feelings are the whole point.",
      TF5: "I can argue a position I disagree with.",
      TF6: "Fair means accounting for the person.",
      TF7: "Criticism is useful.",
      TF8: "I notice who is uncomfortable with the plan.",
      TF9: "Logic settles it.",
      JP1: "Settle it now and move on.",
      JP2: "A plan is a comfort.",
      JP3: "I finish at the last possible moment.",
      JP4: "Unmade decisions keep options alive.",
      JP5: "I like knowing what Saturday holds.",
      JP6: "A list is how I lose the day.",
      JP7: "Changed plans are a small loss.",
      JP8: "I pack the morning of.",
      JP9: "Done beats open.",
      "EI-t1": "After a great party I want more.",
      "EI-t2": "I think best alone on paper.",
      "EI-t3": "Being the only one talking is fine.",
      "EI-t4": "I would host.",
      "EI-t5": "A weekend alone would be a treat.",
      "EI-t6": "I wait to be introduced.",
      "EI-t7": "Working in a busy room helps me.",
      "EI-t8": "I like being known by a few, well.",
      "SN-t1": "I would rather fix it than reimagine it.",
      "SN-t2": "What could it be comes first.",
      "SN-t3": "A good idea is one that works now.",
      "SN-t4": "I read the manual.",
      "SN-t5": "Patterns settle arguments.",
      "SN-t6": "I notice what the room reminds me of.",
      "SN-t7": "Realistic is a compliment.",
      "SN-t8": "I would rather build it strange.",
      "TF-t1": "I would tell a friend their idea is bad.",
      "TF-t2": "A rule broken for a good reason was a bad rule.",
      "TF-t3": "I can hear that I am wrong without flinching.",
      "TF-t4": "Accuracy is nice, harmony is necessary.",
      "TF-t5": "I would make the unpopular call.",
      "TF-t6": "My first question is who it hurts.",
      "TF-t7": "I trust the analysis over the room.",
      "TF-t8": "Judgment without sentiment is worse.",
      "JP-t1": "An empty calendar is unsettling.",
      "JP-t2": "I would rather wait than decide wrong.",
      "JP-t3": "Deadlines are when I finish.",
      "JP-t4": "I tidy before I work.",
      "JP-t5": "Routine flattens me.",
      "JP-t6": "I book the restaurant.",
      "JP-t7": "Half-done things are just paused.",
      "JP-t8": "I want the flight and nothing else."
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
