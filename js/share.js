(function (root) {
  "use strict";
  var SG = root.SG;

  /* Share card: a 1080x1350 PNG someone can post after taking the test.
     Canvas and Font Loading APIs only exist in a browser, so every use of
     document/navigator/canvas lives inside a function body, never at the
     top level, and the file loads cleanly under Node's require(). */

  var CANVAS_W = 1080;
  var CANVAS_H = 1350;
  var MARGIN = 96;
  var MAX_W = CANVAS_W - MARGIN * 2;
  var CENTER_X = CANVAS_W / 2;

  var GROUND = "#17141F";
  var TEXT = "#F3EDE3";
  var TEXT_MUTED = "rgba(243, 237, 227, 0.7)";
  var PEACH = "#F2A17B";
  var LILAC = "#ABA0EA";

  /* Draws one character at a time so the letters read as spaced out,
     regardless of whether the browser supports ctx.letterSpacing. */
  function drawSpaced(ctx, text, cx, y, spacing) {
    var chars = text.split("");
    var widths = chars.map(function (c) { return ctx.measureText(c).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + spacing * (chars.length - 1);
    var x = cx - total / 2;
    var prevAlign = ctx.textAlign;
    ctx.textAlign = "left";
    chars.forEach(function (c, i) {
      ctx.fillText(c, x, y);
      x += widths[i] + spacing;
    });
    ctx.textAlign = prevAlign;
  }

  /* Assumes ctx.font is already set to the size being measured against. */
  function wrapLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var current = "";
    words.forEach(function (word) {
      var attempt = current ? current + " " + word : word;
      if (current && ctx.measureText(attempt).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = attempt;
      }
    });
    if (current) { lines.push(current); }
    return lines;
  }

  /* Shrinks the headline until it fits on one line rather than wrapping,
     so a long type name never overruns the card. */
  function fitHeadlineSize(ctx, text, maxWidth, family, startSize, minSize) {
    var size = startSize;
    while (size > minSize) {
      ctx.font = size + "px " + family;
      if (ctx.measureText(text).width <= maxWidth) { return size; }
      size -= 2;
    }
    ctx.font = minSize + "px " + family;
    return minSize;
  }

  /* Joins 2-3 short phrases the way a person would say them out loud:
     "a and b", or "a, b and c". Not used for 1 item or 4, which get their
     own wording below. */
  function joinNatural(items) {
    if (items.length === 2) { return items[0] + " and " + items[1]; }
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  /* result.closeAxis is only the single nearest close axis, kept for the
     second-self mechanic. The caveat sentence needs the true count of close
     axes, so it is counted here rather than assumed to be one. */
  function caveatLine(result, type) {
    if (!result.closeAxis) { return type.line; }

    var axes = result.axes;
    var close = SG.items.AXES.filter(function (a) { return axes[a].close; });

    if (close.length === 1) {
      var poles = SG.items.POLES[close[0]];
      return "Solid on three. My " + poles[0] + " and " + poles[1] + " sat on the line.";
    }
    if (close.length === 4) {
      return "Nothing was solid this time. All four sat on the line.";
    }

    var solidWord = close.length === 2 ? "two" : "one";
    var labels = close.map(function (a) { return SG.items.POLES[a].join("/"); });
    return "Solid on " + solidWord + ". My " + joinNatural(labels) + " sat on the line.";
  }

  function buildCanvas(result, frauncesLoaded) {
    var canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    var ctx = canvas.getContext("2d");

    /* Checked face wins; otherwise draw with the same fallback app.css
       uses for --font-display, rather than throw. */
    var headlineFamily = frauncesLoaded ? "Fraunces, Georgia, serif" : "Georgia, serif";
    var bodyFamily = "Karla, sans-serif";

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    var type = SG.types.byCode[result.code];
    var cursorY = 300;

    var codeSize = fitHeadlineSize(ctx, result.code, MAX_W, headlineFamily, 104, 56);
    ctx.font = codeSize + "px " + headlineFamily;
    ctx.fillStyle = TEXT;
    drawSpaced(ctx, result.code, CENTER_X, cursorY, Math.round(codeSize * 0.18));
    cursorY += Math.round(codeSize * 0.55) + 80;

    ctx.font = "36px " + headlineFamily;
    ctx.fillStyle = PEACH;
    ctx.fillText(type.name, CENTER_X, cursorY);
    cursorY += 150;

    ctx.font = "38px " + bodyFamily;
    ctx.fillStyle = TEXT_MUTED;
    var lines = wrapLines(ctx, caveatLine(result, type), MAX_W);
    var lineHeight = 52;
    lines.forEach(function (line, i) {
      ctx.fillText(line, CENTER_X, cursorY + i * lineHeight);
    });
    cursorY += lines.length * lineHeight + 70;

    if (result.closeAxis) {
      var axis = result.axes[result.closeAxis];
      var secondType = SG.types.byCode[result.secondCode];

      ctx.font = "36px " + bodyFamily;
      ctx.fillStyle = TEXT_MUTED;
      ctx.fillText(secondType.name + " is in you too.", CENTER_X, cursorY);
      cursorY += 64;

      /* Peach is the user's own letter. est measures distance toward pole
         1, so est only IS the user's share when letterIndex is 1; when
         letterIndex is 0 the user's own letter is pole 0 and their true
         share is the other end, 100 - est. Do not simplify this back to
         est alone. */
      var yourShare = Math.round(axis.letterIndex === 1 ? axis.est : 100 - axis.est);
      var barH = 26;
      var splitX = MAX_W * (yourShare / 100);
      ctx.fillStyle = PEACH;
      ctx.fillRect(MARGIN, cursorY, splitX, barH);
      ctx.fillStyle = LILAC;
      ctx.fillRect(MARGIN + splitX, cursorY, MAX_W - splitX, barH);

      /* Labels so peach/lilac read as "you" and "the other one", not an
         unlabelled color split. Geometry above (splitX, barH) is untouched. */
      var labelY = cursorY + barH + 44;
      ctx.font = "28px " + bodyFamily;
      ctx.textAlign = "left";
      ctx.fillStyle = PEACH;
      ctx.fillText(type.name, MARGIN, labelY);
      ctx.textAlign = "right";
      ctx.fillStyle = LILAC;
      ctx.fillText(secondType.name, MARGIN + MAX_W, labelY);
      ctx.textAlign = "center";
    }

    return canvas;
  }

  function draw(result) {
    return document.fonts.ready.then(function () {
      var frauncesLoaded = document.fonts.check("64px Fraunces");
      var canvas = buildCanvas(result, frauncesLoaded);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) { resolve(blob); } else { reject(new Error("canvas.toBlob produced no blob")); }
        }, "image/png");
      });
    });
  }

  function fileFromBlob(blob) {
    try {
      return new File([blob], "personality-card.png", { type: "image/png" });
    } catch (e) {
      return null;
    }
  }

  function canShareFile(file) {
    if (!file || typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return false;
    }
    if (typeof navigator.canShare === "function") {
      return navigator.canShare({ files: [file] });
    }
    return true;
  }

  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "personality-card.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function save(result) {
    return draw(result).then(function (blob) {
      var file = fileFromBlob(blob);
      if (canShareFile(file)) {
        return navigator.share({ files: [file] });
      }
      downloadBlob(blob);
    });
  }

  /* The page tells us which result to share by calling this whenever one
     becomes available (render.js's renderType() calls it). */
  var lastResult = null;
  function setResult(result) {
    lastResult = result;
  }

  function bindButton() {
    var btn = document.getElementById("btn-share");
    if (!btn) { return; }
    btn.addEventListener("click", function () {
      if (!lastResult) { return; }
      save(lastResult).catch(function () { /* share sheet cancelled or failed */ });
    });
  }

  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("DOMContentLoaded", bindButton);
  }

  SG.share = {
    draw: draw,
    save: save,
    setResult: setResult
  };
}(typeof window !== "undefined" ? window : globalThis));
