(function (root) {
  "use strict";
  var SG = root.SG;

  /* Slider feedback describes the answer just given, never the emerging type. */
  var FEEDBACK = [
    "Strongly the first one",
    "Mostly the first one",
    "Leans the first way",
    "Somewhere in the middle",
    "Leans the second way",
    "Mostly the second one",
    "Strongly the second one"
  ];

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
      qStatementA: document.getElementById("q-statement-a"),
      qStatementB: document.getElementById("q-statement-b"),
      qSlider: document.getElementById("q-slider"),
      qFeedback: document.getElementById("q-feedback"),
      btnSkip: document.getElementById("btn-skip"),
      btnNext: document.getElementById("btn-next"),

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
    var pendingValue = 4;
    var activeView = "intro";

    /* ---- gallery grid, built once from static data ---- */
    Object.keys(SG.types.byCode).sort().forEach(function (code) {
      var t = SG.types.byCode[code];
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-card";

      var codeEl = document.createElement("span");
      codeEl.className = "gallery-code";
      codeEl.textContent = code;

      var nameEl = document.createElement("span");
      nameEl.className = "gallery-name";
      nameEl.textContent = t.name;

      var lineEl = document.createElement("span");
      lineEl.className = "gallery-line";
      lineEl.textContent = t.line;

      btn.appendChild(codeEl);
      btn.appendChild(nameEl);
      btn.appendChild(lineEl);
      btn.addEventListener("click", function () {
        nav = "type";
        navCode = code;
        render();
      });

      li.appendChild(btn);
      el.galleryGrid.appendChild(li);
    });

    /* ---- per-view rendering ---- */

    function setSliderValue(value) {
      pendingValue = value;
      el.qSlider.value = String(value);
      el.qFeedback.textContent = FEEDBACK[value - 1];
      el.qSlider.setAttribute("aria-valuetext", FEEDBACK[value - 1]);
    }

    function renderQuestion() {
      var state = flow.state();
      var item = state.item;
      if (!item) { return; }
      var remaining = state.total - state.index;
      el.qProgress.textContent =
        cap(numberWords(state.index)) + " down, " + numberWords(remaining) + " to go";
      el.qStatementA.textContent = item.a;
      el.qStatementB.textContent = item.b;
      setSliderValue(4);
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
        el.shareBlock.hidden = true;
        el.btnRestart.hidden = true;
        return;
      }
      var result = flow.result();
      if (!result) { return; }
      renderTypeContent(result.code);
      el.btnBackGallery.hidden = true;
      el.shareBlock.hidden = false;
      el.btnRestart.hidden = false;
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

      focusView(activeView);
    }

    /* ---- wiring ---- */

    el.btnStart.addEventListener("click", function () {
      nav = null;
      flow.start();
      render();
    });

    el.qSlider.addEventListener("input", function () {
      setSliderValue(Number(el.qSlider.value));
    });

    el.btnNext.addEventListener("click", function () {
      flow.answer(pendingValue);
      render();
    });

    el.btnSkip.addEventListener("click", function () {
      flow.skip();
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
      flow.reset();
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
      render();
    });

    document.addEventListener("keydown", function (e) {
      if (activeView !== "question") { return; }
      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        setSliderValue(Number(e.key));
        el.qSlider.focus();
      } else if (e.key === "Enter") {
        if (tag === "BUTTON") { return; }
        e.preventDefault();
        flow.answer(pendingValue);
        render();
      }
    });

    render();
  }

  SG.render = { mount: mount };
}(typeof window !== "undefined" ? window : globalThis));
