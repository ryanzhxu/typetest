(function (root) {
  "use strict";
  var SG = root.SG;

  /* Dot feedback describes the answer just given, never the emerging type.
     The middle reads "Both, equally" and not "neither": in js/score.js it
     counts as a real answer and narrows the honesty band, while the skip
     beside it counts as none and widens it. Two controls that sit together
     and do opposite things have to say so. */
  var FEEDBACK = [
    "Strongly the first one",
    "Mostly the first one",
    "Leans the first way",
    "Both, equally",
    "Leans the second way",
    "Mostly the second one",
    "Strongly the second one"
  ];

  /* How long a chosen dot stays on screen before the next question replaces
     it. Long enough to see the choice land, short enough not to be a wait.
     Tests set it to 0: at the default, thirty-six questions is nine seconds
     of sleeping per run. */
  var ADVANCE_MS = 250;

  var ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"
  ];
  var TENS = ["", "", "twenty", "thirty"];

  /* Number to words, 0 through 36. Words in English so progress reads like a
     person talking, never like a counter. */
  function numberWords(n) {
    if (n < 20) { return ONES[n]; }
    var ten = Math.floor(n / 10);
    var one = n % 10;
    return one === 0 ? TENS[ten] : TENS[ten] + "-" + ONES[one];
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function mount(flow) {
    var el = {
      navSixteen: document.getElementById("btn-nav-sixteen"),

      viewIntro: document.getElementById("view-intro"),
      viewQuestion: document.getElementById("view-question"),
      viewReveal: document.getElementById("view-reveal"),
      viewType: document.getElementById("view-type"),
      viewSixteen: document.getElementById("view-sixteen"),

      btnStart: document.getElementById("btn-start"),

      qProgress: document.getElementById("q-progress"),
      qProgressFill: document.getElementById("q-progress-fill"),
      qStatementA: document.getElementById("q-statement-a"),
      qStatementB: document.getElementById("q-statement-b"),
      qDots: document.getElementById("q-dots"),
      qFeedback: document.getElementById("q-feedback"),
      btnSkip: document.getElementById("btn-skip"),
      btnBack: document.getElementById("btn-back"),

      revealCode: document.getElementById("reveal-code"),
      revealName: document.getElementById("reveal-name"),
      revealLine: document.getElementById("reveal-line"),
      secondSelfCard: document.getElementById("second-self-card"),
      secondSelfName: document.getElementById("second-self-name"),
      blendPeach: document.getElementById("blend-peach"),
      blendLilac: document.getElementById("blend-lilac"),
      btnSettle: document.getElementById("btn-settle"),
      btnKeepBoth: document.getElementById("btn-keep-both"),
      btnContinue: document.getElementById("btn-continue"),

      btnBackGallery: document.getElementById("btn-back-gallery"),
      typeCode: document.getElementById("type-code"),
      typeName: document.getElementById("type-name"),
      typeOpening: document.getElementById("type-opening"),
      typeBest: document.getElementById("type-best"),
      typeUndone: document.getElementById("type-undone"),
      typeChips: document.getElementById("type-chips"),
      typeOften: document.getElementById("type-often"),
      shareBlock: document.getElementById("share-block"),
      btnRestart: document.getElementById("btn-restart"),
      typeTestCta: document.getElementById("type-test-cta"),
      btnTakeTest: document.getElementById("btn-take-test"),

      btnBackFlow: document.getElementById("btn-back-flow"),
      galleryGrid: document.getElementById("gallery-grid")
    };

    var VIEWS = ["intro", "question", "reveal", "type", "sixteen"];
    var SECTION_BY_VIEW = {
      intro: el.viewIntro,
      question: el.viewQuestion,
      reveal: el.viewReveal,
      type: el.viewType,
      sixteen: el.viewSixteen
    };

    /* The gallery is a browsing overlay on top of the flow, not a flow state.
       nav is null while the flow drives the view, "gallery" for the grid, or
       "type" while reading one type's page read-only (navCode names it). */
    var nav = null;
    var navCode = null;

    /* Generated per-type pages carry data-initial-type, so /enfj opens on the
       type view. The generator has already flipped the hidden attributes, so
       there is nothing to paint over: this only tells the JS which page it is
       on. An unknown value falls through to the intro rather than throwing. */
    var initialType = document.body.getAttribute("data-initial-type");
    if (initialType && SG.types.byCode[initialType]) {
      nav = "type";
      navCode = initialType;
    }
    var INITIAL_NAV = nav;
    var INITIAL_CODE = navCode;

    /* null until the reader picks a dot. There is no default any more: with
       no Next button to press past, a pre-selected middle would record an
       answer nobody gave. */
    var pendingValue = null;
    var advanceTimer = null;
    var activeView = "intro";
    var firstRender = true;
    var focusedView = null;

    var ROOT_TITLE = "Personality";

    /* Same format as the generator's titleFor, so a client-side visit to /infj
       and a fresh load of /infj name the tab identically. */
    function titleForCode(code) {
      var t = SG.types.byCode[code];
      return t ? t.name + " (" + code + ")" : ROOT_TITLE;
    }

    /* file:// has an opaque origin, so the History API throws there. The site
       must still open by double-clicking index.html, so every call is wrapped
       and the app carries on without a URL change. The title is set outside
       the try: the tab, the bookmark name and every entry in the Back menu
       are this string, and it must be right even where history is not. */
    function setUrl(pathname, state, replace, title) {
      document.title = title;
      try {
        history[replace ? "replaceState" : "pushState"](state, "", pathname);
      } catch (e) {
        /* filesystem or sandboxed origin. The view is already correct. */
      }
    }

    /* ---- gallery grid, built once from static data ---- */

    /* Real anchors, not buttons. A crawler needs links to find the sixteen
       pages, and middle-click and "copy link address" should work. A plain
       left click is still handled in place, so flow state survives browsing:
       a full page load here would throw away someone's finished result. */

    /* The generator ships these sixteen cards in the static HTML so a crawler
       sees them. Clear them before rebuilding, or every card would appear
       twice. Rebuilding identical anchors is what attaches the listeners. */
    el.galleryGrid.innerHTML = "";
    Object.keys(SG.types.byCode).sort().forEach(function (code) {
      var t = SG.types.byCode[code];
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "gallery-card";
      a.href = "/" + code.toLowerCase();

      var codeEl = document.createElement("span");
      codeEl.className = "gallery-code";
      codeEl.textContent = code;

      var nameEl = document.createElement("span");
      nameEl.className = "gallery-name";
      nameEl.textContent = t.name;

      var lineEl = document.createElement("span");
      lineEl.className = "gallery-line";
      lineEl.textContent = t.line;

      a.appendChild(codeEl);
      a.appendChild(nameEl);
      a.appendChild(lineEl);
      a.addEventListener("click", function (e) {
        /* Never swallow a modified click: those mean "open it properly". */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) { return; }
        e.preventDefault();
        nav = "type";
        navCode = code;
        setUrl("/" + code.toLowerCase(), { view: "type", code: code }, false, titleForCode(code));
        render();
      });

      li.appendChild(a);
      el.galleryGrid.appendChild(li);
    });

    /* ---- per-view rendering ---- */

    /* ---- the seven dots, built once ---- */

    /* One real radio per value, wrapped in its own label. Built here rather
       than written into index.html so the generator's page contract stays
       about the type view, and so the values and their labels cannot drift
       apart. FEEDBACK is the accessible name of each dot, the same string the
       old slider put in aria-valuetext. */
    var dotInputs = [];
    for (var v = 1; v <= 7; v += 1) {
      (function (value) {
        var label = document.createElement("label");
        label.className = "dot dot-" + value;

        var input = document.createElement("input");
        input.type = "radio";
        input.name = "q-value";
        input.value = String(value);

        var mark = document.createElement("span");
        mark.className = "dot-mark";

        var name = document.createElement("span");
        name.className = "visually-hidden";
        name.textContent = FEEDBACK[value - 1];

        /* Both events only ever update the reading. What commits is a
           pointer, and detail is how that is known: it is the click count,
           so a real mouse click or a tap carries 1 and a click the keyboard
           synthesised carries 0. Chromium fires a trusted click when an
           arrow key walks a radio group, so advancing on any click at all
           would end keyboard answering at the first arrow press. Measured in
           Chromium: arrow 0, Space 0, mouse 1, touch tap 1. The keyboard
           commits with Enter instead, below. */
        input.addEventListener("change", function () { setValue(value); });
        input.addEventListener("click", function (e) {
          setValue(value);
          if (e.detail > 0) { scheduleAdvance(); }
        });

        label.appendChild(input);
        label.appendChild(mark);
        label.appendChild(name);
        el.qDots.appendChild(label);
        dotInputs.push(input);
      }(v));
    }

    function setValue(value) {
      pendingValue = value;
      dotInputs.forEach(function (input) {
        input.checked = Number(input.value) === value;
      });
      el.qFeedback.textContent = value === null ? "" : FEEDBACK[value - 1];
    }

    function advance() {
      var value = pendingValue;
      if (value === null) { return; }
      pendingValue = null;
      flow.answer(value);
      render();
    }

    function cancelAdvance() {
      if (advanceTimer === null) { return; }
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }

    /* A second dot chosen inside the window replaces the first, rather than
       queueing a second advance that would skip the following question. */
    function scheduleAdvance() {
      cancelAdvance();
      advanceTimer = setTimeout(function () {
        advanceTimer = null;
        advance();
      }, SG.render.ADVANCE_MS);
    }

    function renderQuestion() {
      var state = flow.state();
      var item = state.item;
      if (!item) { return; }
      var remaining = state.total - state.index;
      el.qProgress.textContent =
        cap(numberWords(state.index)) + " down, " + numberWords(remaining) + " to go";
      el.qProgressFill.style.width =
        (state.total ? (state.index / state.total) * 100 : 0) + "%";
      el.qStatementA.textContent = item.a;
      el.qStatementB.textContent = item.b;
      /* pendingValue is null on the way forward and holds the undone answer
         on the way back, which is what puts that dot back under the reader. */
      setValue(pendingValue);
      el.btnBack.hidden = !flow.canBack();
    }

    function renderReveal() {
      var result = flow.result();
      if (!result) { return; }
      var t = SG.types.byCode[result.code];
      el.revealCode.textContent = result.code;
      el.revealName.textContent = t.name;
      el.revealLine.textContent = t.line;

      if (result.closeAxis) {
        var secondT = SG.types.byCode[result.secondCode];
        var axis = result.axes[result.closeAxis];
        /* Peach is the user's own letter. est measures distance toward pole
           1, so est only IS the user's share when letterIndex is 1; when
           letterIndex is 0 the user's own letter is pole 0 and their true
           share is the other end, 100 - est. Do not simplify this back to
           est alone. */
        var yourShare = Math.round(axis.letterIndex === 1 ? axis.est : 100 - axis.est);
        el.secondSelfName.textContent = secondT.name;
        el.blendPeach.style.width = yourShare + "%";
        el.blendLilac.style.width = (100 - yourShare) + "%";
        el.secondSelfCard.hidden = false;
        el.btnSettle.hidden = !flow.canSettle();
        el.btnContinue.hidden = true;
      } else {
        el.secondSelfCard.hidden = true;
        el.btnContinue.hidden = false;
      }
    }

    function renderTypeContent(code) {
      var t = SG.types.byCode[code];
      el.typeCode.textContent = code;
      el.typeName.textContent = t.name;
      el.typeOpening.textContent = t.opening;
      el.typeBest.textContent = "You are at your best " + t.best;
      el.typeUndone.textContent = "You come undone " + t.undone;

      el.typeChips.innerHTML = "";
      t.chips.forEach(function (chip) {
        var li = document.createElement("li");
        li.textContent = chip;
        el.typeChips.appendChild(li);
      });

      el.typeOften.innerHTML = "";
      t.often.forEach(function (name) {
        var li = document.createElement("li");
        li.textContent = name;
        el.typeOften.appendChild(li);
      });
    }

    function renderType() {
      if (nav === "type") {
        renderTypeContent(navCode);
        el.btnBackGallery.hidden = false;
        el.typeTestCta.hidden = false;
        el.shareBlock.hidden = true;
        el.btnRestart.hidden = true;
        return;
      }
      var result = flow.result();
      if (!result) { return; }
      renderTypeContent(result.code);
      el.btnBackGallery.hidden = true;
      /* Start over and the share card already occupy this slot on a result. */
      el.typeTestCta.hidden = true;
      el.shareBlock.hidden = false;
      el.btnRestart.hidden = false;
      /* The result now has an address worth sending. replaceState, not push,
         so Back does not walk the reveal again. */
      setUrl("/" + result.code.toLowerCase(), { view: "result", code: result.code }, true,
        titleForCode(result.code));
      if (SG.share && SG.share.setResult) { SG.share.setResult(result); }
    }

    function computeActiveView() {
      if (nav === "gallery") { return "sixteen"; }
      if (nav === "type") { return "type"; }
      return flow.state().view;
    }

    function focusView(view) {
      var section = SECTION_BY_VIEW[view];
      var heading = section && section.querySelector("h1, h2");
      if (!heading) { return; }
      if (!heading.hasAttribute("tabindex")) { heading.setAttribute("tabindex", "-1"); }
      heading.focus();
    }

    function render() {
      activeView = computeActiveView();

      VIEWS.forEach(function (v) {
        SECTION_BY_VIEW[v].hidden = (v !== activeView);
      });
      el.navSixteen.hidden = !(activeView === "intro" || activeView === "type");

      if (activeView === "question") { renderQuestion(); }
      else if (activeView === "reveal") { renderReveal(); }
      else if (activeView === "type") { renderType(); }

      /* Moving focus is right when a view changes under the reader. It is
         wrong on the first paint of any page, where nothing has changed and
         the reader has not acted yet: the ring lands on the heading before
         anyone touches the page, and then clears on their first click, which
         reads as a glitch rather than as focus.

         It is also wrong from one question to the next, where the view is the
         same one and only its words changed: that would pull focus off the
         dot the reader is standing on and end keyboard answering after a
         single question. The statements are a live region, so a screen reader
         is told about the new question without focus having to move. */
      if (firstRender) {
        firstRender = false;
        focusedView = activeView;
        return;
      }
      if (activeView === focusedView) { return; }
      focusedView = activeView;
      focusView(activeView);
    }

    /* ---- wiring ---- */

    el.btnStart.addEventListener("click", function () {
      nav = null;
      pendingValue = null;
      flow.start();
      render();
    });

    el.btnSkip.addEventListener("click", function () {
      cancelAdvance();
      pendingValue = null;
      flow.skip();
      render();
    });

    el.btnBack.addEventListener("click", function () {
      cancelAdvance();
      pendingValue = flow.back();
      render();
    });

    el.btnSettle.addEventListener("click", function () {
      flow.settle();
      render();
    });

    el.btnKeepBoth.addEventListener("click", function () {
      flow.keepBoth();
      render();
    });

    el.btnContinue.addEventListener("click", function () {
      flow.openType();
      render();
    });

    el.btnRestart.addEventListener("click", function () {
      nav = null;
      pendingValue = null;
      flow.reset();
      /* The result's URL no longer describes what is on screen, and a reload
         would hand back that type page instead of the test. replaceState, not
         push, so Back does not walk into the result they just discarded. */
      setUrl("/", { view: "flow" }, true, ROOT_TITLE);
      render();
    });

    el.navSixteen.addEventListener("click", function () {
      nav = "gallery";
      render();
    });

    el.btnBackGallery.addEventListener("click", function () {
      nav = "gallery";
      navCode = null;
      render();
    });

    el.btnBackFlow.addEventListener("click", function () {
      nav = null;
      /* Back lands on whatever the flow is showing. Only the intro has a URL
         of its own, so only then is the address bar wrong. Mid-test or on a
         result, leave it alone: renderType owns the result's URL. */
      if (flow.state().view === "intro") {
        setUrl("/", { view: "flow" }, true, ROOT_TITLE);
      }
      render();
    });

    el.btnTakeTest.addEventListener("click", function () {
      nav = null;
      navCode = null;
      pendingValue = null;
      /* pushState, so Back returns to the type page they came from. */
      setUrl("/", { view: "flow" }, false, ROOT_TITLE);
      flow.start();
      render();
    });

    /* The gallery overlay has no URL of its own in this piece, so only real
       type pages and the root create history entries. A null state means the
       entry this page was loaded on. */
    window.addEventListener("popstate", function (e) {
      var s = e.state;
      if (s && s.view === "type") {
        nav = "type";
        navCode = s.code;
        document.title = titleForCode(s.code);
      } else if (s && s.view === "result") {
        nav = null;
        navCode = null;
        document.title = titleForCode(s.code);
      } else if (s && s.view === "flow") {
        nav = null;
        navCode = null;
        document.title = ROOT_TITLE;
      } else {
        nav = INITIAL_NAV;
        navCode = INITIAL_CODE;
        document.title = INITIAL_NAV === "type" ? titleForCode(INITIAL_CODE) : ROOT_TITLE;
      }
      render();
    });

    /* 1-7 chooses without committing, the same as an arrow key, so a
       mistyped digit can be corrected. Enter commits. */
    document.addEventListener("keydown", function (e) {
      if (activeView !== "question") { return; }
      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        cancelAdvance();
        setValue(Number(e.key));
        dotInputs[Number(e.key) - 1].focus();
      } else if (e.key === "Enter") {
        if (tag === "BUTTON") { return; }
        e.preventDefault();
        cancelAdvance();
        advance();
      }
    });

    render();
  }

  SG.render = { mount: mount, ADVANCE_MS: ADVANCE_MS };
}(typeof window !== "undefined" ? window : globalThis));
