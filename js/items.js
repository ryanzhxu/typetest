(function (root) {
  "use strict";
  var SG = root.SG;

  /* Self-authored throughout. `a` is the first pole, `b` the second.

     `show` names the one pole that appears on screen. Both are still written,
     because the pair is how each item was designed and how its opposite is
     checked, but the reader sees one statement and says how much they agree.

     The split is not decoration. Every item here is keyed the same way, with
     `a` always the first pole letter, so showing `a` throughout would make
     agreement mean E, S, T and J on all thirty-six core items. An agreeable
     reader would come out ESTJ whoever they were. Splitting the direction
     roughly evenly cancels that in the axis mean. test/items.test.js holds the
     balance to within one per axis, and holds the four poles that read as
     fragments alone off the screen entirely. */

  var core = [
    { id: "EI1", axis: "EI", show: "a", a: "Talking is how I work a thing out.", b: "I work it out, then I talk." },
    { id: "EI2", axis: "EI", show: "b", a: "A room full of strangers is an opportunity.", b: "A room full of strangers is a countdown." },
    { id: "EI3", axis: "EI", show: "a", a: "I recharge around people.", b: "I recharge away from people." },
    { id: "EI4", axis: "EI", show: "b", a: "Silence in a conversation needs filling.", b: "Silence in a conversation is fine." },
    { id: "EI5", axis: "EI", show: "a", a: "I will say the half-formed idea.", b: "I will wait until it is finished." },
    { id: "EI6", axis: "EI", show: "b", a: "My weekend was good if it was full.", b: "My weekend was good if it was quiet." },
    { id: "EI7", axis: "EI", show: "a", a: "I answer the phone.", b: "I let it ring and text back." },
    { id: "EI8", axis: "EI", show: "b", a: "Group chats are where I am funniest.", b: "One to one is where I am funniest." },
    { id: "EI9", axis: "EI", show: "a", a: "I meet new people easily and often.", b: "I keep a small circle on purpose." },

    { id: "SN1", axis: "SN", show: "a", a: "Show me what is actually there.", b: "Show me what it could turn into." },
    { id: "SN2", axis: "SN", show: "b", a: "Give me the steps in order.", b: "Give me the shape, I will fill it in." },
    { id: "SN3", axis: "SN", show: "a", a: "I trust what I can check.", b: "I trust what I can sense." },
    { id: "SN4", axis: "SN", show: "a", a: "Details are satisfying.", b: "Details are somebody else's problem." },
    { id: "SN5", axis: "SN", show: "b", a: "I remember what happened.", b: "I remember what it meant." },
    { id: "SN6", axis: "SN", show: "b", a: "A proven method is a good method.", b: "A proven method is a starting point." },
    { id: "SN7", axis: "SN", show: "a", a: "I describe things literally.", b: "I describe things by comparison." },
    { id: "SN8", axis: "SN", show: "b", a: "The present is plenty to think about.", b: "I am usually somewhere in next year." },
    { id: "SN9", axis: "SN", show: "a", a: "Instructions are for following.", b: "Instructions are for skimming." },

    { id: "TF1", axis: "TF", show: "a", a: "Decide it on the merits.", b: "Decide it on who it lands on." },
    { id: "TF2", axis: "TF", show: "b", a: "Being right matters more than being liked.", b: "Being liked matters more than being right." },
    { id: "TF3", axis: "TF", show: "a", a: "I give the honest answer first.", b: "I give the kind answer first." },
    { id: "TF4", axis: "TF", show: "b", a: "Feelings are data, not a verdict.", b: "Feelings are the whole point." },
    { id: "TF5", axis: "TF", show: "a", a: "I can argue a position I disagree with.", b: "Arguing against my own view feels wrong." },
    { id: "TF6", axis: "TF", show: "b", a: "Fair means the same rule for everyone.", b: "Fair means accounting for the person." },
    { id: "TF7", axis: "TF", show: "a", a: "Criticism is useful.", b: "Criticism lands hard and stays." },
    { id: "TF8", axis: "TF", show: "b", a: "I notice the flaw in the plan.", b: "I notice who is uncomfortable with the plan." },
    { id: "TF9", axis: "TF", show: "a", a: "Logic settles it.", b: "Something still has to feel right." },

    { id: "JP1", axis: "JP", show: "a", a: "Settle it now and move on.", b: "Leave it open a while longer." },
    { id: "JP2", axis: "JP", show: "a", a: "A plan is a comfort.", b: "A plan is a cage." },
    { id: "JP3", axis: "JP", show: "b", a: "I finish early.", b: "I finish at the last possible moment." },
    { id: "JP4", axis: "JP", show: "b", a: "Unmade decisions bother me.", b: "Unmade decisions keep options alive." },
    { id: "JP5", axis: "JP", show: "a", a: "I like knowing what Saturday holds.", b: "I like Saturday deciding itself." },
    { id: "JP6", axis: "JP", show: "b", a: "A list is how I hold the day.", b: "A list is how I lose the day." },
    { id: "JP7", axis: "JP", show: "a", a: "Changed plans are a small loss.", b: "Changed plans are a small gift." },
    { id: "JP8", axis: "JP", show: "b", a: "I pack days before.", b: "I pack the morning of." },
    { id: "JP9", axis: "JP", show: "a", a: "Done beats open.", b: "Open beats done." }
  ];

  var tiebreak = [
    { id: "EI-t1", axis: "EI", show: "a", a: "After a great party I want more.", b: "After a great party I want silence." },
    { id: "EI-t2", axis: "EI", show: "b", a: "I think best out loud with someone.", b: "I think best alone on paper." },
    { id: "EI-t3", axis: "EI", show: "a", a: "Being the only one talking is fine.", b: "Being the only one talking is a nightmare." },
    { id: "EI-t4", axis: "EI", show: "a", a: "I would host.", b: "I would attend, briefly." },
    { id: "EI-t5", axis: "EI", show: "b", a: "A weekend alone would be a waste.", b: "A weekend alone would be a treat." },
    { id: "EI-t6", axis: "EI", show: "b", a: "I introduce myself first.", b: "I wait to be introduced." },
    { id: "EI-t7", axis: "EI", show: "a", a: "Working in a busy room helps me.", b: "Working in a busy room ruins me." },
    { id: "EI-t8", axis: "EI", show: "b", a: "I like being known by many people.", b: "I like being known by a few, well." },

    { id: "SN-t1", axis: "SN", show: "a", a: "I would rather fix it than reimagine it.", b: "I would rather reimagine it than fix it." },
    { id: "SN-t2", axis: "SN", show: "b", a: "What is it for comes first.", b: "What could it be comes first." },
    { id: "SN-t3", axis: "SN", show: "a", a: "A good idea is one that works now.", b: "A good idea is one that could work." },
    { id: "SN-t4", axis: "SN", show: "a", a: "I read the manual.", b: "I press buttons." },
    { id: "SN-t5", axis: "SN", show: "b", a: "Facts settle arguments.", b: "Patterns settle arguments." },
    { id: "SN-t6", axis: "SN", show: "b", a: "I notice what changed in the room.", b: "I notice what the room reminds me of." },
    { id: "SN-t7", axis: "SN", show: "a", a: "Realistic is a compliment.", b: "Realistic is a warning." },
    { id: "SN-t8", axis: "SN", show: "b", a: "I would rather build it right.", b: "I would rather build it strange." },

    { id: "TF-t1", axis: "TF", show: "a", a: "I would tell a friend their idea is bad.", b: "I would find a way around saying it." },
    { id: "TF-t2", axis: "TF", show: "b", a: "A rule broken for a good reason is still broken.", b: "A rule broken for a good reason was a bad rule." },
    { id: "TF-t3", axis: "TF", show: "a", a: "I can hear that I am wrong without flinching.", b: "Being told I am wrong takes me a day." },
    { id: "TF-t4", axis: "TF", show: "b", a: "Harmony is nice, accuracy is necessary.", b: "Accuracy is nice, harmony is necessary." },
    { id: "TF-t5", axis: "TF", show: "a", a: "I would make the unpopular call.", b: "I would look for the call everyone can live with." },
    { id: "TF-t6", axis: "TF", show: "b", a: "My first question is whether it holds up.", b: "My first question is who it hurts." },
    { id: "TF-t7", axis: "TF", show: "a", a: "I trust the analysis over the room.", b: "I trust the room over the analysis." },
    { id: "TF-t8", axis: "TF", show: "b", a: "Sentiment clouds judgment.", b: "Judgment without sentiment is worse." },

    { id: "JP-t1", axis: "JP", show: "a", a: "An empty calendar is unsettling.", b: "An empty calendar is the point." },
    { id: "JP-t2", axis: "JP", show: "b", a: "I would rather decide wrong than not decide.", b: "I would rather wait than decide wrong." },
    { id: "JP-t3", axis: "JP", show: "a", a: "Deadlines are when I finish.", b: "Deadlines are when I start." },
    { id: "JP-t4", axis: "JP", show: "a", a: "I tidy before I work.", b: "I tidy instead of working, later." },
    { id: "JP-t5", axis: "JP", show: "b", a: "Routine frees me.", b: "Routine flattens me." },
    { id: "JP-t6", axis: "JP", show: "a", a: "I book the restaurant.", b: "I see what we feel like." },
    { id: "JP-t7", axis: "JP", show: "b", a: "Half-done things nag at me.", b: "Half-done things are just paused." },
    { id: "JP-t8", axis: "JP", show: "b", a: "I want the itinerary.", b: "I want the flight and nothing else." }
  ];

  /* Every item carries a stable id, and the id is what a locale dictionary
     keys its translation on. Position would not do: renumbering the file
     would silently re-point every translated statement at a different
     question, and nothing downstream would notice. */
  SG.items = {
    AXES: ["EI", "SN", "TF", "JP"],
    POLES: { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] },
    core: core,
    tiebreak: tiebreak
  };
}(typeof window !== "undefined" ? window : globalThis));
