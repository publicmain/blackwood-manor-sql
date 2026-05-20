// ============================================================
// brennan.js — NPC dialogue system: typewriter + reaction lines
// ============================================================

(function () {
  // Tuned for Chinese: each glyph carries far more information than a Latin
  // letter, so we slow down significantly. Pauses on punctuation make Brennan
  // feel like he's THINKING, not reciting a script.
  const SPEED_NORMAL = 55;   // ms per char (was 28 — too fast for CJK)
  const SPEED_FAST   = 12;
  // Heavy punctuation: full stop / question / exclamation / em-dash get a
  // breath. Comma / pause-mark get a half breath.
  const HEAVY_PUNCT = "。？！…—";
  const LIGHT_PUNCT = "，、；：";
  let currentTimer = null;
  let skipping = false;
  let activeEl = null;

  function clear() {
    if (currentTimer) { clearTimeout(currentTimer); currentTimer = null; }
  }

  // How long to wait AFTER drawing this character before drawing the next.
  function delayAfter(ch, baseSpeed) {
    if (ch === "\n")                 return baseSpeed * 8;   // paragraph break
    if (HEAVY_PUNCT.indexOf(ch) >= 0) return baseSpeed * 11;  // sentence end
    if (LIGHT_PUNCT.indexOf(ch) >= 0) return baseSpeed * 4;   // clause pause
    if (ch === " ")                  return baseSpeed * 1.4;
    return baseSpeed;
  }

  function escHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Split text on **markdown bold** markers into runs. Odd segments are bold.
  function parseRuns(text) {
    const parts = String(text).split("**");
    const runs = [];
    for (let k = 0; k < parts.length; k++) {
      if (parts[k] === "") continue;
      runs.push({ text: parts[k], bold: k % 2 === 1 });
    }
    return runs;
  }

  // Type text into an element char-by-char. Renders **bold** as <b>.
  // Returns a Promise resolved when complete.
  function type(el, text, opts) {
    opts = opts || {};
    const speed = opts.speed || SPEED_NORMAL;
    const runs = parseRuns(text);
    // Flatten to a char stream carrying the bold flag.
    const chars = [];
    for (const run of runs) {
      for (const ch of run.text) chars.push({ ch, bold: run.bold });
    }
    // Full markup for the skip-to-end / completed state.
    const fullHTML = runs.map(r =>
      r.bold ? "<b>" + escHTML(r.text) + "</b>" : escHTML(r.text)
    ).join("");

    return new Promise(resolve => {
      clear();
      activeEl = el;
      skipping = false;
      el.classList.remove("fading");
      el.innerHTML = "";
      // Caret span
      const caret = document.createElement("span");
      caret.className = "caret";
      el.appendChild(caret);

      // Find the nearest scrollable ancestor (e.g., .speech-bubble in the
       // right rail) so we can keep the newest text visible during a long
       // monologue. If none exists, scrollOwner stays null and is skipped.
      function findScrollOwner(node) {
        let cur = node && node.parentElement;
        while (cur) {
          const cs = getComputedStyle(cur);
          if (cs.overflowY === "auto" || cs.overflowY === "scroll") {
            return cur;
          }
          cur = cur.parentElement;
        }
        return null;
      }
      const scrollOwner = findScrollOwner(el);
      function autoScroll() {
        if (scrollOwner) scrollOwner.scrollTop = scrollOwner.scrollHeight;
      }

      let i = 0;
      let boldEl = null;     // current <b> node being filled
      let lastBold = false;
      function step() {
        if (skipping) {
          // jump to end — render full markup
          caret.remove();
          el.innerHTML = fullHTML;
          autoScroll();
          activeEl = null;
          resolve();
          return;
        }
        if (i >= chars.length) {
          // Hold the completed sentence on screen for a beat before resolving.
          autoScroll();
          setTimeout(() => { caret.remove(); activeEl = null; resolve(); }, 700);
          return;
        }
        // Insert one char before caret — into a <b> if this run is bold.
        const { ch, bold } = chars[i++];
        if (bold) {
          if (!boldEl || !lastBold) {
            boldEl = document.createElement("b");
            caret.parentNode.insertBefore(boldEl, caret);
          }
          boldEl.appendChild(document.createTextNode(ch));
        } else {
          caret.insertAdjacentText("beforebegin", ch);
          boldEl = null;
        }
        lastBold = bold;
        autoScroll();
        currentTimer = setTimeout(step, delayAfter(ch, speed));
      }
      step();
    });
  }

  function skip() {
    if (activeEl) skipping = true;
  }

  async function fadeAndType(el, text, opts) {
    if (el.textContent && el.textContent.trim().length) {
      el.classList.add("fading");
      await new Promise(r => setTimeout(r, 380));
    }
    await type(el, text, opts);
  }

  window.BMM2_brennan = {
    type, fadeAndType, skip
  };
})();
