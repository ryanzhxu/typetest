(function (root) {
  "use strict";
  var SG = root.SG;

  function create() {
    var view = "intro";
    var queue = [];        /* items currently being asked */
    var index = 0;
    var responses = {};    /* axis -> array of number|null */
    var result = null;
    var phase = "core";    /* core | tiebreak */

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
        phase = "core";
        result = null;
        view = "question";
      },
      answer: function (value) { record(value); },
      skip: function () { record(null); },
      settle: function () {
        if (!result || !result.closeAxis) { return; }
        var axis = result.closeAxis;
        queue = SG.items.tiebreak.filter(function (it) { return it.axis === axis; });
        index = 0;
        phase = "tiebreak";
        view = "question";
      },
      keepBoth: function () { view = "type"; },
      openType: function () { view = "type"; },
      phase: function () { return phase; },
      reset: function () {
        view = "intro";
        queue = [];
        index = 0;
        result = null;
        phase = "core";
        resetResponses();
      }
    };
  }

  SG.flow = { create: create };
}(typeof window !== "undefined" ? window : globalThis));
