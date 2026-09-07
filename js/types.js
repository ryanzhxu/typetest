(function (root) {
  "use strict";
  var SG = root.SG;

  /* The five long sections every type page carries, in page order. The
     headings live here once rather than sixteen times, so they cannot drift
     apart, and so the locale build has five strings to translate and not
     eighty. Each type holds an array of paragraphs under each key. */
  var SECTIONS = [
    { key: "good",     heading: "What you are good at" },
    { key: "snags",    heading: "What gets in your way" },
    { key: "closeUp",  heading: "Close up" },
    { key: "work",     heading: "At work" },
    { key: "oneThing", heading: "The one thing" }
  ];

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
  byCode.INTJ.good = [
    "You can hold an entire system in your head and turn it over, which is why you are so often right about what will break, and so often unable to say how you knew. The answer arrives finished. The working is somewhere underneath it and you have to go and dig it out for anybody who asks.",
    "You are unusually willing to be wrong in private. Most people defend the plan they announced. You quietly replace it with a better one and let everyone carry on believing it was always that, because being right matters to you and being seen to be right does not.",
    "And you finish. Not quickly, and never on anyone else's schedule, but what you build ends up sturdier than what was asked for, because you kept going past the point where it was merely acceptable and nobody had to tell you to."
  ];
  byCode.INTJ.snags = [
    "You skip the explaining and then you are annoyed that nobody is with you. You handed over the conclusion and kept the reasoning, which from outside looks like an instruction rather than an argument. People resist your plans far less often than they resist being handed one.",
    "You take competence for the whole of a person. Somebody slow, or disorganised, or bad in a first meeting gets filed early and quietly, and you lose people who would have been worth the patience it would have cost you to wait.",
    "And you would rather do it yourself. That is faster the first time and slower every time after, because the only person who understands the thing is still you, and you are the one who cannot put it down."
  ];
  byCode.INTJ.closeUp = [
    "You do very little of the early performance. No pursuit, no display, none of the noise other people use to signal interest. What you offer instead is that you have thought about this person carefully and you are still here, which is a larger thing than it looks and almost never reads as one at the time.",
    "You are loyal in a way that refuses to announce itself. You will rearrange a year around somebody and mention none of it, and then be genuinely puzzled that it did not register.",
    "The hard part is that you process alone. Something goes wrong, you go quiet, you go away to think it through properly, and the person left outside the door experiences all of that as being shut out. Say that you are going. It costs one sentence and it buys you the week."
  ];
  byCode.INTJ.work = [
    "You want a problem with real depth in it and a manager who then leaves you alone. Given both you will out-produce a team. Given neither you will look disengaged, and you will be, and no amount of enthusiasm from anyone else will reach you.",
    "You are better at designing the thing than at running it. The interesting part ends for you at roughly the moment it starts working, which is exactly the moment everybody else needs you to stay interested for another two years.",
    "A meeting where the decision was made beforehand and is now being socialised is physically difficult for you to sit through, and your face is saying so a great deal more clearly than you believe it is."
  ];
  byCode.INTJ.oneThing = [
    "Show the working.",
    "Not all of it. One sentence of it, at the front, before the conclusion instead of after: here is the thing I was worried about, and so here is what I think we should do. That single sentence is the whole difference between a plan people argue with and a plan people follow.",
    "You have spent years being right and unheeded and concluding from it that people are slow. Some are. Most of them were simply never told why, and would have come with you if they had been."
  ];

  byCode.INTP.opening = "You opened one tab to check a fact and now it is midnight and you have eleven tabs and a theory. Someone asks if you finished the actual task and you realise you have not, but you know so much more now.";
  byCode.INTP.best = "when a problem finally clicks into a shape that makes elegant sense.";
  byCode.INTP.undone = "when you are asked to just decide, right now, without checking one more thing.";
  byCode.INTP.chips = ["Finds the exception", "Forgets to reply", "Loves a good tangent", "Distrusts confident answers", "Trusts models over opinions"];
  byCode.INTP.often = ["Albert Einstein", "Bill Gates", "Marie Curie", "René Descartes", "Charles Darwin"];
  byCode.INTP.good = [
    "You are the person who notices that the argument everyone is nodding along to does not actually hold. Not to be difficult. You genuinely cannot stop seeing it, the way you cannot unsee a crooked picture, and the room is usually better for somebody having said it out loud.",
    "You can learn almost anything by taking it apart, and you do not need permission or a course or a reason. Curiosity is enough. It means you turn up to conversations knowing something strange and useful that nobody expected you to know.",
    "And you are honest about the limits of what you know, which is rarer than it sounds. Most people round their uncertainty up to confidence. You will say you are not sure, and that makes the things you do assert worth a great deal more."
  ];
  byCode.INTP.snags = [
    "You will research a decision until the decision expires. There is always one more thing worth checking, and checking it feels like progress, and at the end of it the choice gets made for you by a deadline instead of by you.",
    "You mistake having understood something for having done it. The model is finished and beautiful and sitting in your head, and the actual task it was for is where you left it on Tuesday.",
    "And you go missing. Not coldly. You simply drop below the surface for a fortnight, forget three replies, and surface expecting everything to be where you left it, which is unfair to people who spent that fortnight wondering."
  ];
  byCode.INTP.closeUp = [
    "You are much warmer than you look from a distance, and the people who get past the first month find that out and tend to stay. The problem is the first month, where you can read as uninterested when you are actually just waiting for the small talk to be over.",
    "What works on you is somebody who says the plain thing. Hints do not land. You are not being obtuse, you are genuinely not receiving them, and a person who will simply say what they want gets a version of you nobody else meets.",
    "Where it goes wrong is conflict. You go analytical the moment feeling enters the room, and explaining to someone why their upset is not logically warranted is, reliably, the least useful sentence available to you."
  ];
  byCode.INTP.work = [
    "You want an interesting problem, a long leash and nobody standing over you asking for a status update on a thing that is clearly still cooking. Given that you will do work nobody asked for and everybody needed.",
    "You are poorly served by roles that are mostly process, and you will quietly stop doing the parts that bore you rather than announce that you are not doing them, which surprises people later.",
    "Pair yourself with somebody who ships. Genuinely. The combination of your ideas and their impatience is worth more than either of you alone, and you will only resent it for the first year."
  ];
  byCode.INTP.oneThing = [
    "Finish one thing at seventy per cent.",
    "Not the important thing. Pick something small enough that you do not care about it much, and take it all the way out into the world while it is still slightly wrong. The point is not the object. The point is to find out that the world does not punish an unfinished edge nearly as hard as you expect.",
    "Perfect is not why you stall. Stalling is what stops it ever being tested, and untested is the one state your ideas cannot survive in."
  ];

  byCode.ENTJ.opening = "You walked into the meeting with the outcome already decided and you are simply running everyone else through it at a reasonable pace. Someone raises an objection and you have already priced it in.";
  byCode.ENTJ.best = "when a room full of disagreement turns into one plan people actually execute.";
  byCode.ENTJ.undone = "when the plan is right but nobody will move, and patience is not your strong suit.";
  byCode.ENTJ.chips = ["Runs the meeting", "Delegates without a fuss", "Wants the scoreboard", "Cuts the small talk", "Assumes competence, checks later"];
  byCode.ENTJ.often = ["Steve Jobs", "Margaret Thatcher", "Gordon Ramsay", "Franklin D. Roosevelt", "Winston Churchill"];
  byCode.ENTJ.good = [
    "You can turn a room full of disagreement into one plan, and you can do it fast. Most people mistake that for force. It is not. You listen at speed, you find the thing everyone actually wants underneath what they are saying, and you name it before anyone else has finished thinking.",
    "You are not frightened of the hard call. Somebody has to say the project is dead, or that this person is in the wrong job, and while everyone else is waiting for a volunteer you have already said it and moved on to what happens next.",
    "And you back your people. Loudly, in rooms they are not in. The standard is high and the loyalty that comes with it is real, and people who have worked for you tend to say it was the most they ever grew."
  ];
  byCode.ENTJ.snags = [
    "You decide at a speed nobody else can match and then read the lag as resistance. It is usually not. It is the ordinary time it takes a person to catch up to a conclusion you reached three days ago and did not narrate.",
    "You are blunter than you know. What feels to you like efficiency, cutting the padding and getting to it, lands on quieter people as a verdict, and they stop bringing you things, which is exactly the outcome you least want.",
    "And you do not rest. Not because you are frightened of stopping, but because there is always a next thing and it is always slightly more interesting than your own life. The cost of that shows up late and all at once."
  ];
  byCode.ENTJ.closeUp = [
    "You are more romantic than your reputation. Once you have chosen somebody you commit completely and you treat the relationship the way you treat everything you care about, which is to say you want it to be good and you are willing to work at it.",
    "The trouble is that you run it. You arrive with the solution when what was wanted was ten minutes of company, and being managed by somebody who loves you is a strange and lonely thing to be on the end of.",
    "Ask first. Do you want me to help with this or do you want me to listen. It is four seconds long, it costs you nothing, and it is the single highest-return sentence available to you."
  ];
  byCode.ENTJ.work = [
    "You are built for the job where somebody has to own the outcome, and you will be restless and difficult in anything smaller. Give you scope and a scoreboard and you are the best thing in the building.",
    "You are worst in ambiguity you did not create, where nobody owns anything and the meeting keeps happening. You will seize it, which is often correct and occasionally not yours to seize.",
    "The people you need around you are the ones who will tell you no. Hire for that specifically, because you are quite capable of assembling a team who agree with you, and it will feel excellent right up until it does not."
  ];
  byCode.ENTJ.oneThing = [
    "Leave the gap.",
    "When you have made the call, stop talking. Do not fill the silence with the three reasons it is correct. Let the room have the twenty seconds it needs, and let somebody use them to say the thing they were going to keep to themselves.",
    "You are not short of conviction. You are short of the pause where other people put theirs in, and you have been paying for that pause in worse decisions than you needed to make."
  ];

  byCode.ENTP.opening = "You made a throwaway comment twenty minutes ago and now the whole table is debating it, which was the plan. Someone tries to end the argument and you have already found the hole in their closing point.";
  byCode.ENTP.best = "when an idea nobody else would have said out loud turns out to be the right one.";
  byCode.ENTP.undone = "when the same conversation happens for the fifth time and nothing new gets said.";
  byCode.ENTP.chips = ["Plays devil's advocate", "Starts three projects", "Enjoys a good roast", "Bored by the obvious answer", "Changes its mind loudly"];
  byCode.ENTP.often = ["Robert Downey Jr.", "Mark Twain", "Sacha Baron Cohen", "Leonardo da Vinci", "Thomas Edison"];
  byCode.ENTP.good = [
    "You can argue any position, including the one you disagree with, well enough to change somebody's mind, and it is genuinely useful when it is pointed at a real problem. A room with you in it finds the hole in a plan two months earlier than a room without.",
    "You are quick and you are funny, and both are doing more work than people realise. Half of what looks like showing off is you keeping a difficult conversation loose enough that people will stay in it.",
    "And you are not attached to being right, which is unusual in someone who argues this much. Show you a better idea and you will adopt it on the spot and start arguing for it as though it were always yours, which it now is."
  ];
  byCode.ENTP.snags = [
    "You start beautifully and you leave at eighty per cent, when the interesting problems are solved and only the work is left. The graveyard behind you is full of genuinely good ideas that needed six more boring weeks.",
    "You will pick the fight for the pleasure of it. There is a version of you that pokes the sore point because the conversation had gone flat, and the person on the other end of that does not experience it as play.",
    "And you are bored, often, in ways you treat as an emergency. Boredom sends you looking for a new project, a new argument, a new anything, and it has cost you things that were only boring because they were nearly finished."
  ];
  byCode.ENTP.closeUp = [
    "You are a magnificent beginning. Nobody makes the first three months more fun than you, and people fall for you fast and hard because being the focus of your attention is genuinely a lovely place to be.",
    "The test comes later, at the ordinary part, where nothing is being discovered and somebody has to book the dentist. That is where you have to decide whether you are actually in this, and you can go a long time avoiding deciding.",
    "What you need is somebody who is not intimidated and does not fold. If your partner cannot push back, you will push until they do, and then be disappointed by the result you engineered."
  ];
  byCode.ENTP.work = [
    "You want variety, a problem nobody has solved and permission to be a little unreasonable. In the right job you are worth several people. In the wrong one you are an ongoing management issue and you know it.",
    "You are excellent at the start of things and unhappy at the middle of them. Build that in rather than pretending otherwise: get in, break the assumption, hand it over to somebody who likes the middle.",
    "The habit worth building is finishing one thing a year that you were bored of. Not for the thing. For the evidence, because right now you do not have much of it, and it is quietly eating your confidence."
  ];
  byCode.ENTP.oneThing = [
    "Say the boring yes.",
    "Somebody is asking for the unglamorous version of a commitment: the recurring Tuesday, the second year, the follow-up nobody will thank you for. Your instinct is to keep the option open. Close it, once, deliberately, and stay.",
    "You already know you can start anything. That question is answered. The one still open is whether you can stay, and it is the only one anybody who loves you is actually asking."
  ];

  byCode.INFJ.opening = "You read people fast and you are usually right, which is a lovely gift and an exhausting one. Most rooms you walk into, you have already worked out who is unhappy and who is pretending, and you will spend the evening quietly managing it without being asked.";
  byCode.INFJ.best = "when someone finally says the true thing out loud, and you get to be the person who heard it first.";
  byCode.INFJ.undone = "when you have done that for everyone for a month and nobody has once asked how you are.";
  byCode.INFJ.chips = ["Reads the room", "Plans in private", "Slow to trust", "Holds a grudge tidily", "Ferociously loyal"];
  byCode.INFJ.often = ["Carl Jung", "Nelson Mandela", "Lady Gaga", "Edward Norton", "Nicole Kidman"];
  byCode.INFJ.good = [
    "You can tell what a room needs before anyone in it has worked out what is wrong. This is not magic. You have been watching faces since you were small, and you keep a very large private file on how people behave when they are not saying the true thing.",
    "That makes you the one who can have the conversation everybody else is avoiding. You can say a hard thing kindly and have it land as care rather than as an attack, which is rarer than you think. People tell you things they have not told anyone, often within an hour of meeting you.",
    "You are also unusually good at holding a direction. Most people want the outcome. You want the outcome and you have a picture of who everyone involved has to become to reach it, and you are patient enough to wait for that."
  ];
  byCode.INFJ.snags = [
    "You are usually right about people, and usually is doing a great deal of work in that sentence. When you are wrong you tend to be wrong with total confidence, because the read arrived as a feeling, and feelings do not show you their workings. You will act on it for months before you think to check.",
    "You take other people's moods home, too. A tense meeting at three is still sitting in your chest at nine, and by then you will have decided it was about you.",
    "And you do not ask. You notice what everyone else needs, you provide it quietly, and you wait to be noticed back. When you are not, you say nothing. You withdraw instead, and by the time anyone works out that you have gone, you made the decision weeks ago."
  ];
  byCode.INFJ.closeUp = [
    "You do not have many close people and you are not trying to. The ones you have, you keep for decades, and you know things about them they have forgotten telling you.",
    "What you want is not romance exactly. It is being known without having to explain. You will spend a long time early on looking for evidence that this person can actually see you, and you will be strangely calm about leaving if the evidence never arrives.",
    "The failure is that you keep score in silence. You give a great deal, you never mention the cost, and one day the ledger closes and the other person never knew there was one. Say the thing in month two. It is far cheaper than saying it in year four."
  ];
  byCode.INFJ.work = [
    "You need work that means something and a door you can close. An open-plan room takes the thing you are genuinely good at, which is sustained thought about people and how they fit together, and grinds it down into small talk.",
    "Your best work happens slightly out of view: the strategy, the difficult email, the thing nobody else wants to write. You are often the person who understands what is really going on in a team, and just as often not the person anyone thinks to ask.",
    "Watch for the caretaking trap. Because you read distress fastest, you get handed everybody's distress. It is not in your job description and nobody is measuring it."
  ];
  byCode.INFJ.oneThing = [
    "It is not learning to read people better. You are already at the ceiling there.",
    "It is saying what you want, plainly, at the time you want it, before it has turned into a grievance. Not the diplomatic version. The plain one. You have spent your life translating for people who would have been fine with the direct version, and the whole cost of that translation lands on you.",
    "Start small enough that it does not feel like a confrontation. I would rather not. I need a day. That hurt. You will find that most people simply say all right."
  ];

  byCode.INFP.opening = "You have been turning something over in your head since Tuesday and today, out of nowhere, it finally comes out as one long paragraph. Somebody says it is not a big deal and you already know that, that was never the point.";
  byCode.INFP.best = "when your own values and your actual life line up for once, even briefly.";
  byCode.INFP.undone = "when something you care about gets treated as a minor inconvenience by everyone else.";
  byCode.INFP.chips = ["Writes it, deletes it", "Feels things sideways", "Keeps its values quiet", "Daydreams mid conversation", "Loyal to your potential self"];
  byCode.INFP.often = ["William Shakespeare", "J.R.R. Tolkien", "Johnny Depp", "Princess Diana", "Kurt Cobain"];
  byCode.INFP.good = [
    "You notice what a thing is actually about while everybody else is still discussing the arrangements. In a meeting about a policy you are the one who says out loud who it will land on, and you are usually the only person in the room who was going to.",
    "You have a real gift for language when the subject matters to you. The thing you turned over for a week comes out whole, and people who have known you for years are startled by how precisely you had it the entire time.",
    "And you do not bend. You will look accommodating for a long while, agreeing to the small things, and then arrive at something you actually believe and simply not move, and nobody who has seen that happen forgets it."
  ];
  byCode.INFP.snags = [
    "You feel it on Tuesday and mention it on Friday, by which point it has grown considerably in the dark. The other person is now responding to four days of accumulation and has no idea, because to them this is minute one.",
    "You compare your unfinished insides to other people's finished outsides, constantly, and you lose. Everyone loses that comparison. You just run it more often than most.",
    "And you retreat into how it could be. The imagined version of the work, the relationship or the year is vivid and available and costs nothing, and it is the most effective way you have found of not starting the real one."
  ];
  byCode.INFP.closeUp = [
    "When you love somebody you love them at a depth that would embarrass you to describe, and you show almost none of it out loud. It comes out sideways: the thing you remembered, the small object, the enormous effort you present as though it were nothing.",
    "What ruins it is that you need to be understood and you will not explain. You want to be read, and reading you is genuinely hard, and the person who loves you is not being lazy when they get it wrong.",
    "You also idealise early and then find the real person underneath, and you can experience that as a betrayal when it is only ordinary. Everybody is smaller than the version. So are you, and you are still worth it."
  ];
  byCode.INFP.work = [
    "You need the work to mean something. Not to be important, necessarily, but to be pointed at something you actually believe, because you cannot fake it for long and everyone can tell when you are trying.",
    "You are better than you think at the craft parts and worse than you think at self-promotion, which means your work is regularly good and regularly uncredited, and you have decided that is simply how it goes. It is not.",
    "Deadlines set by other people work on you. Deadlines set by you do not. That is worth knowing about yourself rather than fighting for another decade."
  ];
  byCode.INFP.oneThing = [
    "Say it on Tuesday.",
    "Whatever you have just noticed, the small wrong thing, say it that day while it is still small and slightly awkward and easy to fix. Not after you have found the perfect phrasing. The perfect phrasing arrives on Friday and by then it is a much bigger conversation.",
    "You have spent years believing that raising things makes them worse. Raising them late makes them worse. Raising them early is almost always a short, unremarkable exchange that both of you forget."
  ];

  byCode.ENFJ.opening = "You notice someone go quiet at the edge of the party and you are already crossing the room before you have decided to. By the end of the night you know everyone's news and somehow they know very little of yours.";
  byCode.ENFJ.best = "when you help someone become the version of themselves they were reaching for.";
  byCode.ENFJ.undone = "when you have given the room everything and gone home with nothing left for you.";
  byCode.ENFJ.chips = ["Hosts without trying", "Remembers your birthday", "Talks people off ledges", "Takes on everyone's mood", "Hard to say no to"];
  byCode.ENFJ.often = ["Oprah Winfrey", "Barack Obama", "Martin Luther King Jr.", "Emma Watson", "Maya Angelou"];
  byCode.ENFJ.good = [
    "You can see what somebody could be, and you can describe it to them so convincingly that they go and become it. People point at you years later as the reason they applied, or left, or tried at all.",
    "You make rooms work. A group that would have stayed polite and separate becomes an actual group because you kept introducing people and asking the second question, and none of them notice it was engineered.",
    "And you will take the difficult conversation on, personally, rather than let a situation rot. It costs you something every time and you keep doing it, and the people who benefit rarely know it happened."
  ];
  byCode.ENFJ.snags = [
    "You need to be needed, and it is quietly steering more of your choices than you would like. You will take on the person who requires the most maintenance and call it care, and some of it is care and some of it is you avoiding your own life.",
    "You take criticism as a referendum. A note about a piece of work goes in as a note about whether you are a good person, and you will spend the evening on it while the person who gave it has forgotten entirely.",
    "And you run empty and keep going. You are so practised at reading what others need that you have very little idea what you need, and the question, asked directly, tends to produce a blank."
  ];
  byCode.ENFJ.closeUp = [
    "You are wonderful to be loved by. Attentive, warm, actually interested, and you remember everything. Being your person is a genuinely good deal and most of your people know it.",
    "The catch is that you disappear into it. You adapt so fast and so willingly that a year in, your partner could not say what you wanted for dinner, because you have said whatever you like for so long that it stopped being a preference.",
    "Resentment is your danger, not conflict. You will give and give without complaint and then find, quite suddenly, that you have been keeping an account nobody agreed to. Name the price at the time. Nobody is refusing to pay it, they simply do not know it exists."
  ];
  byCode.ENFJ.work = [
    "You are excellent with people and you will be handed all of them. Mentoring, morale, the difficult client, the leaver, the new starter: it accretes, it is invisible on paper, and it is most of your week.",
    "You lead well because you can hold a group and a direction at once, which is not a common pairing. Where you struggle is the decision that will definitely upset somebody, and you can spend weeks looking for the version that upsets nobody, which does not exist.",
    "Make sure somebody senior knows what you actually carry. If your contribution is only legible to the people receiving it, it will not appear anywhere that matters."
  ];
  byCode.ENFJ.oneThing = [
    "Answer the question honestly when somebody asks how you are.",
    "Once. Not the full account. Just resist the reflex that turns it around within four words, and say a true and slightly inconvenient sentence about your own week, and then stop talking and let them have it.",
    "You have taught everybody around you that you are fine, thoroughly and for years. They are not neglecting you. They are believing you."
  ];

  byCode.ENFP.opening = "You met someone twenty minutes ago and you are already planning the trip the three of you should take together. Halfway through telling a friend about it, a better idea arrives and you are now describing that one instead.";
  byCode.ENFP.best = "when a spark of an idea and an audience who is into it show up at the same time.";
  byCode.ENFP.undone = "when the admin behind the fun idea catches up with you all at once.";
  byCode.ENFP.chips = ["Makes friends in line", "Starts strong, wanders", "Says yes on impulse", "Feels everything loudly", "Forgets the follow through"];
  byCode.ENFP.often = ["Robin Williams", "Ellen DeGeneres", "Julia Roberts", "Will Smith", "Walt Disney"];
  byCode.ENFP.good = [
    "You can find the thing worth being excited about in almost anything, and it is contagious, and it is the reason projects that should have died quietly got made instead. That is not a small talent and you undersell it constantly.",
    "You connect people and ideas that had no business meeting. Half your best work is a collision you caused between two things you happened to be interested in that month.",
    "And you are genuinely warm. Not performing warmth, actually interested, which is why strangers tell you things in queues and why the friend you see twice a year picks up exactly where you left off."
  ];
  byCode.ENFP.snags = [
    "You say yes with your whole chest and then the admin arrives, all of it at once, three weeks later. What looked like enthusiasm to everyone else looks like an ambush to you, and you did it to yourself.",
    "You start the next thing to avoid finishing this one, and you can dress that up as following your energy. Sometimes it is. Often it is that the exciting part is over and the boring part is where the value was.",
    "And you feel it all at full volume, including the small things, which means an offhand comment on a Tuesday can restructure your whole week and nobody will ever know it happened."
  ];
  byCode.ENFP.closeUp = [
    "You fall in fast and completely and you are not embarrassed about it, which is disarming and lovely. You give people the full beam of your attention and it is an extraordinary thing to be on the end of.",
    "The difficulty is the plateau. When the discovering stops you can read ordinary contentment as something having gone wrong, and go looking for the feeling somewhere else, when nothing was wrong at all.",
    "What you need is somebody steady who does not try to slow you down. Steady and controlling are different things and you have historically been bad at telling them apart in the first six weeks."
  ];
  byCode.ENFP.work = [
    "You need people, variety and a reason. Put you on a repetitive solo task and you will do it badly and feel bad about doing it badly, which is a waste of somebody who could have been out in front of a room.",
    "You are much better at the start and the pitch than at the tracking and the reporting, and the honest move is to say so early rather than to keep promising the follow-through and delivering it late.",
    "Find one person who will hold you to things without making you feel small. That single relationship is worth more to your career than any amount of new opportunity."
  ];
  byCode.ENFP.oneThing = [
    "Finish the boring end of one thing.",
    "Pick something already at eighty per cent, the one you keep meaning to get back to, and do only the tedious remainder. No new ideas allowed in. It will feel like a waste of a good week.",
    "The point is not the project. It is that you currently have very little evidence that you finish, and everyone around you has noticed, and so, quietly, have you."
  ];

  byCode.ISTJ.opening = "You said you would have it done by Thursday and it has been done since Tuesday, quietly, without a status update. Someone else's deadline slips and you feel it almost physically, like a chair leg that will not sit flat.";
  byCode.ISTJ.best = "when the plan is followed, the work is solid, and nobody had to chase anyone.";
  byCode.ISTJ.undone = "when the rules change halfway through for reasons nobody bothered to explain.";
  byCode.ISTJ.chips = ["Shows up on time", "Reads the manual first", "Deeply distrusts shortcuts", "Keeps the receipts", "Quietly does the most"];
  byCode.ISTJ.often = ["George Washington", "Queen Elizabeth II", "Warren Buffett", "Natalie Portman", "Angela Merkel"];
  byCode.ISTJ.good = [
    "You do what you said you would do, and you have done it for so long that the people around you have quietly built their lives on top of that. They do not thank you for it because they have stopped noticing it, the way nobody thanks a floor.",
    "You catch the error. The number that does not reconcile, the clause that contradicts the other clause, the date that cannot be right: you find it because you actually read the thing, which almost nobody else did.",
    "And you are steady in the week where everything goes wrong. While other people are having reactions you are working out the order of operations, and the crisis gets smaller mainly because you refused to make it larger."
  ];
  byCode.ISTJ.snags = [
    "You hold everybody to a standard you never announced. It is obvious to you and invisible to them, and they keep failing a test they were not told they were sitting, and you keep concluding things about their character.",
    "You resist a change before you have finished hearing it. Some of that instinct is earned, because you have watched a great deal of enthusiasm turn into somebody else's cleanup. Some of it is simply that new is uncomfortable and you have dressed the discomfort up as judgement.",
    "And you carry it alone. Asking for help reads to you as an admission, so you absorb more and more until something gives, and the people who would gladly have taken half of it never even knew there was a load."
  ];
  byCode.ISTJ.closeUp = [
    "You are not going to say it often, and you have decided that is fine because you show it. You do show it: the car got serviced, the form got filed, the thing they mentioned in passing was quietly handled. That is love and you are fluent in it.",
    "The trouble is that the person you love may not read that dialect. They are waiting for the sentence, and you keep sending the deed, and both of you are certain you are being clear.",
    "Say it out loud sometimes anyway. Not because the deeds are insufficient. Because the words cost you almost nothing and they are worth an unreasonable amount to somebody who has been waiting for them."
  ];
  byCode.ISTJ.work = [
    "You are the reason things run. Give you a defined scope and a clear standard and you will hold it for years without supervision, and the organisation will slowly forget how much depends on you.",
    "You are worst under a manager who changes direction weekly and offers no reason. It is not the change. It is being asked to abandon finished work with no account of why, which reads to you as disrespect and often is.",
    "You are promoted late, because you do not campaign. Make a habit of writing down what you actually did each quarter and putting it somewhere visible. It will feel like boasting. It is not, it is correcting an error."
  ];
  byCode.ISTJ.oneThing = [
    "Say the standard out loud.",
    "When somebody does it the wrong way, tell them what the right way is and why, at the time, in one sentence. Not a rebuke. The reason. You have been silently marking people for years against a rule nobody ever gave them.",
    "You are not rigid, whatever you have been told. You are consistent, and consistency shared in advance is one of the most generous things there is. Kept private, it only ever reads as disapproval."
  ];

  byCode.ISFJ.opening = "You notice the coffee order before anyone asks and you already brought the umbrella because the forecast looked iffy. You will do this for years before it occurs to anyone that someone is doing it.";
  byCode.ISFJ.best = "when the people you look after are comfortable and do not even notice why.";
  byCode.ISFJ.undone = "when your quiet care gets mistaken for having no needs of your own.";
  byCode.ISFJ.chips = ["Remembers the details", "Stocks the emergency snacks", "Avoids the spotlight", "Holds the routine together", "Hurts quietly, for a while"];
  byCode.ISFJ.often = ["Mother Teresa", "Kate Middleton", "Rosa Parks", "Beyoncé", "Selena Gomez"];
  byCode.ISFJ.good = [
    "You notice what people need and you provide it before they have asked, and you have been doing it so long and so quietly that entire households and offices are running on it without knowing.",
    "You remember. Not facts particularly, but the things that matter to a person: the anniversary of the bad year, the food they cannot eat, the sibling they do not speak to. That memory makes people feel held in a way very little else does.",
    "And you stay. Through the illness, the divorce, the long boring middle of somebody's difficult decade, you are the one still turning up when the more dramatic supporters have moved on."
  ];
  byCode.ISFJ.snags = [
    "You cannot say no, and so you say yes and then pay for it privately. Nobody asked you to pay. They asked you to help, and they would have accepted no, and they will never know what the yes cost because you will not tell them.",
    "You take a small criticism and keep it for years. Something said carelessly in 2019 is still fully available to you, with the tone intact, and the person who said it could not be made to remember it under oath.",
    "And you decide that you have been taken for granted rather than mentioning that you feel taken for granted. The conclusion arrives long before the conversation does, and often instead of it."
  ];
  byCode.ISFJ.closeUp = [
    "You are the safest person your people have. Being loved by you means somebody is quietly keeping track of your wellbeing at all times, and most people go their whole lives without that.",
    "The risk is that you vanish inside it. Your preferences get smaller and smaller until whatever you like is genuinely difficult for you to name, and your partner, asking, gets whatever is easiest rather than whatever is true.",
    "Practise wanting something out loud. A specific restaurant. A particular evening. It is not selfish and it is not a burden, and the people who love you would very much like to give you something for once and cannot find the target."
  ];
  byCode.ISFJ.work = [
    "You are the institutional memory and the person who actually keeps it running, and neither of those appears in a job description or a performance review.",
    "You will do the work of a role well above yours and then not apply for that role, because you do not feel ready, and somebody less careful and more confident will get it and ask you how things work.",
    "Being reliable is not a career strategy on its own, which is unfair and also true. Say what you want, once, to the person who decides. That is the entire missing step."
  ];
  byCode.ISFJ.oneThing = [
    "Let one thing be done imperfectly by somebody else.",
    "Hand over a task you always do, and then do not check it, and do not quietly redo it afterwards. It will be worse. Let it be worse. The world absorbs it easily and nothing you feared actually happens.",
    "You are not indispensable because everything needs you. You have become indispensable because you never let anybody else learn, and that costs you far more than it costs them."
  ];

  byCode.ESTJ.opening = "You walk into a disorganised situation and within five minutes there is a list, an owner for each item, and a deadline. Someone suggests a workshop to discuss feelings about the process and you suggest doing the thing instead.";
  byCode.ESTJ.best = "when a messy situation gets a clear structure and everyone knows what happens next.";
  byCode.ESTJ.undone = "when people want to keep discussing a decision that was already made and is working fine.";
  byCode.ESTJ.chips = ["Makes the schedule", "States the obvious loudly", "Runs a tight ship", "Low patience for drama", "Shows love through logistics"];
  byCode.ESTJ.often = ["Judge Judy", "Lyndon B. Johnson", "Sonia Sotomayor", "Martha Stewart", "Hillary Clinton"];
  byCode.ESTJ.good = [
    "You walk into a mess and produce order out of it fast: a list, an owner for every item, a date. People complain about it and then follow it, because the alternative was another three weeks of nobody quite knowing.",
    "You say the thing everyone is thinking. It is not always comfortable but it collapses a great deal of wasted time, and the meetings you are in end when they should rather than an hour later.",
    "And you keep your word to a degree that has become slightly unusual. If you have said it will happen, people stop worrying about it, and that reliability is a genuine form of kindness even when it does not sound like one."
  ];
  byCode.ESTJ.snags = [
    "You decide it is settled before other people have finished having their say, and then experience their continuing to talk as inefficiency rather than as the ordinary process of somebody arriving at agreement.",
    "You mistake confidence for correctness in yourself and hesitation for weakness in others. Some of the best judgement in the room belongs to somebody who takes a while to speak, and you have talked over it more than once.",
    "And feelings look like an obstacle to you, something delaying the actual work. They are the actual work more often than you allow, and the projects that failed on you mostly failed on that, not on the plan."
  ];
  byCode.ESTJ.closeUp = [
    "You show up. Whatever is going on, you are there, with the practical thing handled, and that is worth an enormous amount and your family knows it even when they are annoyed with you.",
    "The difficulty is that you fix. Somebody brings you a hard day and you produce a solution and a schedule, and what they wanted was for you to sit there and agree that it was a hard day.",
    "Try just once saying that sounds awful, and then nothing. Do not append the plan. The plan can come tomorrow, and it will be better received tomorrow, and they will remember that you managed the silence."
  ];
  byCode.ESTJ.work = [
    "You are made for operational leadership. Anything that has drifted, you can take and have running properly inside a quarter, and there is always somewhere that needs exactly that.",
    "You are least effective where the work is genuinely ambiguous and the answer has to be discovered rather than decided. Your instinct there is to impose structure early, and early structure on a problem nobody understands yet is expensive.",
    "The people worth keeping close are the ones who slow you down without stopping you. You will find them irritating. That irritation is the value."
  ];
  byCode.ESTJ.oneThing = [
    "Ask one more question before you decide.",
    "Just one, and let it be a real one: what am I missing here. Then wait through the pause, which will be longer than you like, because the room has learned that you do not usually want an answer.",
    "You are not wrong very often. You are early quite a lot, and the cost of being early is a decision that had everything except the one fact somebody in the room was holding."
  ];

  byCode.ESFJ.opening = "You already know who is dating whom, who needs checking on, and what everyone is bringing to the party you organised. The plan changes at the last minute and you are the one holding it together while pretending it is fine.";
  byCode.ESFJ.best = "when everyone at the table is fed, included, and having a good time because you noticed what they needed.";
  byCode.ESFJ.undone = "when you have hosted, organised and smoothed everything over and someone still complains.";
  byCode.ESFJ.chips = ["Organises the group gift", "Checks in constantly", "Wants everyone included", "Takes criticism personally", "Keeps traditions alive"];
  byCode.ESFJ.often = ["Taylor Swift", "Jennifer Lopez", "Bill Clinton", "Sally Field", "Steve Harvey"];
  byCode.ESFJ.good = [
    "You hold groups together. The dinner happened, the leaving gift got bought, the person going through it got checked on, and every one of those was you, and the group experiences itself as close without knowing why.",
    "You read what a room needs socially and you supply it in real time. A gathering that would have been awkward is warm instead, and it looks effortless, and it is not.",
    "And you are practically useful in a crisis. Not abstractly supportive: food arrives, arrangements get made, somebody's mother gets collected from the station. You are the one who does the actual things."
  ];
  byCode.ESFJ.snags = [
    "You need to be liked more than you would care to admit, and it bends your decisions. You will avoid the correct unpopular position and find a compromise that keeps everyone comfortable and solves rather less.",
    "You take disagreement personally, quickly, and the other person is usually still discussing the topic while you have moved on to what it means about you.",
    "And you keep score without telling anybody the rules. You do a great deal for people, you never mention what you would like in return, and then you feel the imbalance keenly and quietly and for a long time."
  ];
  byCode.ESFJ.closeUp = [
    "You love in a very practical, daily way. You are affectionate and you are attentive and you make the ordinary days pleasant, which is underrated by almost everyone until they have lived without it.",
    "The failure mode is managing rather than asking. You will decide what your partner needs and provide it, and be hurt when it turns out to have been wrong, when a question would have settled it in four seconds.",
    "You also avoid the argument until it becomes the argument. Small maintenance conversations are far cheaper than the eventual one, and you are very good at everything except starting them."
  ];
  byCode.ESFJ.work = [
    "You are the social infrastructure of any team you join, and none of it will be in your objectives. Onboarding, morale, the difficult colleague, the birthday: it is real work and it is invisible work.",
    "You are excellent with clients and customers and anywhere the job is largely relationship, and you should aim there deliberately rather than ending up there by accident.",
    "The trap is being the office's emotional support and being valued for exactly as long as you provide it. Make sure at least some of your contribution is countable by somebody who has never met you."
  ];
  byCode.ESFJ.oneThing = [
    "Disagree once, out loud, and stay in the room.",
    "Pick something small and low stakes and say plainly that you see it differently, and then do not soften it, do not apologise for it and do not immediately find a compromise. Sit in the mild discomfort for a minute.",
    "You believe, somewhere, that disagreement costs you the relationship. It almost never does. Most people respect you more afterwards, and the ones who do not were never offering you very much."
  ];

  byCode.ISTP.opening = "The thing is in four pieces on the table and you have not said a word in ten minutes because you are working it out with your hands. Someone asks if you need help and you say no, out of habit, before you have actually checked.";
  byCode.ISTP.best = "when a broken thing is now a working thing and you barely had to think about it.";
  byCode.ISTP.undone = "when you are asked to narrate your feelings about something while you are still fixing it.";
  byCode.ISTP.chips = ["Fixes it, says nothing", "Needs space, often", "Calm in a crisis", "Learns by taking it apart", "Commits when it matters"];
  byCode.ISTP.often = ["Clint Eastwood", "Michael Jordan", "Bear Grylls", "Kristen Stewart", "Scarlett Johansson"];
  byCode.ISTP.good = [
    "You understand how things actually work, physically, and you got there by taking them apart rather than by reading about them. That knowledge is unusually durable, because you did not memorise it, you found it.",
    "You are calm exactly when it matters. The moment everybody else goes loud you go quiet and start working the problem, and it turns out that is the most useful thing anybody in the room can be doing.",
    "And you do not need managing. Point you at a broken thing and leave, and it will be fixed, and you will not have needed encouragement or a check-in or a conversation about how it is going."
  ];
  byCode.ISTP.snags = [
    "You say no before you have checked whether you wanted help, out of pure habit, and then do the whole thing alone in twice the time it needed.",
    "You go silent under pressure, which you experience as concentrating and everyone else experiences as being shut out. The people who care about you cannot tell the difference between you thinking and you leaving.",
    "And you disengage rather than argue. When something stops being worth it you simply withdraw, quietly and completely, and the other person often never gets told that the decision was made."
  ];
  byCode.ISTP.closeUp = [
    "You are much easier to be with than most people. Low maintenance, not dramatic, genuinely fine with quiet, and you turn up when it counts without needing to discuss it first.",
    "What is hard is that you will not narrate. Asked what you are feeling you answer honestly that you do not know yet, and that is true, and it is also not much to work with for somebody who is worried.",
    "Give the person something. Not the whole answer. I am annoyed and I do not know why yet is a complete and useful sentence, and it is worth ten of the shrug you would otherwise give."
  ];
  byCode.ISTP.work = [
    "You want your hands on something real and nobody standing over you. Given a concrete problem and space you are worth several people, and given a meeting about a process you are worth none.",
    "You are bad at the parts of a job that are performance: the update, the visibility, the reminding people what you did. Consequently your work is often better than your reputation.",
    "You will outgrow a role quietly and then leave rather than ask for the next one. Ask. It is a shorter conversation than the resignation and you have never once tried it."
  ];
  byCode.ISTP.oneThing = [
    "Say when you are going.",
    "Not why, not what you are feeling about it, and not for how long. Just that you are stepping back for a bit and that it is not about them. Six words, on the way out, before the silence starts.",
    "The withdrawing is not the problem. It is genuinely how you sort things out. The problem is that unannounced, it is indistinguishable from being abandoned, and people have read it that way for years."
  ];

  byCode.ISFP.opening = "You are not late, you are simply moving at the pace the afternoon deserves, and the plan can wait for you to finish the thought you are having. Somebody pushes for a decision right now and you quietly note that this is not how good decisions get made.";
  byCode.ISFP.best = "when you get to make something with your hands and nobody is rushing you.";
  byCode.ISFP.undone = "when your quiet pace gets read as not caring, which could not be further from true.";
  byCode.ISFP.chips = ["Notices small beauty", "Dislikes being managed", "Feels first, explains later", "Stubborn in a quiet way", "Kind without announcing it"];
  byCode.ISFP.often = ["Bob Dylan", "Frida Kahlo", "David Bowie", "Britney Spears", "Rihanna"];
  byCode.ISFP.good = [
    "You notice what things actually look and feel like. The room, the light, the fabric, the way somebody's face changed for half a second: you take in a quantity of detail that most people simply walk past.",
    "You make things, and the things you make have a quality that is hard to name and impossible to fake, because you were not working from a template, you were working from what felt right.",
    "And you are kind without any announcement. You do the considerate thing, quietly, without needing it observed, and you would be embarrassed if somebody made it into a story."
  ];
  byCode.ISFP.snags = [
    "You will not be hurried and you treat any pressure to hurry as an attack, which it usually is not. Somebody asking for a date is not always trying to manage you.",
    "You avoid the confrontation and then absorb the cost of avoiding it. The disagreement does not disappear, it moves inside, and it comes out weeks later in a form neither of you recognises as related.",
    "And you compare. Quietly, constantly, mostly against people whose work you admire, and it stops you starting far more often than it improves what you make."
  ];
  byCode.ISFP.closeUp = [
    "You are a devoted and undemanding partner and you love in specifics rather than declarations: the thing you noticed, the thing you made, the way you remembered what they said about a colour in March.",
    "The difficulty is that you go quiet when it is hard, and your silence is very hard to read from outside. It looks like indifference and it is almost always the opposite.",
    "What you need is somebody who does not push and does not vanish. You will not be argued into opening up and you will do it readily for somebody who simply stays nearby without asking."
  ];
  byCode.ISFP.work = [
    "You need work with some craft in it and a boss who gives you the outcome rather than the method. Told how to do it, you will comply and quietly stop caring, and the drop in quality will be obvious to everybody but nobody will connect it to the cause.",
    "You undersell yourself routinely. Your prices are too low, your CV is too modest and you assume that good work speaks, which it does, only much more quietly than a person does.",
    "Structure imposed from outside is not your enemy. The right deadline actually frees you. It is the wrong kind of supervision you cannot survive, and the two are worth telling apart."
  ];
  byCode.ISFP.oneThing = [
    "Show it before it is finished.",
    "One piece of work, at the stage you would normally hide it, to one person whose opinion you trust. Not for approval. For the practice of being seen mid-way, which is the thing you have organised your life around avoiding.",
    "You do not have a talent problem and you never did. You have a visibility problem, and it is entirely self-inflicted, and it is the only thing standing between the work and the people who would love it."
  ];

  byCode.ESTP.opening = "You said yes before anyone finished the sentence and you are already halfway out the door. Someone hands you the instructions and you set them aside, because you will figure it out on the way down.";
  byCode.ESTP.best = "when something is actually happening and you get to react to it in real time.";
  byCode.ESTP.undone = "when you are stuck reading the manual for something you would rather just be doing.";
  byCode.ESTP.chips = ["Skips the instructions", "Reads a room fast", "Bets on instinct", "Bored by long meetings", "Charms the room quickly"];
  byCode.ESTP.often = ["Donald Trump", "Madonna", "Jack Nicholson", "Eddie Murphy", "Ernest Hemingway"];
  byCode.ESTP.good = [
    "You read a live situation faster than anybody. What is actually happening, who is bluffing, where the room is about to go: you have it in seconds, and you act while everyone else is still gathering information.",
    "You are excellent in the moment things go wrong. No panic, no meeting, just movement, and it is worth an enormous amount in the specific hour when a plan has collapsed.",
    "And you make things happen. Ideas that would have died in discussion get done because you simply started, and a surprising amount of what exists around you exists for that reason."
  ];
  byCode.ESTP.snags = [
    "You commit before you have read it. The details you skipped are not usually important and occasionally they are extremely important, and you have paid for that at least twice in ways you do not talk about.",
    "You get bored and boredom makes you reckless. The risk you take on a slow Thursday is not calculated, it is a solution to the Thursday, and it is the one that tends to go badly.",
    "And you handle a difficult feeling by going and doing something. It works, in that the feeling goes quiet, and it does not go anywhere, and you have a fair amount of it stored up by now."
  ];
  byCode.ESTP.closeUp = [
    "You are enormously good fun to be with and generous with it. Life around you is more eventful and people are glad to be included, and that is a real thing to give somebody.",
    "The problem is depth. You are present and charming and you can go a very long time without ever saying anything difficult about yourself, and your partner eventually notices the shape of what is missing.",
    "Staying in a hard conversation is the whole skill for you. Not winning it, not fixing it, just not leaving the room. That is what would change things, and you already know it."
  ];
  byCode.ESTP.work = [
    "You want pace, contact with real people and a result you can see. Sales, trades, operations, anything live: you will beat more qualified people because you are willing to move.",
    "You are poorly suited to long planning cycles and you should stop pretending otherwise in interviews. The role where the payoff is in eighteen months will not hold you and you will leave and it will be nobody's fault.",
    "Your weakness is the paperwork behind the win, and it is worth simply hiring or delegating that rather than continuing to believe you will one day become the sort of person who enjoys it."
  ];
  byCode.ESTP.oneThing = [
    "Wait one day on the big one.",
    "Only the large decisions, and only twenty-four hours. Do not use it to reconsider. Use it to read the thing properly, once, all the way through, before you say yes.",
    "Your instinct is genuinely good and this is not about doubting it. It is that instinct plus one day of information beats instinct alone, and one day is a price you can easily afford."
  ];

  byCode.ESFP.opening = "You are the reason the small gathering turned into an actual night out, and you are still going when everyone else is checking their phone for a taxi. Someone mentions tomorrow's early start and you agree, cheerfully, without changing your plans at all.";
  byCode.ESFP.best = "when the room is loose, the mood is good, and you get to be right in the middle of it.";
  byCode.ESFP.undone = "when the fun stops and the quiet, practical parts of life are still waiting for you.";
  byCode.ESFP.chips = ["Turns errands into events", "Lives for the room's mood", "Terrible with paperwork", "Generous to a fault", "Cannot leave early"];
  byCode.ESFP.often = ["Marilyn Monroe", "Miley Cyrus", "Jamie Foxx", "Elvis Presley", "Justin Bieber"];
  byCode.ESFP.good = [
    "You make things enjoyable, on purpose, and that is a real skill and not a frivolous one. An ordinary evening becomes something people remember, and it happened because you decided it should.",
    "You are generous without keeping any account of it. You will give someone your time, your money and your last hour of energy and genuinely not think of it again.",
    "And you are warm in a way that includes people. You notice who is at the edge of the group and you bring them in, not out of duty but because it is more fun with them there, which is why it works."
  ];
  byCode.ESFP.snags = [
    "You avoid the unpleasant thing until it becomes an emergency. The letter, the bill, the conversation: none of it improved for waiting and all of it waited, and you knew at the time.",
    "You need the room's mood to be good and you will manage it at your own expense, staying too long, agreeing too fast, keeping things light when something heavier was called for.",
    "And you struggle to be alone with it. Quiet is where the things you have been outrunning catch up, so you fill the quiet, and the outrunning never quite ends."
  ];
  byCode.ESFP.closeUp = [
    "You are affectionate, present and enormously easy to love, and you make the person you are with feel like the most interesting one in the room, which they generally are not and gladly believe.",
    "Where it gets hard is that you will smooth over rather than address. Something is wrong, you make it a nice evening instead, and it works, and it is still wrong in the morning.",
    "The relationships that last for you are the ones with somebody willing to start the difficult conversation, because you will engage warmly and honestly once it has started. You just cannot be the one to start it."
  ];
  byCode.ESFP.work = [
    "You are at your best with people and in motion. Anything performing, teaching, selling, hosting or caring for people directly: you are better at it than people who trained for it.",
    "Admin will be the thing that undoes you. Not the work, the surrounding paperwork, and it is worth building a genuinely dull system for it early rather than continuing to rely on remembering.",
    "You are more capable than your reputation, because you have made it look like fun for so long that people mistake it for easy. Let some of the effort show occasionally."
  ];
  byCode.ESFP.oneThing = [
    "Do the dull thing first, once a week.",
    "One hour, at the start of the week rather than the end, on whatever you have been avoiding. Not all of it. One hour, then stop, then go and have a good day with the thing off your chest.",
    "You already know how to enjoy your life, better than nearly anyone. The only piece missing is the small regular hour that stops the avoided things stacking into the kind of week that ruins the rest."
  ];

  SG.types = { byCode: byCode, SECTIONS: SECTIONS };
}(typeof window !== "undefined" ? window : globalThis));
