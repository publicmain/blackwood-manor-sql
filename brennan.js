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

  // ----------------------------------------------------------
  // Person-name decoration.
  // Brennan's dialogue is authored with mixed English / Chinese
  // names. Before typing, every known name is rewritten to Chinese
  // and wrapped in a <span class="person-ref" data-pid="N"> so the
  // workspace can show a hover card / open the dossier.
  // ----------------------------------------------------------
  // Private-use sentinels — these never appear in authored dialogue.
  const NM_A = "", NM_S = "", NM_E = "";
  // [pattern, personID, displayedChineseName]
  const NAME_RULES = [
    ["Elias Blackwood", 1, "伊莱亚斯·布莱克伍德"],
    ["Elias", 1, "伊莱亚斯"],
    ["伊莱亚斯·布莱克伍德", 1, "伊莱亚斯·布莱克伍德"],
    ["伊莱亚斯", 1, "伊莱亚斯"],
    ["Vivienne Ashford", 2, "薇薇安·阿什福德"],
    ["Vivienne", 2, "薇薇安"],
    ["薇薇安·阿什福德", 2, "薇薇安·阿什福德"],
    ["薇薇安", 2, "薇薇安"],
    ["Sophia Blackwood", 3, "索菲娅·布莱克伍德"],
    ["Sophia", 3, "索菲娅"],
    ["索菲娅·布莱克伍德", 3, "索菲娅·布莱克伍德"],
    ["索菲娅", 3, "索菲娅"],
    ["Marcus Thorne", 4, "马库斯·索恩"],
    ["Marcus", 4, "马库斯"],
    ["马库斯·索恩", 4, "马库斯·索恩"],
    ["马库斯", 4, "马库斯"],
    ["Iris Chen", 5, "艾莉丝·陈"],
    ["Iris", 5, "艾莉丝"],
    ["艾莉丝·陈", 5, "艾莉丝·陈"],
    ["艾莉丝", 5, "艾莉丝"],
    ["Julian Hartley", 6, "朱利安·哈特利"],
    ["Julian", 6, "朱利安"],
    ["朱利安·哈特利", 6, "朱利安·哈特利"],
    ["朱利安", 6, "朱利安"],
    ["Eleanor Wright", 7, "埃莉诺·赖特"],
    ["Dr. Wright", 7, "赖特博士"],
    ["Dr Wright", 7, "赖特博士"],
    ["Eleanor", 7, "埃莉诺"],
    ["埃莉诺·赖特", 7, "埃莉诺·赖特"],
    ["赖特博士", 7, "赖特博士"],
    ["埃莉诺", 7, "埃莉诺"],
    ["Henrik Volkov", 8, "亨里克·沃尔科夫"],
    ["Henrik", 8, "亨里克"],
    ["亨里克·沃尔科夫", 8, "亨里克·沃尔科夫"],
    ["亨里克", 8, "亨里克"],
    ["Mrs. Hodge", 9, "霍奇太太"],
    ["Mrs Hodge", 9, "霍奇太太"],
    ["Eileen Hodge", 9, "艾琳·霍奇太太"],
    ["Hodge", 9, "霍奇太太"],
    ["艾琳·霍奇太太", 9, "艾琳·霍奇太太"],
    ["艾琳·霍奇", 9, "艾琳·霍奇太太"],
    ["霍奇太太", 9, "霍奇太太"],
    ["Albert Pemberton", 10, "阿尔伯特·彭伯顿"],
    ["Pemberton", 10, "彭伯顿"],
    ["阿尔伯特·彭伯顿", 10, "阿尔伯特·彭伯顿"],
    ["彭伯顿", 10, "彭伯顿"],
    ["Anton Volkov", 11, "安东·沃尔科夫"],
    ["Anton", 11, "安东"],
    ["安东·沃尔科夫", 11, "安东·沃尔科夫"],
    ["安东", 11, "安东"],
    ["Pierre Dubois", 12, "皮埃尔·杜布瓦"],
    ["Pierre", 12, "皮埃尔"],
    ["Dubois", 12, "杜布瓦"],
    ["皮埃尔·杜布瓦", 12, "皮埃尔·杜布瓦"],
    ["皮埃尔", 12, "皮埃尔"],
    ["杜布瓦", 12, "杜布瓦"],
    ["Sarah Whitcombe", 13, "萨拉·惠特科姆"],
    ["Sarah", 13, "萨拉"],
    ["萨拉·惠特科姆", 13, "萨拉·惠特科姆"],
    ["萨拉", 13, "萨拉"],
    ["Margaret Blackwood", 14, "玛格丽特·布莱克伍德"],
    ["Margaret", 14, "玛格丽特"],
    ["玛格丽特·布莱克伍德", 14, "玛格丽特·布莱克伍德"],
    ["玛格丽特", 14, "玛格丽特"]
  ];
  function nmEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  // Longest patterns first so "Marcus Thorne" wins over "Marcus".
  const NAME_SORTED = NAME_RULES.slice().sort((a, b) => b[0].length - a[0].length);
  const NAME_RE = new RegExp(NAME_SORTED.map(r => nmEsc(r[0])).join("|"), "g");
  const NAME_MAP = {};
  NAME_RULES.forEach(r => { if (!(r[0] in NAME_MAP)) NAME_MAP[r[0]] = r; });
  function applyNames(text) {
    return String(text).replace(NAME_RE, m => {
      const r = NAME_MAP[m];
      return NM_A + r[1] + NM_S + r[2] + NM_E;
    });
  }
  const TOK_RE = new RegExp(NM_A + "(\\d+)" + NM_S + "([^" + NM_E + "]*)" + NM_E, "g");

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
  // Split text into runs. Person names become runs carrying a `pid`;
  // **markdown bold** becomes runs with `bold: true`.
  function parseRuns(text) {
    const tagged = applyNames(text);
    const parts = tagged.split("**");
    const runs = [];
    for (let k = 0; k < parts.length; k++) {
      const seg = parts[k];
      if (seg === "") continue;
      const bold = k % 2 === 1;
      let last = 0, mm;
      TOK_RE.lastIndex = 0;
      while ((mm = TOK_RE.exec(seg)) !== null) {
        if (mm.index > last) runs.push({ text: seg.slice(last, mm.index), bold: bold });
        runs.push({ text: mm[2], bold: bold, pid: parseInt(mm[1], 10) });
        last = TOK_RE.lastIndex;
      }
      if (last < seg.length) runs.push({ text: seg.slice(last), bold: bold });
    }
    return runs;
  }

  // Type text into an element char-by-char. Renders **bold** as <b> and
  // person names as <span class="person-ref">. Returns a Promise.
  function type(el, text, opts) {
    opts = opts || {};
    const speed = opts.speed || SPEED_NORMAL;
    const runs = parseRuns(text);
    // Flatten to a char stream carrying the bold flag + pid.
    const chars = [];
    for (const run of runs) {
      for (const ch of run.text) chars.push({ ch, bold: run.bold, pid: run.pid || null });
    }
    // Full markup for the skip-to-end / completed state.
    const fullHTML = runs.map(r => {
      const inner = escHTML(r.text);
      if (r.pid) return '<span class="person-ref" data-pid="' + r.pid + '">' + inner + "</span>";
      return r.bold ? "<b>" + inner + "</b>" : inner;
    }).join("");

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
      let wrapEl = null;     // current <b> / <span> node being filled
      let wrapKind = "";     // "" | "b" | "p<pid>"
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
        // Insert one char before caret — into the right wrapper element.
        const cur = chars[i++];
        const kind = cur.pid ? ("p" + cur.pid) : (cur.bold ? "b" : "");
        if (kind === "") {
          caret.insertAdjacentText("beforebegin", cur.ch);
          wrapEl = null; wrapKind = "";
        } else {
          if (!wrapEl || wrapKind !== kind) {
            if (cur.pid) {
              wrapEl = document.createElement("span");
              wrapEl.className = "person-ref";
              wrapEl.setAttribute("data-pid", String(cur.pid));
            } else {
              wrapEl = document.createElement("b");
            }
            caret.parentNode.insertBefore(wrapEl, caret);
            wrapKind = kind;
          }
          wrapEl.appendChild(document.createTextNode(cur.ch));
        }
        autoScroll();
        currentTimer = setTimeout(step, delayAfter(cur.ch, speed));
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
