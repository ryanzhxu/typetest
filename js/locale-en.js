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
      title: "{code} ({name})",
      description: "{line} What {code} looks like up close, and the second type that lives in it."
    },

    /* One string per item id, and only the pole that appears on screen. The
       other pole is a design record in js/items.js: it is how each item's
       opposite was checked, it never reaches a reader, and it stays English
       in every locale.

       These mirror js/items.js exactly, and test/locales.test.js fails if the
       two ever disagree. */
    items: {
      EI1: "You need to talk something through out loud before you can actually understand what you think about it.",
      EI2: "Walk into a room full of people you do not know, and you start quietly counting down the minutes until you can leave.",
      EI3: "Being around other people is what actually restores your energy, even after a long day.",
      EI4: "A long silence in the middle of a conversation does not bother you at all.",
      EI5: "You will blurt out a thought before it is even half formed, just to hear how it sounds.",
      EI6: "You count a weekend as a good one if it was quiet, with nothing much on the calendar.",
      EI7: "When your phone rings, you answer it without even glancing at who is calling.",
      EI8: "You are at your funniest one on one, not when you are performing for a whole group.",
      EI9: "Meeting new people comes easily to you, and you end up doing it often.",
      SN1: "You want to be shown what is actually, concretely there in front of you, not what it might become.",
      SN2: "Give you the general shape of something, and you are happy to work out the details yourself.",
      SN3: "You trust something once you can check it for yourself, and not really before then.",
      SN4: "There is something genuinely satisfying to you about getting every small detail right.",
      SN5: "What stays with you afterward is not the exact sequence of events, it is what the whole thing meant.",
      SN6: "A method that is already proven to work is, to you, just a starting point worth improving on.",
      SN7: "When you describe something, you describe it exactly as it is, without reaching for a comparison.",
      SN8: "Your mind is usually already living somewhere out in next year, even while you are doing something today.",
      SN9: "When there are instructions, your instinct is to follow them closely, step by step.",
      TF1: "You would rather decide something purely on its own merits, without factoring in who it will affect.",
      TF2: "Being liked by the people around you matters more to you than being proven right.",
      TF3: "Your first instinct is to give the honest answer, even before you have softened it.",
      TF4: "To you, how everyone feels about a situation is not a side issue, it is the whole point of it.",
      TF5: "You can build a genuinely strong case for a position you personally disagree with.",
      TF6: "To you, being fair means taking the specific person and their situation into account, not applying one rule to everyone.",
      TF7: "You see criticism as useful information, even when it is delivered bluntly.",
      TF8: "Before you notice a flaw in the plan itself, you notice who in the room feels uneasy about it.",
      TF9: "Once the logic checks out, that is enough to settle the matter for you.",
      JP1: "Once you have made a decision, you consider it made, and you do not enjoy reopening it.",
      JP2: "Having a plan in place is genuinely comforting to you, not something that feels restrictive.",
      JP3: "You tend to finish things right up against the deadline, not a moment before.",
      JP4: "Leaving a decision unmade feels less like indecision to you and more like keeping your options open.",
      JP5: "You like knowing ahead of time exactly what Saturday is going to look like.",
      JP6: "Once you write a list for the day, you can end up losing the whole day just managing the list.",
      JP7: "When plans change at the last minute, it registers to you as a small, genuine loss.",
      JP8: "You pack for a trip the morning you are leaving, not any earlier.",
      JP9: "Having something finished, even imperfectly, feels better to you than leaving it open.",
      "EI-t1": "After a great party winds down, you are the one wishing it would keep going.",
      "EI-t2": "You think most clearly when you are alone with a piece of paper, not talking it through with someone.",
      "EI-t3": "Being the only person talking in a room full of quiet listeners does not faze you at all.",
      "EI-t4": "Given the choice, you would rather be the one hosting the party than just attending it.",
      "EI-t5": "A whole weekend with no plans and nobody around sounds like a genuine treat to you.",
      "EI-t6": "At a gathering, you would rather wait to be introduced to someone than walk up and introduce yourself.",
      "EI-t7": "Working in a busy, noisy room actually helps you focus, rather than getting in the way.",
      "EI-t8": "You would rather be deeply known by a small handful of people than loosely known by many.",
      "SN-t1": "Given something broken, your instinct is to fix what is already there rather than reimagine it from scratch.",
      "SN-t2": "The first question in your head is what something could become, before you even ask what it is currently for.",
      "SN-t3": "To you, a good idea is one that could actually be put to work right now, not just someday.",
      "SN-t4": "Faced with something new, you sit down and read the manual before you touch a single button.",
      "SN-t5": "For you, an argument gets settled once someone points out the underlying pattern, not just the isolated facts.",
      "SN-t6": "Walking into a room, what you notice first is what it reminds you of, more than what is actually changed in it.",
      "SN-t7": "Being called realistic feels like a genuine compliment to you, not a criticism.",
      "SN-t8": "Given the choice, you would rather build something strange and untested than something safely conventional.",
      "TF-t1": "If a friend's idea is genuinely bad, you will tell them so, directly and without much cushioning.",
      "TF-t2": "If a rule had to be broken for a good enough reason, you conclude it was a bad rule all along.",
      "TF-t3": "Being told you are wrong does not rattle you, you can just sit with it and consider it.",
      "TF-t4": "Being accurate is nice to have, but keeping the peace in the room is the thing you actually consider necessary.",
      "TF-t5": "If it is the right call, you will make it even knowing it is going to be unpopular with the room.",
      "TF-t6": "The first question you ask about any decision is who it is going to hurt.",
      "TF-t7": "When the analysis and the mood in the room disagree, you side with the analysis.",
      "TF-t8": "A judgment made with no sentiment behind it at all strikes you as worse, not more objective.",
      "JP-t1": "Looking at a completely empty calendar makes you genuinely uneasy, rather than relieved.",
      "JP-t2": "Given the choice, you would rather wait a little longer than commit to a decision that turns out wrong.",
      "JP-t3": "A deadline, to you, is simply the moment when a piece of work finally gets finished.",
      "JP-t4": "You tidy your space before you can actually settle down and start working.",
      "JP-t5": "A routine that repeats for too long does not comfort you, it slowly flattens you.",
      "JP-t6": "In your group of friends, you are the one who actually books the restaurant.",
      "JP-t7": "A half-finished task does not nag at you, it just feels paused, waiting for you to pick it back up.",
      "JP-t8": "When you travel, you want the flight booked and nothing else decided in advance."
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
