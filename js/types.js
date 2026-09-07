(function (root) {
  "use strict";
  var SG = root.SG;

  var byCode = {
    INTJ: { name: "Deep Water",        line: "Three moves ahead, saying none of them." },
    INTP: { name: "The Rabbit Hole",   line: "Went to check one thing. Gone four hours." },
    ENTJ: { name: "Full Throttle",     line: "Has already decided. Is being polite about it." },
    ENTP: { name: "Sparks Fly",        line: "Will argue your own point back at you, better." },
    INFJ: { name: "The Quiet Read",    line: "Clocks the room before they are through the door." },
    INFP: { name: "Soft Focus",        line: "Feels it all week. Mentions it on Friday." },
    ENFJ: { name: "Warm Front",        line: "The room gets easier when they walk in." },
    ENFP: { name: "Wildflower",        line: "Six new plans and genuine love for all of them." },
    ISTJ: { name: "The Backbone",      line: "Said they would. Therefore they will." },
    ISFJ: { name: "Safe Harbour",      line: "Remembers how you take your tea. Since 2019." },
    ESTJ: { name: "The Straight Line", line: "Shortest route, stated out loud, twice." },
    ESFJ: { name: "The Glue",          line: "The group chat would have died without them." },
    ISTP: { name: "The Fixer",         line: "Has the thing in pieces. Do not panic." },
    ISFP: { name: "Slow Sunday",       line: "Not late. Simply not in a hurry." },
    ESTP: { name: "No Brakes",         line: "Says yes first, reads the details never." },
    ESFP: { name: "The Encore",        line: "Leaves last, and the night was better for it." }
  };

  byCode.INTJ.opening = "You are three steps into a plan that nobody else has been told about yet, and you are quietly annoyed that reality has not caught up to it. Someone asks what you think and you give them the finished version, not the working.";
  byCode.INTJ.best = "when a system you built is running itself and you can finally think about the next one.";
  byCode.INTJ.undone = "when someone asks you to explain the feeling behind a decision, not just the logic.";
  byCode.INTJ.chips = ["Redesigns it silently", "Skips the small talk", "Trusts competence over charm", "Rewrites the plan twice", "Allergic to wasted motion"];
  byCode.INTJ.often = ["Elon Musk", "Mark Zuckerberg", "Michelle Obama", "Christopher Nolan", "Isaac Newton"];

  byCode.INTP.opening = "You opened one tab to check a fact and now it is midnight and you have eleven tabs and a theory. Someone asks if you finished the actual task and you realise you have not, but you know so much more now.";
  byCode.INTP.best = "when a problem finally clicks into a shape that makes elegant sense.";
  byCode.INTP.undone = "when you are asked to just decide, right now, without checking one more thing.";
  byCode.INTP.chips = ["Finds the exception", "Forgets to reply", "Loves a good tangent", "Distrusts confident answers", "Trusts models over opinions"];
  byCode.INTP.often = ["Albert Einstein", "Bill Gates", "Marie Curie", "René Descartes", "Charles Darwin"];

  byCode.ENTJ.opening = "You walked into the meeting with the outcome already decided and you are simply running everyone else through it at a reasonable pace. Someone raises an objection and you have already priced it in.";
  byCode.ENTJ.best = "when a room full of disagreement turns into one plan people actually execute.";
  byCode.ENTJ.undone = "when the plan is right but nobody will move, and patience is not your strong suit.";
  byCode.ENTJ.chips = ["Runs the meeting", "Delegates without a fuss", "Wants the scoreboard", "Cuts the small talk", "Assumes competence, checks later"];
  byCode.ENTJ.often = ["Steve Jobs", "Margaret Thatcher", "Gordon Ramsay", "Franklin D. Roosevelt", "Winston Churchill"];

  byCode.ENTP.opening = "You made a throwaway comment twenty minutes ago and now the whole table is debating it, which was the plan. Someone tries to end the argument and you have already found the hole in their closing point.";
  byCode.ENTP.best = "when an idea nobody else would have said out loud turns out to be the right one.";
  byCode.ENTP.undone = "when the same conversation happens for the fifth time and nothing new gets said.";
  byCode.ENTP.chips = ["Plays devil's advocate", "Starts three projects", "Enjoys a good roast", "Bored by the obvious answer", "Changes its mind loudly"];
  byCode.ENTP.often = ["Robert Downey Jr.", "Mark Twain", "Sacha Baron Cohen", "Leonardo da Vinci", "Thomas Edison"];

  byCode.INFJ.opening = "You read people fast and you are usually right, which is a lovely gift and an exhausting one. Most rooms you walk into, you have already worked out who is unhappy and who is pretending, and you will spend the evening quietly managing it without being asked.";
  byCode.INFJ.best = "when someone finally says the true thing out loud, and you get to be the person who heard it first.";
  byCode.INFJ.undone = "when you have done that for everyone for a month and nobody has once asked how you are.";
  byCode.INFJ.chips = ["Reads the room", "Plans in private", "Slow to trust", "Holds a grudge tidily", "Ferociously loyal"];
  byCode.INFJ.often = ["Carl Jung", "Nelson Mandela", "Lady Gaga", "Edward Norton", "Nicole Kidman"];

  byCode.INFP.opening = "You have been turning something over in your head since Tuesday and today, out of nowhere, it finally comes out as one long paragraph. Somebody says it is not a big deal and you already know that, that was never the point.";
  byCode.INFP.best = "when your own values and your actual life line up for once, even briefly.";
  byCode.INFP.undone = "when something you care about gets treated as a minor inconvenience by everyone else.";
  byCode.INFP.chips = ["Writes it, deletes it", "Feels things sideways", "Keeps its values quiet", "Daydreams mid conversation", "Loyal to your potential self"];
  byCode.INFP.often = ["William Shakespeare", "J.R.R. Tolkien", "Johnny Depp", "Princess Diana", "Kurt Cobain"];

  byCode.ENFJ.opening = "You notice someone go quiet at the edge of the party and you are already crossing the room before you have decided to. By the end of the night you know everyone's news and somehow they know very little of yours.";
  byCode.ENFJ.best = "when you help someone become the version of themselves they were reaching for.";
  byCode.ENFJ.undone = "when you have given the room everything and gone home with nothing left for you.";
  byCode.ENFJ.chips = ["Hosts without trying", "Remembers your birthday", "Talks people off ledges", "Takes on everyone's mood", "Hard to say no to"];
  byCode.ENFJ.often = ["Oprah Winfrey", "Barack Obama", "Martin Luther King Jr.", "Emma Watson", "Maya Angelou"];

  byCode.ENFP.opening = "You met someone twenty minutes ago and you are already planning the trip the three of you should take together. Halfway through telling a friend about it, a better idea arrives and you are now describing that one instead.";
  byCode.ENFP.best = "when a spark of an idea and an audience who is into it show up at the same time.";
  byCode.ENFP.undone = "when the admin behind the fun idea catches up with you all at once.";
  byCode.ENFP.chips = ["Makes friends in line", "Starts strong, wanders", "Says yes on impulse", "Feels everything loudly", "Forgets the follow through"];
  byCode.ENFP.often = ["Robin Williams", "Ellen DeGeneres", "Julia Roberts", "Will Smith", "Walt Disney"];

  byCode.ISTJ.opening = "You said you would have it done by Thursday and it has been done since Tuesday, quietly, without a status update. Someone else's deadline slips and you feel it almost physically, like a chair leg that will not sit flat.";
  byCode.ISTJ.best = "when the plan is followed, the work is solid, and nobody had to chase anyone.";
  byCode.ISTJ.undone = "when the rules change halfway through for reasons nobody bothered to explain.";
  byCode.ISTJ.chips = ["Shows up on time", "Reads the manual first", "Deeply distrusts shortcuts", "Keeps the receipts", "Quietly does the most"];
  byCode.ISTJ.often = ["George Washington", "Queen Elizabeth II", "Warren Buffett", "Natalie Portman", "Angela Merkel"];

  byCode.ISFJ.opening = "You notice the coffee order before anyone asks and you already brought the umbrella because the forecast looked iffy. You will do this for years before it occurs to anyone that someone is doing it.";
  byCode.ISFJ.best = "when the people you look after are comfortable and do not even notice why.";
  byCode.ISFJ.undone = "when your quiet care gets mistaken for having no needs of your own.";
  byCode.ISFJ.chips = ["Remembers the details", "Stocks the emergency snacks", "Avoids the spotlight", "Holds the routine together", "Hurts quietly, for a while"];
  byCode.ISFJ.often = ["Mother Teresa", "Kate Middleton", "Rosa Parks", "Beyoncé", "Selena Gomez"];

  byCode.ESTJ.opening = "You walk into a disorganised situation and within five minutes there is a list, an owner for each item, and a deadline. Someone suggests a workshop to discuss feelings about the process and you suggest doing the thing instead.";
  byCode.ESTJ.best = "when a messy situation gets a clear structure and everyone knows what happens next.";
  byCode.ESTJ.undone = "when people want to keep discussing a decision that was already made and is working fine.";
  byCode.ESTJ.chips = ["Makes the schedule", "States the obvious loudly", "Runs a tight ship", "Low patience for drama", "Shows love through logistics"];
  byCode.ESTJ.often = ["Judge Judy", "Lyndon B. Johnson", "Sonia Sotomayor", "Martha Stewart", "Hillary Clinton"];

  byCode.ESFJ.opening = "You already know who is dating whom, who needs checking on, and what everyone is bringing to the party you organised. The plan changes at the last minute and you are the one holding it together while pretending it is fine.";
  byCode.ESFJ.best = "when everyone at the table is fed, included, and having a good time because you noticed what they needed.";
  byCode.ESFJ.undone = "when you have hosted, organised and smoothed everything over and someone still complains.";
  byCode.ESFJ.chips = ["Organises the group gift", "Checks in constantly", "Wants everyone included", "Takes criticism personally", "Keeps traditions alive"];
  byCode.ESFJ.often = ["Taylor Swift", "Jennifer Lopez", "Bill Clinton", "Sally Field", "Steve Harvey"];

  byCode.ISTP.opening = "The thing is in four pieces on the table and you have not said a word in ten minutes because you are working it out with your hands. Someone asks if you need help and you say no, out of habit, before you have actually checked.";
  byCode.ISTP.best = "when a broken thing is now a working thing and you barely had to think about it.";
  byCode.ISTP.undone = "when you are asked to narrate your feelings about something while you are still fixing it.";
  byCode.ISTP.chips = ["Fixes it, says nothing", "Needs space, often", "Calm in a crisis", "Learns by taking it apart", "Commits when it matters"];
  byCode.ISTP.often = ["Clint Eastwood", "Michael Jordan", "Bear Grylls", "Kristen Stewart", "Scarlett Johansson"];

  byCode.ISFP.opening = "You are not late, you are simply moving at the pace the afternoon deserves, and the plan can wait for you to finish the thought you are having. Somebody pushes for a decision right now and you quietly note that this is not how good decisions get made.";
  byCode.ISFP.best = "when you get to make something with your hands and nobody is rushing you.";
  byCode.ISFP.undone = "when your quiet pace gets read as not caring, which could not be further from true.";
  byCode.ISFP.chips = ["Notices small beauty", "Dislikes being managed", "Feels first, explains later", "Stubborn in a quiet way", "Kind without announcing it"];
  byCode.ISFP.often = ["Bob Dylan", "Frida Kahlo", "David Bowie", "Britney Spears", "Rihanna"];

  byCode.ESTP.opening = "You said yes before anyone finished the sentence and you are already halfway out the door. Someone hands you the instructions and you set them aside, because you will figure it out on the way down.";
  byCode.ESTP.best = "when something is actually happening and you get to react to it in real time.";
  byCode.ESTP.undone = "when you are stuck reading the manual for something you would rather just be doing.";
  byCode.ESTP.chips = ["Skips the instructions", "Reads a room fast", "Bets on instinct", "Bored by long meetings", "Charms the room quickly"];
  byCode.ESTP.often = ["Donald Trump", "Madonna", "Jack Nicholson", "Eddie Murphy", "Ernest Hemingway"];

  byCode.ESFP.opening = "You are the reason the small gathering turned into an actual night out, and you are still going when everyone else is checking their phone for a taxi. Someone mentions tomorrow's early start and you agree, cheerfully, without changing your plans at all.";
  byCode.ESFP.best = "when the room is loose, the mood is good, and you get to be right in the middle of it.";
  byCode.ESFP.undone = "when the fun stops and the quiet, practical parts of life are still waiting for you.";
  byCode.ESFP.chips = ["Turns errands into events", "Lives for the room's mood", "Terrible with paperwork", "Generous to a fault", "Cannot leave early"];
  byCode.ESFP.often = ["Marilyn Monroe", "Miley Cyrus", "Jamie Foxx", "Elvis Presley", "Justin Bieber"];

  SG.types = { byCode: byCode };
}(typeof window !== "undefined" ? window : globalThis));
