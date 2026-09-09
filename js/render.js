(function (root) {
  "use strict";
  var SG = root.SG;

  /* Every user-facing string on this page comes from js/i18n.js. The dot
     feedback, the seven-point scale words, the progress line and the number
     words all moved there when the Chinese locales arrived, because each of
     them differs per language in a way a shared implementation cannot hide:
     English spells its numerals out and Chinese uses digits. */

  /* js/flow.js and js/score.js speak pole space, where 1 is the first pole and
     7 the second. The screen speaks agreement, where 1 is Strongly agree. For
     an item showing its second pole those two run in opposite directions, so
     the value turns over here, at the view boundary, and nowhere else. That is
     what keeps js/score.js and every one of its tests untouched.

     8 - v is its own inverse, so the one function serves both directions. */
  function flip(value, item) {
    /* back() hands back null when there is nothing to undo. Nothing else
       reaches here without a value. */
    if (value === null || value === undefined) { return null; }
    if (!item || item.show !== "b") { return value; }
    return 8 - value;
  }

  function mount(flow) {
    var el = {
      navSixteen: document.getElementById("btn-nav-sixteen"),
      langSwitch: document.getElementById("lang-switch"),
      siteFooter: document.querySelector(".site-footer"),
      localeNotice: document.getElementById("locale-notice"),

      viewIntro: document.getElementById("view-intro"),
      viewQuestion: document.getElementById("view-question"),
      viewReveal: document.getElementById("view-reveal"),
      viewType: document.getElementById("view-type"),
      viewSixteen: document.getElementById("view-sixteen"),

      btnStart: document.getElementById("btn-start"),

      qProgress: document.getElementById("q-progress"),
      qProgressFill: document.getElementById("q-progress-fill"),
      qStatement: document.getElementById("q-statement"),
      qDots: document.getElementById("q-dots"),
      qFeedback: document.getElementById("q-feedback"),
      btnBack: document.getElementById("btn-back"),
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
      typeSections: document.getElementById("type-sections"),
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

    /* null until the reader picks a dot. There is no default: a pre-selected
       middle would leave Next clickable before the reader had chosen
       anything, and pressing it would record an answer nobody gave. */
    var pendingValue = null;
    var activeView = "intro";
    var firstRender = true;
    var focusedView = null;

    /* Same format as the generator's titleFor and rootTitle, so a client-side
       visit to /infj and a fresh load of /infj name the tab identically, in
       whichever language the page is in. */
    function rootTitle() { return SG.i18n.t("seo.rootTitle"); }

    function titleForCode(code) {
      var t = SG.i18n.type(code);
      return t ? SG.i18n.format("seo.title", { name: t.name, code: code }) : rootTitle();
    }

    /* Every in-app address carries the current locale, because the locale is
       the first path segment and js/i18n.js reads the address to decide what
       language a page is in. Passing a bare "/enfj" while reading Chinese
       would put an English URL over Chinese content. */
    function urlFor(rest) { return SG.i18n.pathFor(SG.i18n.current, rest); }

    function typeUrl(code) { return urlFor("/" + code.toLowerCase()); }

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
    function buildGallery() {
      el.galleryGrid.innerHTML = "";
      Object.keys(SG.types.byCode).sort().forEach(function (code) {
        var t = SG.i18n.type(code);
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "gallery-card";
        a.href = typeUrl(code);

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
          setUrl(typeUrl(code), { view: "type", code: code }, false, titleForCode(code));
          render();
        });

        li.appendChild(a);
        el.galleryGrid.appendChild(li);
      });
    }
    buildGallery();

    /* ---- the language switcher ---- */

    /* Real anchors, filled here and by the deploy generator from the same
       SG.i18n data, exactly as the gallery grid is: a crawler needs the links
       without running any JavaScript, and a plain click is still handled in
       place so a finished result survives a language change.

       Every offered locale appears, finished or not, because a locale nobody
       can click to is a locale nobody can review. SG.i18n.label marks an
       unfinished one in its own language, so a reader is told what they are
       getting before they choose it rather than after. Being offered is a
       separate question from being complete: complete is what a search engine
       is told, and it is still false for all three. */
    function buildLangSwitch() {
      el.langSwitch.innerHTML = "";
      var offered = SG.i18n.offered();
      el.langSwitch.hidden = offered.length < 2;
      if (el.langSwitch.hidden) { return; }
      var rest = SG.i18n.pathWithoutLocale(
        typeof location === "undefined" ? "/" : location.pathname
      );
      offered.forEach(function (loc) {
        var a = document.createElement("a");
        a.className = "lang-link";
        a.href = SG.i18n.pathFor(loc, rest);
        a.hreflang = SG.i18n.HTML_LANG[loc];
        a.lang = SG.i18n.HTML_LANG[loc];
        a.textContent = SG.i18n.label(loc);
        if (loc === SG.i18n.current) { a.setAttribute("aria-current", "true"); }
        a.addEventListener("click", function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) { return; }
          e.preventDefault();
          switchLocale(loc);
        });
        el.langSwitch.appendChild(a);
      });
    }

    /* Switching rewrites the page in place rather than reloading it, so a
       finished result survives the change. The address has to move with it:
       the locale lives in the first path segment and a reload of the old
       address would hand back the old language. */
    function switchLocale(loc) {
      var rest = SG.i18n.pathWithoutLocale(
        typeof location === "undefined" ? "/" : location.pathname
      );
      SG.i18n.apply(loc);
      buildGallery();
      var state = navCode ? { view: "type", code: navCode } : { view: "flow" };
      var title = navCode ? titleForCode(navCode) : rootTitle();
      /* pushState, not replace. Choosing a language is a navigation the
         reader made on purpose, and Back should undo it and hand them the
         language they came from. The popstate handler re-reads the locale out
         of the address for exactly that step. */
      setUrl(SG.i18n.pathFor(loc, rest), state, false, title);
      render();
    }

    /* ---- per-view rendering ---- */

    /* ---- the seven dots, built once ---- */

    /* One real radio per value, wrapped in its own label. Built here rather
       than written into index.html so the generator's page contract stays
       about the type view, and so the values and their labels cannot drift
       apart. Each carries the feedback string as its accessible name, which
       is the same string the old slider put in aria-valuetext. */
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

        /* data-i18n rather than a string set once: SG.i18n.applyTo rewrites
           it on a language change, so the accessible name of each dot never
           lags the language on screen. */
        var name = document.createElement("span");
        name.className = "visually-hidden";
        name.setAttribute("data-i18n", "feedback." + value);
        name.textContent = SG.i18n.t("feedback." + value);

        /* Choosing a dot only ever updates the reading. It never commits:
           the reader presses Next (or Enter) when the choice is the one they
           want to keep. */
        input.addEventListener("change", function () { setValue(value); });

        /* Preview only, never a commit: hovering or tabbing onto a dot shows
           what choosing it would mean, and leaving it falls back to whatever
           is actually chosen (or nothing, if that is null). Focus covers
           keyboard tabbing and touch, which do not fire mouseenter. */
        label.addEventListener("mouseenter", function () { showFeedback(value); });
        label.addEventListener("mouseleave", function () { showFeedback(pendingValue); });
        input.addEventListener("focus", function () { showFeedback(value); });
        input.addEventListener("blur", function () { showFeedback(pendingValue); });

        label.appendChild(input);
        label.appendChild(mark);
        label.appendChild(name);
        el.qDots.appendChild(label);
        dotInputs.push(input);
      }(v));
    }

    function showFeedback(value) {
      el.qFeedback.textContent = value === null ? "" : SG.i18n.t("feedback." + value);
    }

    function setValue(value) {
      pendingValue = value;
      dotInputs.forEach(function (input) {
        input.checked = Number(input.value) === value;
      });
      showFeedback(value);
      el.btnNext.disabled = value === null;
    }

    function advance() {
      var value = pendingValue;
      if (value === null) { return; }
      /* Read the item before answering, because answering moves the queue on. */
      var item = flow.state().item;
      pendingValue = null;
      flow.answer(flip(value, item));
      render();
    }

    function renderQuestion() {
      var state = flow.state();
      var item = state.item;
      if (!item) { return; }
      var remaining = state.total - state.index;
      el.qProgress.textContent = SG.i18n.progress(state.index, remaining);
      el.qProgressFill.style.width =
        (state.total ? (state.index / state.total) * 100 : 0) + "%";
      el.qStatement.textContent = SG.i18n.statement(item);
      /* pendingValue is null on the way forward and holds the undone answer
         on the way back, which is what puts that dot back under the reader. */
      setValue(pendingValue);
      el.btnBack.hidden = !flow.canBack();
      /* The word, not the button, is what changes on the last question. One
         id and one listener serve the whole run, and the reader still has to
         press before anything is recorded. A tiebreak run is its own queue,
         so its last question says the same thing. */
      el.btnNext.textContent =
        SG.i18n.t(state.index === state.total - 1 ? "question.finish" : "question.next");
    }

    function renderReveal() {
      var result = flow.result();
      if (!result) { return; }
      var t = SG.i18n.type(result.code);
      el.revealCode.textContent = result.code;
      el.revealName.textContent = t.name;
      el.revealLine.textContent = t.line;

      if (result.closeAxis) {
        var secondT = SG.i18n.type(result.secondCode);
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
      var t = SG.i18n.type(code);
      el.typeCode.textContent = code;
      el.typeName.textContent = t.name;
      el.typeOpening.textContent = t.opening;
      el.typeBest.textContent = SG.i18n.format("type.best", { clause: t.best });
      el.typeUndone.textContent = SG.i18n.format("type.undone", { clause: t.undone });

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

      /* The generator ships these in the static HTML so a crawler reads them
         without running any JavaScript. Clear before rebuilding, exactly as
         the gallery does, or a client-side visit to a second type would
         append its sections underneath the first type's. */
      el.typeSections.innerHTML = "";
      SG.i18n.sections().forEach(function (section) {
        var wrap = document.createElement("section");
        wrap.className = "type-section";

        var h = document.createElement("h3");
        h.textContent = section.heading;
        wrap.appendChild(h);

        t[section.key].forEach(function (paragraph) {
          var p = document.createElement("p");
          p.className = "type-paragraph";
          p.textContent = paragraph;
          wrap.appendChild(p);
        });

        el.typeSections.appendChild(wrap);
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
      setUrl(typeUrl(result.code), { view: "result", code: result.code }, true,
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
      buildLangSwitch();

      VIEWS.forEach(function (v) {
        SECTION_BY_VIEW[v].hidden = (v !== activeView);
      });
      el.navSixteen.hidden = !(activeView === "intro" || activeView === "type");
      /* The question view is the one screen that is centred and thumb-critical,
         and the only one where extra chrome would push the card off the
         middle. The reader has already passed the notice on the way in, and
         the switcher is not something anyone needs mid-question. */
      el.siteFooter.hidden = (activeView === "question");
      el.localeNotice.hidden =
        SG.i18n.isComplete(SG.i18n.current) || activeView === "question";

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

    el.btnNext.addEventListener("click", function () {
      advance();
    });

    el.btnBack.addEventListener("click", function () {
      /* back() hands over a pole-space value and only then is the queue
         standing on the earlier item, so the item to un-flip against is the
         one read after the call, never before it. */
      pendingValue = flip(flow.back(), flow.state().item);
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
      setUrl(urlFor("/"), { view: "flow" }, true, rootTitle());
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
        setUrl(urlFor("/"), { view: "flow" }, true, rootTitle());
      }
      render();
    });

    el.btnTakeTest.addEventListener("click", function () {
      nav = null;
      navCode = null;
      pendingValue = null;
      /* pushState, so Back returns to the type page they came from. */
      setUrl(urlFor("/"), { view: "flow" }, false, rootTitle());
      flow.start();
      render();
    });

    /* The gallery overlay has no URL of its own in this piece, so only real
       type pages and the root create history entries. A null state means the
       entry this page was loaded on. */
    window.addEventListener("popstate", function (e) {
      var s = e.state;
      /* Stepping back across a language change lands on an address whose
         first segment names a different locale, so the language is re-read
         from the address before anything is painted. */
      if (SG.i18n.detect(location.pathname) !== SG.i18n.current) {
        SG.i18n.apply(SG.i18n.detect(location.pathname));
        buildGallery();
      }
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
        document.title = rootTitle();
      } else {
        nav = INITIAL_NAV;
        navCode = INITIAL_CODE;
        document.title = INITIAL_NAV === "type" ? titleForCode(INITIAL_CODE) : rootTitle();
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
        setValue(Number(e.key));
        dotInputs[Number(e.key) - 1].focus();
      } else if (e.key === "Enter") {
        if (tag === "BUTTON") { return; }
        e.preventDefault();
        advance();
      }
    });

    render();
  }

  SG.render = { mount: mount, flip: flip };
}(typeof window !== "undefined" ? window : globalThis));
