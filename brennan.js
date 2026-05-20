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

  // Type text into an element char-by-char.
  // Returns a Promise resolved when complete.
  function type(el, text, opts) {
    opts = opts || {};
    const speed = opts.speed || SPEED_NORMAL;
    return new Promise(resolve => {
      clear();
      activeEl = el;
      skipping = false;
      el.classList.remove("fading");
      el.textContent = "";
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
      function step() {
        if (skipping) {
          // jump to end
          caret.remove();
          el.textContent = text;
          autoScroll();
          activeEl = null;
          resolve();
          return;
        }
        if (i >= text.length) {
          // Hold the completed sentence on screen for a beat before resolving.
          autoScroll();
          setTimeout(() => { caret.remove(); activeEl = null; resolve(); }, 700);
          return;
        }
        // Insert one char before caret
        const ch = text[i++];
        caret.insertAdjacentText("beforebegin", ch);
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
