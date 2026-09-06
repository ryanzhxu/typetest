(function (root) {
  "use strict";
  var SG = root.SG;

  /* Self-authored throughout. `a` is the first pole, `b` the second. */

  var core = [
    { axis: "EI", a: "Talking is how I work a thing out.", b: "I work it out, then I talk." },
    { axis: "EI", a: "A room full of strangers is an opportunity.", b: "A room full of strangers is a countdown." },
    { axis: "EI", a: "I recharge around people.", b: "I recharge away from people." },
    { axis: "EI", a: "Silence in a conversation needs filling.", b: "Silence in a conversation is fine." },
    { axis: "EI", a: "I will say the half-formed idea.", b: "I will wait until it is finished." },
    { axis: "EI", a: "My weekend was good if it was full.", b: "My weekend was good if it was quiet." },
    { axis: "EI", a: "I answer the phone.", b: "I let it ring and text back." },
    { axis: "EI", a: "Group chats are where I am funniest.", b: "One to one is where I am funniest." },
    { axis: "EI", a: "I meet new people easily and often.", b: "I keep a small circle on purpose." },

    { axis: "SN", a: "Show me what is actually there.", b: "Show me what it could turn into." },
    { axis: "SN", a: "Give me the steps in order.", b: "Give me the shape, I will fill it in." },
    { axis: "SN", a: "I trust what I can check.", b: "I trust what I can sense." },
    { axis: "SN", a: "Details are satisfying.", b: "Details are somebody else's problem." },
    { axis: "SN", a: "I remember what happened.", b: "I remember what it meant." },
    { axis: "SN", a: "A proven method is a good method.", b: "A proven method is a starting point." },
    { axis: "SN", a: "I describe things literally.", b: "I describe things by comparison." },
    { axis: "SN", a: "The present is plenty to think about.", b: "I am usually somewhere in next year." },
    { axis: "SN", a: "Instructions are for following.", b: "Instructions are for skimming." },

    { axis: "TF", a: "Decide it on the merits.", b: "Decide it on who it lands on." },
    { axis: "TF", a: "Being right matters more than being liked.", b: "Being liked matters more than being right." },
    { axis: "TF", a: "I give the honest answer first.", b: "I give the kind answer first." },
    { axis: "TF", a: "Feelings are data, not a verdict.", b: "Feelings are the whole point." },
    { axis: "TF", a: "I can argue a position I disagree with.", b: "Arguing against my own view feels wrong." },
    { axis: "TF", a: "Fair means the same rule for everyone.", b: "Fair means accounting for the person." },
    { axis: "TF", a: "Criticism is useful.", b: "Criticism lands hard and stays." },
    { axis: "TF", a: "I notice the flaw in the plan.", b: "I notice who is uncomfortable with the plan." },
    { axis: "TF", a: "Logic settles it.", b: "Something still has to feel right." },

    { axis: "JP", a: "Settle it now and move on.", b: "Leave it open a while longer." },
    { axis: "JP", a: "A plan is a comfort.", b: "A plan is a cage." },
    { axis: "JP", a: "I finish early.", b: "I finish at the last possible moment." },
    { axis: "JP", a: "Unmade decisions bother me.", b: "Unmade decisions keep options alive." },
    { axis: "JP", a: "I like knowing what Saturday holds.", b: "I like Saturday deciding itself." },
    { axis: "JP", a: "A list is how I hold the day.", b: "A list is how I lose the day." },
    { axis: "JP", a: "Changed plans are a small loss.", b: "Changed plans are a small gift." },
    { axis: "JP", a: "I pack days before.", b: "I pack the morning of." },
    { axis: "JP", a: "Done beats open.", b: "Open beats done." }
  ];

  var tiebreak = [
    { axis: "EI", a: "After a great party I want more.", b: "After a great party I want silence." },
    { axis: "EI", a: "I think best out loud with someone.", b: "I think best alone on paper." },
    { axis: "EI", a: "Being the only one talking is fine.", b: "Being the only one talking is a nightmare." },
    { axis: "EI", a: "I would host.", b: "I would attend, briefly." },
    { axis: "EI", a: "A weekend alone would be a waste.", b: "A weekend alone would be a treat." },
    { axis: "EI", a: "I introduce myself first.", b: "I wait to be introduced." },
    { axis: "EI", a: "Working in a busy room helps me.", b: "Working in a busy room ruins me." },
    { axis: "EI", a: "I like being known by many people.", b: "I like being known by a few, well." },

    { axis: "SN", a: "I would rather fix it than reimagine it.", b: "I would rather reimagine it than fix it." },
    { axis: "SN", a: "What is it for comes first.", b: "What could it be comes first." },
    { axis: "SN", a: "A good idea is one that works now.", b: "A good idea is one that could work." },
    { axis: "SN", a: "I read the manual.", b: "I press buttons." },
    { axis: "SN", a: "Facts settle arguments.", b: "Patterns settle arguments." },
    { axis: "SN", a: "I notice what changed in the room.", b: "I notice what the room reminds me of." },
    { axis: "SN", a: "Realistic is a compliment.", b: "Realistic is a warning." },
    { axis: "SN", a: "I would rather build it right.", b: "I would rather build it strange." },

    { axis: "TF", a: "I would tell a friend their idea is bad.", b: "I would find a way around saying it." },
    { axis: "TF", a: "A rule broken for a good reason is still broken.", b: "A rule broken for a good reason was a bad rule." },
    { axis: "TF", a: "I can hear that I am wrong without flinching.", b: "Being told I am wrong takes me a day." },
    { axis: "TF", a: "Harmony is nice, accuracy is necessary.", b: "Accuracy is nice, harmony is necessary." },
    { axis: "TF", a: "I would make the unpopular call.", b: "I would look for the call everyone can live with." },
    { axis: "TF", a: "My first question is whether it holds up.", b: "My first question is who it hurts." },
    { axis: "TF", a: "I trust the analysis over the room.", b: "I trust the room over the analysis." },
    { axis: "TF", a: "Sentiment clouds judgment.", b: "Judgment without sentiment is worse." },

    { axis: "JP", a: "An empty calendar is unsettling.", b: "An empty calendar is the point." },
    { axis: "JP", a: "I would rather decide wrong than not decide.", b: "I would rather wait than decide wrong." },
    { axis: "JP", a: "Deadlines are when I finish.", b: "Deadlines are when I start." },
    { axis: "JP", a: "I tidy before I work.", b: "I tidy instead of working, later." },
    { axis: "JP", a: "Routine frees me.", b: "Routine flattens me." },
    { axis: "JP", a: "I book the restaurant.", b: "I see what we feel like." },
    { axis: "JP", a: "Half-done things nag at me.", b: "Half-done things are just paused." },
    { axis: "JP", a: "I want the itinerary.", b: "I want the flight and nothing else." }
  ];

  SG.items = {
    AXES: ["EI", "SN", "TF", "JP"],
    POLES: { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] },
    core: core,
    tiebreak: tiebreak
  };
}(typeof window !== "undefined" ? window : globalThis));
