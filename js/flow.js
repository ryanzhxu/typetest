(function (root) {
  "use strict";
  var SG = root.SG;

  function create() {
    var view = "intro";
    var queue = [];        /* items currently being asked */
    var index = 0;
    var responses = {};    /* axis -> array of numbers, 1-7 in pole space */
    var result = null;
    var tiebroken = {};    /* axis -> true once its tiebreak has been run */

    function resetResponses() {
      responses = {};
      SG.items.AXES.forEach(function (a) { responses[a] = []; });
    }

    function axisResults() {
      var out = {};
      SG.items.AXES.forEach(function (a) {
        out[a] = SG.score.axisResult(responses[a]);
      });
      return out;
    }

    function codeFrom(axes) {
      return SG.items.AXES.map(function (a) {
        return SG.items.POLES[a][axes[a].letterIndex];
      }).join("");
    }

    function flipped(code, axis) {
      var i = SG.items.AXES.indexOf(axis);
      var poles = SG.items.POLES[axis];
      var other = code[i] === poles[0] ? poles[1] : poles[0];
      return code.slice(0, i) + other + code.slice(i + 1);
    }

    function compute() {
      var axes = axisResults();
      var code = codeFrom(axes);

      var closeAxis = null;
      var nearest = Infinity;
      SG.items.AXES.forEach(function (a) {
        if (!axes[a].close) { return; }
        var d = Math.abs(axes[a].est - 50);
        if (d < nearest) { nearest = d; closeAxis = a; }
      });

      result = {
        code: code,
        closeAxis: closeAxis,
        secondCode: closeAxis ? flipped(code, closeAxis) : null,
        axes: axes
      };
      view = "reveal";
    }

    function record(value) {
      var item = queue[index];
      if (!item) { return; }
      responses[item.axis].push(value);
      index += 1;
      if (index >= queue.length) { compute(); }
    }

    return {
      state: function () {
        return {
          view: view,
          index: index,
          total: queue.length,
          item: queue[index] || null,
          result: result
        };
      },
      result: function () { return result; },
      start: function () {
        resetResponses();
        queue = SG.items.core.slice();
        index = 0;
        result = null;
        tiebroken = {};
        view = "question";
      },
      answer: function (value) { record(value); },
      /* Step back one question and hand the answer being undone to the caller,
         so the view can show it selected again. queue[index] after the
         decrement is the item whose answer this is, and its axis array holds
         that answer last, because pushes happen in queue order. Returns null
         when there is nothing to undo.

         A tiebreak run starts a fresh queue at index 0, so canBack is false on
         its first question. That is deliberate: stepping from a tiebreak back
         into the finished core run would pop an answer the result was already
         computed from. */
      back: function () {
        if (view !== "question" || index === 0) { return null; }
        index -= 1;
        var removed = responses[queue[index].axis].pop();
        /* Every asked item pushes a value, so the pop always finds one. The
           guard is here for the empty array, not for a missing answer. */
        return removed === undefined ? null : removed;
      },
      canBack: function () { return view === "question" && index > 0; },
      settle: function () {
        if (!result || !result.closeAxis) { return; }
        var axis = result.closeAxis;
        if (tiebroken[axis]) { return; }
        tiebroken[axis] = true;
        queue = SG.items.tiebreak.filter(function (it) { return it.axis === axis; });
        index = 0;
        view = "question";
      },
      canSettle: function () {
        return !!(result && result.closeAxis && !tiebroken[result.closeAxis]);
      },
      keepBoth: function () { view = "type"; },
      openType: function () { view = "type"; },
      reset: function () {
        view = "intro";
        queue = [];
        index = 0;
        result = null;
        tiebroken = {};
        resetResponses();
      }
    };
  }

  SG.flow = { create: create };
}(typeof window !== "undefined" ? window : globalThis));
