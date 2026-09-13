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
    { id: "EI1", axis: "EI", show: "a", a: "You need to talk something through out loud before you can actually understand what you think about it.", b: "I work it out, then I talk." },
    { id: "EI2", axis: "EI", show: "b", a: "A room full of strangers is an opportunity.", b: "Walk into a room full of people you do not know, and you start quietly counting down the minutes until you can leave." },
    { id: "EI3", axis: "EI", show: "a", a: "Being around other people is what actually restores your energy, even after a long day.", b: "I recharge away from people." },
    { id: "EI4", axis: "EI", show: "b", a: "Silence in a conversation needs filling.", b: "A long silence in the middle of a conversation does not bother you at all." },
    { id: "EI5", axis: "EI", show: "a", a: "You will blurt out a thought before it is even half formed, just to hear how it sounds.", b: "I will wait until it is finished." },
    { id: "EI6", axis: "EI", show: "b", a: "My weekend was good if it was full.", b: "You count a weekend as a good one if it was quiet, with nothing much on the calendar." },
    { id: "EI7", axis: "EI", show: "a", a: "When your phone rings, you answer it without even glancing at who is calling.", b: "I check who it is before I decide." },
    { id: "EI8", axis: "EI", show: "b", a: "Group chats are where I am funniest.", b: "You are at your funniest one on one, not when you are performing for a whole group." },
    { id: "EI9", axis: "EI", show: "a", a: "Meeting new people comes easily to you, and you end up doing it often.", b: "I keep a small circle on purpose." },

    { id: "SN1", axis: "SN", show: "a", a: "You want to be shown what is actually, concretely there in front of you, not what it might become.", b: "Show me what it could turn into." },
    { id: "SN2", axis: "SN", show: "b", a: "Give me the steps in order.", b: "Give you the general shape of something, and you are happy to work out the details yourself." },
    { id: "SN3", axis: "SN", show: "a", a: "You trust something once you can check it for yourself, and not really before then.", b: "I trust what I can sense." },
    { id: "SN4", axis: "SN", show: "a", a: "There is something genuinely satisfying to you about getting every small detail right.", b: "Details are somebody else's problem." },
    { id: "SN5", axis: "SN", show: "b", a: "I remember what happened.", b: "What stays with you afterward is not the exact sequence of events, it is what the whole thing meant." },
    { id: "SN6", axis: "SN", show: "b", a: "A proven method is a good method.", b: "A method that is already proven to work is, to you, just a starting point worth improving on." },
    { id: "SN7", axis: "SN", show: "a", a: "When you describe something, you describe it exactly as it is, without reaching for a comparison.", b: "I describe things by comparison." },
    { id: "SN8", axis: "SN", show: "b", a: "The present is plenty to think about.", b: "Your mind is usually already living somewhere out in next year, even while you are doing something today." },
    { id: "SN9", axis: "SN", show: "a", a: "When there are instructions, your instinct is to follow them closely, step by step.", b: "Instructions are for skimming." },

    { id: "TF1", axis: "TF", show: "a", a: "You would rather decide something purely on its own merits, without factoring in who it will affect.", b: "Decide it on who it lands on." },
    { id: "TF2", axis: "TF", show: "b", a: "Being right matters more than being liked.", b: "Being liked by the people around you matters more to you than being proven right." },
    { id: "TF3", axis: "TF", show: "a", a: "Your first instinct is to give the honest answer, even before you have softened it.", b: "I give the kind answer first." },
    { id: "TF4", axis: "TF", show: "b", a: "Feelings are data, not a verdict.", b: "To you, how everyone feels about a situation is not a side issue, it is the whole point of it." },
    { id: "TF5", axis: "TF", show: "a", a: "You can build a genuinely strong case for a position you personally disagree with.", b: "Arguing against my own view feels wrong." },
    { id: "TF6", axis: "TF", show: "b", a: "Fair means the same rule for everyone.", b: "To you, being fair means taking the specific person and their situation into account, not applying one rule to everyone." },
    { id: "TF7", axis: "TF", show: "a", a: "You see criticism as useful information, even when it is delivered bluntly.", b: "Criticism lands hard and stays." },
    { id: "TF8", axis: "TF", show: "b", a: "I notice the flaw in the plan.", b: "Before you notice a flaw in the plan itself, you notice who in the room feels uneasy about it." },
    { id: "TF9", axis: "TF", show: "a", a: "Once the logic checks out, that is enough to settle the matter for you.", b: "Something still has to feel right." },

    { id: "JP1", axis: "JP", show: "a", a: "Once you have made a decision, you consider it made, and you do not enjoy reopening it.", b: "Leave it open a while longer." },
    { id: "JP2", axis: "JP", show: "a", a: "Having a plan in place is genuinely comforting to you, not something that feels restrictive.", b: "A plan is a cage." },
    { id: "JP3", axis: "JP", show: "b", a: "I finish early.", b: "You tend to finish things right up against the deadline, not a moment before." },
    { id: "JP4", axis: "JP", show: "b", a: "Unmade decisions bother me.", b: "Leaving a decision unmade feels less like indecision to you and more like keeping your options open." },
    { id: "JP5", axis: "JP", show: "a", a: "You like knowing ahead of time exactly what Saturday is going to look like.", b: "I like Saturday deciding itself." },
    { id: "JP6", axis: "JP", show: "b", a: "A list is how I hold the day.", b: "Once you write a list for the day, you can end up losing the whole day just managing the list." },
    { id: "JP7", axis: "JP", show: "a", a: "When plans change at the last minute, it registers to you as a small, genuine loss.", b: "Changed plans are a small gift." },
    { id: "JP8", axis: "JP", show: "b", a: "I pack days before.", b: "You pack for a trip the morning you are leaving, not any earlier." },
    { id: "JP9", axis: "JP", show: "a", a: "Having something finished, even imperfectly, feels better to you than leaving it open.", b: "Open beats done." }
  ];

  var tiebreak = [
    { id: "EI-t1", axis: "EI", show: "a", a: "After a great party winds down, you are the one wishing it would keep going.", b: "After a great party I want silence." },
    { id: "EI-t2", axis: "EI", show: "b", a: "I think best out loud with someone.", b: "You think most clearly when you are alone with a piece of paper, not talking it through with someone." },
    { id: "EI-t3", axis: "EI", show: "a", a: "Being the only person talking in a room full of quiet listeners does not faze you at all.", b: "Being the only one talking is a nightmare." },
    { id: "EI-t4", axis: "EI", show: "a", a: "Given the choice, you would rather be the one hosting the party than just attending it.", b: "I would attend, briefly." },
    { id: "EI-t5", axis: "EI", show: "b", a: "A weekend alone would be a waste.", b: "A whole weekend with no plans and nobody around sounds like a genuine treat to you." },
    { id: "EI-t6", axis: "EI", show: "b", a: "I introduce myself first.", b: "At a gathering, you would rather wait to be introduced to someone than walk up and introduce yourself." },
    { id: "EI-t7", axis: "EI", show: "a", a: "Working in a busy, noisy room actually helps you focus, rather than getting in the way.", b: "Working in a busy room ruins me." },
    { id: "EI-t8", axis: "EI", show: "b", a: "I like being known by many people.", b: "You would rather be deeply known by a small handful of people than loosely known by many." },

    { id: "SN-t1", axis: "SN", show: "a", a: "Given something broken, your instinct is to fix what is already there rather than reimagine it from scratch.", b: "I would rather reimagine it than fix it." },
    { id: "SN-t2", axis: "SN", show: "b", a: "What is it for comes first.", b: "The first question in your head is what something could become, before you even ask what it is currently for." },
    { id: "SN-t3", axis: "SN", show: "a", a: "To you, a good idea is one that could actually be put to work right now, not just someday.", b: "A good idea is one that could work." },
    { id: "SN-t4", axis: "SN", show: "a", a: "Faced with something new, you sit down and read the manual before you touch a single button.", b: "I press buttons." },
    { id: "SN-t5", axis: "SN", show: "b", a: "Facts settle arguments.", b: "For you, an argument gets settled once someone points out the underlying pattern, not just the isolated facts." },
    { id: "SN-t6", axis: "SN", show: "b", a: "I notice what changed in the room.", b: "Walking into a room, what you notice first is what it reminds you of, more than what is actually changed in it." },
    { id: "SN-t7", axis: "SN", show: "a", a: "Being called realistic feels like a genuine compliment to you, not a criticism.", b: "Realistic is a warning." },
    { id: "SN-t8", axis: "SN", show: "b", a: "I would rather build it right.", b: "Given the choice, you would rather build something strange and untested than something safely conventional." },

    { id: "TF-t1", axis: "TF", show: "a", a: "If a friend's idea is genuinely bad, you will tell them so, directly and without much cushioning.", b: "I would find a way around saying it." },
    { id: "TF-t2", axis: "TF", show: "b", a: "A rule broken for a good reason is still broken.", b: "If a rule had to be broken for a good enough reason, you conclude it was a bad rule all along." },
    { id: "TF-t3", axis: "TF", show: "a", a: "Being told you are wrong does not rattle you, you can just sit with it and consider it.", b: "Being told I am wrong takes me a day." },
    { id: "TF-t4", axis: "TF", show: "b", a: "Harmony is nice, accuracy is necessary.", b: "Being accurate is nice to have, but keeping the peace in the room is the thing you actually consider necessary." },
    { id: "TF-t5", axis: "TF", show: "a", a: "If it is the right call, you will make it even knowing it is going to be unpopular with the room.", b: "I would look for the call everyone can live with." },
    { id: "TF-t6", axis: "TF", show: "b", a: "My first question is whether it holds up.", b: "The first question you ask about any decision is who it is going to hurt." },
    { id: "TF-t7", axis: "TF", show: "a", a: "When the analysis and the mood in the room disagree, you side with the analysis.", b: "I trust the room over the analysis." },
    { id: "TF-t8", axis: "TF", show: "b", a: "Sentiment clouds judgment.", b: "A judgment made with no sentiment behind it at all strikes you as worse, not more objective." },

    { id: "JP-t1", axis: "JP", show: "a", a: "Looking at a completely empty calendar makes you genuinely uneasy, rather than relieved.", b: "An empty calendar is the point." },
    { id: "JP-t2", axis: "JP", show: "b", a: "I would rather decide wrong than not decide.", b: "Given the choice, you would rather wait a little longer than commit to a decision that turns out wrong." },
    { id: "JP-t3", axis: "JP", show: "a", a: "A deadline, to you, is simply the moment when a piece of work finally gets finished.", b: "Deadlines are when I start." },
    { id: "JP-t4", axis: "JP", show: "a", a: "You tidy your space before you can actually settle down and start working.", b: "I tidy instead of working, later." },
    { id: "JP-t5", axis: "JP", show: "b", a: "Routine frees me.", b: "A routine that repeats for too long does not comfort you, it slowly flattens you." },
    { id: "JP-t6", axis: "JP", show: "a", a: "In your group of friends, you are the one who actually books the restaurant.", b: "I see what we feel like." },
    { id: "JP-t7", axis: "JP", show: "b", a: "Half-done things nag at me.", b: "A half-finished task does not nag at you, it just feels paused, waiting for you to pick it back up." },
    { id: "JP-t8", axis: "JP", show: "b", a: "I want the itinerary.", b: "When you travel, you want the flight booked and nothing else decided in advance." }
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
