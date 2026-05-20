// ============================================================
// chapters.js — rituals (Ch6/9/10/11) + case closed report
// ============================================================

(function () {

  // ---------- Ritual dispatcher ----------
  async function playRitual(name) {
    if (name === "ch6") return ritualCh6();
    if (name === "ch9") return ritualCh9();
    if (name === "ch10") return ritualCh10();
    if (name === "ch11") return ritualCh11();
  }

  // ---------- Ch 6 · Eleanor Wi-Fi gap reveal ----------
  async function ritualCh6() {
    // Pulse Eleanor's clue (if present) + popover with mini timeline
    const eleanorClue = Object.values(window.BMM2.clueIndex || {}).find(c => c.pid === 7);
    if (eleanorClue) {
      const el = document.querySelector(`.clue[data-key="${cssAttr(eleanorClue.key)}"]`);
      if (el) {
        el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse");
      }
    }
    showFlashBanner(`Eleanor Wright · Wi-Fi 67 分钟空窗`, "00:28 → 01:35 · 整个 ToD 窗口手机不在任何 AP 上。");
    await sleep(3200);
  }

  function showFlashBanner(title, sub) {
    const banner = document.createElement("div");
    banner.style.cssText = `
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
      background: rgba(13,19,27,0.96); border: 1px solid var(--accent-gold);
      border-left: 4px solid var(--accent-gold);
      padding: 14px 22px; z-index: 180; border-radius: 2px;
      font-family: var(--font-mono); color: var(--text-primary);
      box-shadow: 0 8px 24px rgba(0,0,0,0.7);
      max-width: 520px; text-align: center;
      opacity: 0; transition: opacity 320ms;
    `;
    banner.innerHTML = `
      <div style="font-family: var(--font-serif); font-size: 16px; color: var(--accent-gold); letter-spacing: 0.08em;">${esc(title)}</div>
      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; letter-spacing: 0.06em;">${esc(sub)}</div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.style.opacity = "1");
    setTimeout(() => { banner.style.opacity = "0"; setTimeout(() => banner.remove(), 400); }, 3000);
  }

  // ---------- Ch 9 · Sealed adoption reveal ----------
  // Resolves ONLY when the player dismisses the modal — so the chapter-close
  // cutscene can never interrupt the reveal mid-read.
  function ritualCh9() {
    return new Promise(resolve => {
      const veil = document.getElementById("modal-veil");
      const m = document.getElementById("modal-content");
      m.className = "modal reveal-modal";
      m.innerHTML = `
        <header><h2 style="font-family: var(--font-serif); font-size: 18px; letter-spacing: 0.16em; color: var(--accent-blood-2);">封存档案 · UNSEALED</h2><span class="close">×</span></header>
        <div class="reveal-body">
          <img class="reveal-portrait" src="portraits/Margaret.png" alt="Margaret Blackwood" loading="lazy" decoding="async"/>
          <h2>Margaret Blackwood</h2>
          <div class="reveal-yrs">1964 — 1986 · 自杀 · 22 岁</div>
          <div class="reveal-banner">封存的领养记录浮出水面。</div>
          <div class="reveal-text">
            一九八〇年，Margaret 十六岁。<br/>
            孩子由 Robert 与 Patricia Wright 法定领养，记录封存。<br/>
            六年后她从黑木庄园的井里走了。<br/><br/>
            <b>Eleanor Wright 是 Margaret Blackwood 的女儿。</b><br/>
            Elias 是 Margaret 的兄弟。<br/>
            Eleanor 当了他三年的传记作者。
          </div>
        </div>
        <div class="modal-foot"><button class="modal-continue">我明白了，继续 →</button></div>
      `;
      veil.classList.add("open");
      let done = false;
      function dismiss() {
        if (done) return;
        done = true;
        veil.classList.remove("open");
        resolve();
      }
      m.querySelector(".close").addEventListener("click", dismiss);
      m.querySelector(".modal-continue").addEventListener("click", dismiss);
      veil.addEventListener("click", e => { if (e.target === veil) dismiss(); });
    });
  }

  // ---------- Ch 10 · Memo decryption + typewriter ----------
  // Resolves ONLY when the player dismisses the modal.
  function ritualCh10() {
    return new Promise(resolve => {
      const veil = document.getElementById("modal-veil");
      const m = document.getElementById("modal-content");
      if (!veil || !m || !window.BMM2_workspace) { resolve(); return; }
      m.className = "modal doc-modal";
      const memo = window.BMM2_workspace.runRows(`SELECT EventTime, Action, FileName, CharCount, PreviewText FROM WritingSoftwareLog WHERE FileName='Memo_PersonalNote.scriv' ORDER BY EventTime`);
      const full = memo.find(r => r[4] && !String(r[4]).startsWith("["))?.[4] ||
        "Eleanor coming in 10 min. She knows. We will settle this. Three years of her work, my biography — she has been looking for something. After tonight she will be told. She has a right to ask. She does not have a right to ruin me. — E.B.";
      m.innerHTML = `
        <header>
          <div style="flex:1;">
            <div style="font-family: var(--font-serif); font-size: 18px; color: var(--text-primary);">📖 Memo_PersonalNote.scriv</div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-blood-2); margin-top: 4px;">
              字符数: 1840 · ⚠ 创建于 00:38 · 删除于 00:51
            </div>
          </div>
          <span class="close">×</span>
        </header>
        <div class="modal-body" style="padding:0;">
          <div class="doc-paper">
            <div class="doc-header">SCRIVENER · 已被删除文件 · 已解密</div>
            <div class="doc-body" id="doc-body"></div>
          </div>
        </div>
        <div class="modal-foot"><button class="modal-continue">看完了，继续 →</button></div>
      `;
      veil.classList.add("open");
      let done = false;
      function dismiss() {
        if (done) return;
        done = true;
        clearInterval(id);
        veil.classList.remove("open");
        resolve();
      }
      m.querySelector(".close").addEventListener("click", dismiss);
      m.querySelector(".modal-continue").addEventListener("click", dismiss);
      veil.addEventListener("click", e => { if (e.target === veil) dismiss(); });

      // Typewriter reveal of the deleted memo's text.
      const body = m.querySelector("#doc-body");
      let i = 0;
      const txt = full;
      const id = setInterval(() => {
        body.innerHTML = window.BMM2_cards.highlightKeywords(window.BMM2_cards.escapeHtml(txt.slice(0, ++i)));
        if (i >= txt.length) clearInterval(id);
      }, 18);
    });
  }

  // ---------- Ch 11 · CASE CLOSED stamp + report ----------
  // Five-stage choreography (PRD §10.3):
  //   1. 500ms whole-page darken
  //   2. 800ms stamp scale 200%→100% + rotate
  //   3. 1000ms hold
  //   4. 700ms gold italic subtitle + auto-draw red lines on board
  //   5. 1200ms fade overlay, swap top-bar status to red, reveal report button
  async function ritualCh11() {
    const veil = document.getElementById("stamp-veil");
    if (!veil) return;

    // Stage 1: darken
    veil.classList.add("open", "stage-1");
    await sleep(500);

    // Stage 2: stamp drops
    veil.classList.add("stage-2");
    await sleep(800);

    // Stage 3: hold
    veil.classList.add("stage-3");
    await sleep(1000);

    // Stage 4: subtitle + score animate to final
    veil.classList.add("stage-4");
    animateScoreToFinal();
    await sleep(700);

    // Stage 5: fade out the overlay; topbar status changes via refreshTopbar()
    veil.classList.add("stage-5");
    if (window.BMM2_workspace && window.BMM2_workspace.refreshTopbar) {
      window.BMM2_workspace.refreshTopbar();
    }
    await sleep(1200);

    // Clean up classes for any subsequent open
    veil.classList.remove("open", "stage-1", "stage-2", "stage-3", "stage-4", "stage-5");
    await sleep(400);

    // Open the case report
    openCaseReport();
  }

  // Animate the score numeral to its final value (PRD §10.3)
  function animateScoreToFinal() {
    const el = document.getElementById("score-num");
    if (!el) return;
    const target = (window.BMM2.state.score) | 0;
    const start = parseInt(el.textContent, 10) || 0;
    const delta = target - start;
    if (delta === 0) return;
    const duration = 900;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(start + delta * ease));
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  // ---------- Case closed report ----------
  function openCaseReport() {
    // Guard: only accessible after Ch11 (task 11.1) completes.
    // Prevents console-level spoiler access via window.BMM2_chapters.openCaseReport().
    const done = window.BMM2 && window.BMM2.state &&
                 window.BMM2.state.completedTasks &&
                 window.BMM2.state.completedTasks.includes("11.1");
    if (!done) {
      if (typeof showToast === "function") {
        showToast("案件还没结案。", "warn");
      }
      console.warn("[BMM2] openCaseReport blocked — case not yet closed.");
      return;
    }
    const m = document.getElementById("modal-content");
    const veil = document.getElementById("modal-veil");
    const elapsed = Math.floor((Date.now() - (window.BMM2.state.stats.startTime || Date.now())) / 60000);
    const rank = computeRank(window.BMM2.state.score);

    m.className = "modal report-modal";
    m.innerHTML = `
      <div class="report-hero">
        <div>
          <h1>案件 BMM-2024-1019 · CLOSED</h1>
          <div class="sub">MURDER OF ELIAS BLACKWOOD · ASHFORD MANOR · 30 OCTOBER 2024</div>
        </div>
      </div>
      <div class="report-body">

        <div class="section">
          <h3>结案陈述 · Detective Inspector James Brennan</h3>
          <div class="narration" id="case-narration"></div>
        </div>

        <div class="section">
          <h3>侦探等级</h3>
          <div class="rank-box">
            <div class="title">${rank.title}</div>
            <div class="desc">${esc(window.BMM2.state.score)} / 150 探案分 · ${rank.desc}</div>
          </div>
        </div>

        <div class="section">
          <h3>调查统计</h3>
          <div class="stats">
            <div class="stat"><div class="label">用时</div><div class="val">${elapsed} 分钟</div></div>
            <div class="stat"><div class="label">查询数</div><div class="val">${window.BMM2.state.stats.queriesRun}</div></div>
            <div class="stat"><div class="label">错误数</div><div class="val">${window.BMM2.state.stats.errors}</div></div>
            <div class="stat"><div class="label">收集线索</div><div class="val">${Object.keys(window.BMM2.state.clues || {}).length}</div></div>
            <div class="stat"><div class="label">完成关卡</div><div class="val">${window.BMM2.state.completedTasks.length} / ${window.BMM2_TASKS.length}</div></div>
            <div class="stat"><div class="label">提示用次</div><div class="val">${window.BMM2.state.stats.hintsUsed}</div></div>
          </div>
        </div>

        <div class="section">
          <h3>侦探笔记摘录</h3>
          <div style="font-family: var(--font-script); font-size: 17px; color: var(--text-primary); line-height: 1.6; padding: 18px; background: var(--bg-card); border: 1px solid var(--border-subtle); white-space: pre-wrap;">${esc((window.BMM2.state.notes || "").trim() || "（笔记为空。）")}</div>
        </div>

        <div class="section">
          <h3>献辞</h3>
          <div class="dedication">
            <img src="portraits/Margaret.png" alt="Margaret Blackwood" loading="lazy" decoding="async"/>
            <div class="dtext">
              Margaret Blackwood · 1964 — 1986<br/>
              Her work was published posthumously<br/>
              in December 2024, under her own name.
            </div>
          </div>
        </div>

        <div class="section" style="display:flex; gap:10px;">
          <button onclick="window.print()" style="background: transparent; color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 10px 18px; cursor: pointer; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em;">📄 导出为 PDF（浏览器打印）</button>
          <button onclick="if(confirm('重新开始游戏？此操作不可撤销。')){localStorage.removeItem('bm_v2_state'); location.reload();}" style="background: transparent; color: var(--text-secondary); border: 1px solid var(--border-subtle); padding: 10px 18px; cursor: pointer; font-family: var(--font-mono); font-size: 11px;">↺ 重新开始</button>
        </div>
      </div>
    `;
    veil.classList.add("open");
    veil.addEventListener("click", e => { if (e.target === veil) veil.classList.remove("open"); });

    // Typewriter the closing narration (PRD §10.4)
    const narrationEl = document.getElementById("case-narration");
    if (narrationEl && window.BMM2_brennan && window.BMM2_brennan.type) {
      const text =
`"Eleanor Wright，44 岁，已认罪。

起诉为二级谋杀。

她在档案室里花了三年时间，找到她生母 Margaret 的所有作品。最后一次对峙——她意识到 Elias 第二天会公开承认——但她没等到那一天。

死者本可以救她于这场悲剧。死者不知道。

我们的工作是说出真相。不是给出意义。"`;
      // Slight delay so the modal can be seen first, then narration begins.
      setTimeout(() => {
        window.BMM2_brennan.type(narrationEl, text, { speed: 22 });
      }, 500);
    }
  }

  function computeRank(score) {
    if (score >= 130) return { title: "DI 警督候选", desc: "GOLD · 顶级数据侦探" };
    if (score >= 100) return { title: "专家顾问", desc: "BLUE · 高阶数据顾问" };
    if (score >=  70) return { title: "熟练助手", desc: "SILVER · 可独立办案" };
    if (score >=  40) return { title: "见习侦探", desc: "GREY · 进入门径" };
    return { title: "路人", desc: "GREY · 案件已破，过程曲折" };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function esc(s) { return window.BMM2_workspace?.esc(s) || ""; }
  function cssAttr(s) { return String(s).replace(/"/g, '\\"'); }

  // Public API
  window.BMM2_chapters = { playRitual, openCaseReport };
})();
