(function (root) {
  "use strict";
  var SG = root.SG;

  /* Responses are 1-7 across seven dots between two poles. 1 is the first
     pole, 7 is the second. Every asked question produces one: there is no way
     to decline a question, so there is no missing answer to account for. */

  var SD_FLOOR = 0.35;     /* on the -1..1 response scale */
  var HALF_MIN = 4;        /* an honest floor: nine questions is never certainty */
  var HALF_MAX = 50;       /* the whole axis */
  var Z = 1.96;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function axisResult(responses) {
    /* An axis nobody has answered is the whole axis wide. The flow never asks
       for one, but a caller may, and the maths below would return NaN. */
    if (responses.length === 0) {
      return { est: 50, half: HALF_MAX, close: true, letterIndex: 1 };
    }

    /* Map 1..7 to -1..+1 */
    var xs = responses.map(function (r) { return (r - 4) / 3; });
    var mean = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;

    var variance = xs.length < 2 ? 0 :
      xs.reduce(function (a, x) { return a + (x - mean) * (x - mean); }, 0) / (xs.length - 1);
    var sd = Math.max(Math.sqrt(variance), SD_FLOOR);
    var se = sd / Math.sqrt(xs.length);

    var est = clamp(50 + 50 * mean, 0, 100);
    var half = clamp(50 * Z * se, HALF_MIN, HALF_MAX);

    return {
      est: est,
      half: half,
      close: (est - half) < 50 && (est + half) > 50,
      letterIndex: est >= 50 ? 1 : 0
    };
  }

  SG.score = {
    axisResult: axisResult,
    SD_FLOOR: SD_FLOOR,
    HALF_MIN: HALF_MIN,
    HALF_MAX: HALF_MAX
  };
}(typeof window !== "undefined" ? window : globalThis));
