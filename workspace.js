// ============================================================
// workspace.js — Blackwood Manor v2 controller
// ============================================================

const BMM2 = window.BMM2 = {
  db: null,
  state: load(),
  clueIndex: {},   // key → clue
  queryHistory: [],
  brennanDialogActive: false,
  pendingRitual: null
};

// ---------- state ----------
const LS_KEY = "bm_v2_state";
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    currentTaskIdx: 0,
    completedTasks: [],
    queries: {},
    clues: {},        // key → clue minimal data (for restore)
    board: {},        // key → {x, y}
    connections: [],  // [{from, to, label}]
    marks: {},        // person_X → suspect|cleared|prime|unknown
    notes: "",
    score: 0,
    stats: { startTime: Date.now(), queriesRun: 0, errors: 0, hintsUsed: 0 },
    settings: { audio: false, reducedMotion: false },
    openingDone: false
  };
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(BMM2.state)); } catch (e) {}
}
function reset() {
  localStorage.removeItem(LS_KEY);
  location.reload();
}
function currentTask() {
  return window.BMM2_TASKS[BMM2.state.currentTaskIdx] || null;
}
function isComplete() { return BMM2.state.currentTaskIdx >= window.BMM2_TASKS.length; }
function chDone(ch) {
  // any task with that chapter completed?
  return BMM2.state.completedTasks.some(id => id.startsWith(ch + "."));
}
function taskDone(id) { return BMM2.state.completedTasks.includes(id); }

// ============================================================
// BOOT
// ============================================================
async function boot() {
  // sql.js wasm
  setLoadingMsg("正在连接到 Ashford Manor 临时指挥室...");
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
  });
  BMM2.db = new SQL.Database();
  BMM2.db.exec(window.BMM_SQL);
  setLoadingMsg("DATABASE LIVE");

  // Decide opening vs resume
  if (BMM2.state.openingDone) {
    enterWorkspace(false);
  } else {
    runOpeningSequence();
  }
}
function setLoadingMsg(msg) {
  const el = document.querySelector(".opening-loading");
  if (el) el.textContent = msg;
}

// ============================================================
// OPENING SEQUENCE
// ============================================================
async function runOpeningSequence() {
  const opening = document.getElementById("opening");
  if (!opening) return enterWorkspace();
  BMM2.openingSkipped = false;

  // Stage 1: ID lines (~1.6s)
  const idStage = document.getElementById("op-id");
  await fadeIn(idStage, 400);
  await sleep(1100);
  if (BMM2.openingSkipped) return;
  await fadeOut(idStage, 400);
  if (BMM2.openingSkipped) return;

  // Stage 2: Manor establishing (~2.5s)
  const manorStage = document.getElementById("op-manor");
  await fadeIn(manorStage, 900);
  await sleep(1500);
  if (BMM2.openingSkipped) return;

  // Stage 3: Title appears on manor (~3s)
  const titleStage = document.getElementById("op-title");
  await fadeIn(titleStage, 500);
  await sleep(1800);
  if (BMM2.openingSkipped) return;
  await Promise.all([
    fadeOut(titleStage, 400),
    fadeOut(manorStage, 400)
  ]);
  if (BMM2.openingSkipped) return;

  // Stage 4: Brennan monologue
  const monoStage = document.getElementById("op-mono");
  await fadeIn(monoStage, 400);
  if (BMM2.openingSkipped) return;
  // Show "Enter / Skip" buttons EARLY (during typing) so impatient players
  // and repeat-visitors can skip right away.
  const actions = monoStage.querySelector(".actions");
  if (actions) actions.classList.add("show");
  const speech = monoStage.querySelector(".speech");
  const monologue =
`风暴昨晚把主路由打掉了。本地服务器还活着——读卡器、Wi-Fi、酒窖盘点、监控元数据，全在。

Elias Blackwood，六十七岁，三度获奖作家，今早八点半被秘书发现死在自己的书房。
钝器击打头部。凶器是他自己的青铜书挡。
法医说死亡时间在凌晨零点半到一点半之间。

我请你来——是因为我宁愿信一队会写 GROUP BY 的高中生，也不再信副巡警的"第六感"。

准备好了吗？`;
  await window.BMM2_brennan.type(speech, monologue, { speed: 24 });
}

async function enterWorkspace(animated) {
  BMM2.state.openingDone = true;
  save();
  const opening = document.getElementById("opening");
  // Phase 1: fade out the police-file/Brennan monologue splash
  if (opening && animated !== false) {
    opening.style.transition = "opacity 600ms";
    opening.style.opacity = "0";
    await sleep(620);
    opening.remove();
  } else if (opening) {
    opening.remove();
  }
  // Phase 2: play the 6-beat cinematic opening prologue (only on first run)
  if (!BMM2.state.prologuePlayed && animated !== false &&
      window.BMM2_playOpeningPrologue) {
    BMM2.state.prologuePlayed = true;
    save();
    await window.BMM2_playOpeningPrologue();
  }
  // Phase 3: mount the actual workspace
  mountWorkspace();
}

function skipOpening() {
  BMM2.openingSkipped = true;
  window.BMM2_brennan.skip();
  enterWorkspace();
}

function fadeIn(el, ms) {
  return new Promise(resolve => {
    if (!el || !el.classList) return resolve();
    el.classList.add("active");
    setTimeout(resolve, ms || 600);
  });
}
function fadeOut(el, ms) {
  return new Promise(resolve => {
    if (!el || !el.classList) return resolve();
    el.classList.remove("active");
    setTimeout(resolve, ms || 600);
  });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// WORKSPACE — render the main UI
// ============================================================
function mountWorkspace() {
  const root = document.getElementById("workspace");
  root.innerHTML = workspaceShell();
  root.style.display = "grid";

  // Restore clues (re-render rows already gathered)
  restoreClues();
  renderDashboard();   // case dashboard: suspect strip + ToD timeline
  refreshTaskCard();
  refreshTopbar();

  // Wire up
  bindTopbar();
  bindLeftRail();
  bindTerminal();
  bindRightRail();

  // Start the dialogue queue from current task
  speakCurrentIntro();
}

function workspaceShell() {
  return `
    <div class="topbar">
      <div class="case-tag">
        <span class="icon">⚖</span>
        <span>BMM-2024-1019</span>
        <span class="status" id="case-status">调查中</span>
      </div>
      <div class="score">探案分 <span class="num" id="score-num">0</span></div>
      <div class="tools">
        <button id="btn-drawer" title="档案柜">📁 档案柜</button>
        <button id="btn-help" title="案件简介与操作帮助">ⓘ</button>
        <button id="btn-settings" title="设置">⚙</button>
      </div>
    </div>

    <aside class="left-rail">
      <header>
        <h2>线索 <span class="count" id="clue-count">0</span></h2>
      </header>
      <div class="filter-bar" id="filter-bar">
        <button data-f="all" class="active">全部</button>
        <button data-f="person" title="人物">👤</button>
        <button data-f="event" title="事件">🕐</button>
        <button data-f="place" title="地点">🚪</button>
        <button data-f="comm" title="通讯">💬</button>
        <button data-f="doc" title="文档">📖</button>
        <button data-f="evid" title="物证">🍷</button>
      </div>
      <div class="search-bar">
        <input id="clue-search" type="text" placeholder="搜索线索文本..." />
      </div>
      <div class="clue-list" id="clue-list">
        <div class="clue-empty">线索栏现在空着。<br/>跑一条 SQL，结果会自动归档到这里。</div>
      </div>
      <div class="progress" id="clue-progress">尚未开始调查</div>
    </aside>

    <section class="board" id="board">
      <!-- Case Dashboard: the center column. The legacy corkboard (drag-to-pin
           + Alt-drag connection strings) was removed after playtest showed
           zero use by all player tiers — the suspect dossiers + ToD timeline
           are the real reasoning surface. -->
      <div class="case-dashboard" id="case-dashboard">
        <div class="dash-section">
          <div class="dash-head">
            <span class="dash-label">🎯 嫌疑人</span>
            <span class="dash-sub" id="dash-suspect-sub">7 名 Guest · 点击查看完整档案</span>
          </div>
          <div class="suspect-strip" id="suspect-strip"></div>
        </div>
        <div class="dash-section">
          <div class="dash-head">
            <span class="dash-label">🕐 死亡时间窗 · 00:00 → 02:00</span>
            <span class="dash-sub" id="dash-timeline-sub">运行查询，事件会自动落在这条时间线上</span>
          </div>
          <div class="tod-timeline" id="tod-timeline"></div>
        </div>
      </div>
      <div class="task-card" id="task-card">
        <div class="head">
          <span>当前任务</span>
          <span class="close" id="task-close" title="收起">−</span>
        </div>
        <h3 id="task-title">—</h3>
        <p id="task-body">—</p>
        <div class="hint-row">
          <button id="task-hint">💡 提示 (-5 分)</button>
          <button id="task-skip-anim" style="opacity: 0.5">跳过 Brennan 台词</button>
        </div>
      </div>
    </section>

    <aside class="right-rail">
      <div class="brennan-block">
        <div class="brennan-head">
          ${brennanPhotoEl()}
          <div>
            <div class="brennan-name">DI James Brennan</div>
            <div class="brennan-rank">GLOUCESTERSHIRE CID</div>
            <div class="brennan-mood" id="brennan-mood"></div>
          </div>
        </div>
        <!-- Dialogue log: newest beat on top, older ones stacked below, fading -->
        <div class="dialogue-log" id="dialogue-log"></div>
        <!-- Active speech bubble (current typewriter destination) -->
        <div class="speech-bubble" id="brennan-bubble">
          <div class="bubble-head">
            <span class="bubble-time" id="bubble-time"></span>
            <span class="bubble-name">JB</span>
          </div>
          <div class="speech" id="brennan-speech"></div>
        </div>
        <div class="brennan-actions">
          <button id="btn-dialogue-history">完整对话历史</button>
        </div>
      </div>
      <div class="notes-block">
        <h3>侦探笔记 <button id="btn-export-notes">导出 .txt</button></h3>
        <textarea id="notes-area" placeholder="把你的推理写在这里..."></textarea>
      </div>
    </aside>

    <!-- Result panel: floats above terminal after every successful query,
         shows the actual rows so the student SEES SQL output, not just a
         distilled clue card. Manually closeable; auto-replaced by next run. -->
    <div class="result-panel" id="result-panel" aria-hidden="true">
      <div class="result-head">
        <span class="result-label">📊 查询结果</span>
        <span class="result-meta" id="result-meta"></span>
        <span class="spacer"></span>
        <button id="btn-result-close" title="关闭">×</button>
      </div>
      <div class="result-body" id="result-body"></div>
    </div>

    <div class="terminal" id="terminal">
      <div class="terminal-handle" id="terminal-handle"></div>
      <div class="terminal-bar">
        <span class="label">SQL TERMINAL</span>
        <span class="spacer"></span>
        <button id="btn-run" class="primary">▶ Run</button>
        <button id="btn-clear">清空</button>
        <button id="btn-history">历史</button>
        <button id="btn-starter">载入模板</button>
        <span class="kbd">⌘/Ctrl + ⏎</span>
      </div>
      <div class="terminal-body">
        <textarea id="sql-editor" class="terminal-editor" spellcheck="false" placeholder="SELECT ... FROM ... WHERE ..."></textarea>
      </div>
      <div class="terminal-history" id="history-pop"></div>
      <div class="terminal-toast" id="terminal-toast"></div>
    </div>

    <div class="case-drawer" id="case-drawer">
      <header>
        <h3>📁 已归档章节</h3>
        <span class="close" id="drawer-close" style="cursor: pointer; color: var(--text-muted);">×</span>
      </header>
      <div class="drawer-body" id="drawer-body"></div>
    </div>

    <div class="modal-veil" id="modal-veil"><div class="modal" id="modal-content"></div></div>
    <div class="stamp-veil" id="stamp-veil">
      <div class="stamp">CASE CLOSED</div>
      <div class="stamp-sub">2024 · OCTOBER · 30</div>
    </div>
  `;
}

function brennanPhotoEl() {
  // If portraits/Brennan.png exists, use it; otherwise emit an inline SVG
  // silhouette so the right-rail looks like a redacted dossier portrait
  // rather than two flat letters.
  return `<div class="brennan-photo svg-portrait">
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-label="DI James Brennan (portrait redacted)">
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1A2230"/>
          <stop offset="100%" stop-color="#0A0E14"/>
        </linearGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg-grad)"/>
      <!-- shoulders -->
      <path d="M 8 120 Q 8 85 32 78 L 68 78 Q 92 85 92 120 Z" fill="#2A3344" stroke="#3D4A60" stroke-width="0.8"/>
      <!-- collar accent -->
      <path d="M 38 78 L 50 92 L 62 78" stroke="#A0392E" stroke-width="1.5" fill="none" opacity="0.6"/>
      <!-- head silhouette -->
      <ellipse cx="50" cy="48" rx="22" ry="28" fill="#1A2230" stroke="#3D4A60" stroke-width="0.8"/>
      <!-- hairline hint -->
      <path d="M 30 36 Q 50 22 70 36" stroke="#3D4A60" stroke-width="1" fill="none" opacity="0.7"/>
      <!-- "redacted" badge -->
      <text x="50" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="6" fill="#B89968" letter-spacing="0.2em">DI JB</text>
    </svg>
  </div>`;
}

// ============================================================
// TOP BAR / DRAWERS / MODALS / SETTINGS
// ============================================================
function bindTopbar() {
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("btn-drawer").addEventListener("click", () => {
    document.getElementById("case-drawer").classList.toggle("open");
    refreshDrawer();
  });
  document.getElementById("drawer-close").addEventListener("click", () => {
    document.getElementById("case-drawer").classList.remove("open");
  });
}
function refreshTopbar() {
  const num = document.getElementById("score-num");
  if (num) num.textContent = BMM2.state.score;
  const status = document.getElementById("case-status");
  if (status) {
    status.classList.toggle("closed", isComplete());
    status.textContent = isComplete() ? "案件关闭" : "调查中";
  }
}
function bumpScore() {
  const n = document.getElementById("score-num");
  if (!n) return;
  n.classList.remove("bump");
  void n.offsetWidth;
  n.classList.add("bump");
}
function refreshDrawer() {
  const body = document.getElementById("drawer-body");
  if (!body) return;
  const tasks = window.BMM2_TASKS.filter(t => taskDone(t.id)).reverse();
  if (!tasks.length) {
    body.innerHTML = `<div class="drawer-card"><div class="body" style="color:var(--text-muted); font-style:italic;">尚无归档。</div></div>`;
    return;
  }
  body.innerHTML = tasks.map(t => `
    <div class="drawer-card" data-id="${t.id}">
      <div class="h">第 ${t.chapter} 章 · 任务 ${t.id}</div>
      <div class="body"><b>${esc(t.title)}</b><br/>${esc(t.brennanOutro || "").split("\n")[0]}</div>
    </div>
  `).join("");
}

// ============================================================
// LEFT RAIL — clue list + filter + search
// ============================================================
let leftFilter = "all", leftSearch = "";
function bindLeftRail() {
  document.getElementById("filter-bar").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    document.querySelectorAll("#filter-bar button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    leftFilter = b.dataset.f;
    renderClueList();
  });
  const search = document.getElementById("clue-search");
  let t;
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => { leftSearch = search.value.trim().toLowerCase(); renderClueList(); }, 80);
  });
}
function renderClueList() {
  const list = document.getElementById("clue-list");
  const all = Object.values(BMM2.clueIndex);
  const filtered = all.filter(c => {
    if (leftFilter !== "all" && c.type !== leftFilter) return false;
    if (leftSearch && !(c.title.toLowerCase() + " " + (c.sub||"").toLowerCase()).includes(leftSearch)) return false;
    return true;
  });
  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<div class="clue-empty">${all.length ? "没有匹配的线索" : "线索栏现在空着。<br/>跑一条 SQL，结果会自动归档到这里。"}</div>`;
  } else {
    filtered.forEach((c, i) => list.appendChild(window.BMM2_cards.clueDOM(BMM2.state, c, i)));
  }
  document.getElementById("clue-count").textContent = all.length;
  document.getElementById("clue-progress").textContent =
    isComplete() ? "调查已完结。" : `已发现 ${all.length} 条线索 · 已钉 ${Object.keys(BMM2.state.board).length}`;
}

function addClues(cols, rows) {
  let added = 0;
  rows.forEach(row => {
    const type = window.BMM2_cards.detectType(cols);
    const key = window.BMM2_cards.rowKey(type, cols, row);
    if (BMM2.clueIndex[key]) {
      // pulse the existing card
      const existing = document.querySelector(`.clue[data-key="${cssAttr(key)}"]`);
      if (existing) {
        existing.classList.remove("pulse"); void existing.offsetWidth; existing.classList.add("pulse");
      }
      return;
    }
    const clue = window.BMM2_cards.rowToClue(cols, row, type, added);
    clue.key = key;
    BMM2.clueIndex[key] = clue;
    // Persist minimal data for restore
    BMM2.state.clues[key] = { type, title: clue.title, sub: clue.sub, pid: clue.pid, fname: clue.fname };
    added++;
  });
  save();
  renderClueList();
  renderDashboard();
  return added;
}

// ============================================================
// CASE DASHBOARD — replaces the empty corkboard. Two widgets:
//   1) Suspect strip: 7 Guest faces with status pill + latest finding.
//      Click → opens the rich dossier modal (was hidden behind one click
//      on a left-rail card; playtest showed players never discovered it).
//   2) ToD timeline: 00:00–02:00 horizontal scale with dots for each
//      time-stamped clue (keycard, wifi, sms, ...). Updates live.
// ============================================================
const SUSPECT_LIST = [
  { pid: 2, name: "Vivienne Ashford",  role: "前妻 · 庄园终身使用权" },
  { pid: 3, name: "Sophia Blackwood",  role: "现妻 · Anchor 主播" },
  { pid: 4, name: "Marcus Thorne",     role: "文学经纪人 · 22 年合同" },
  { pid: 5, name: "Iris Chen",         role: "2023 Booker 得主" },
  { pid: 6, name: "Julian Hartley",    role: "作家 · 旧友" },
  { pid: 7, name: "Eleanor Wright",    role: "授权传记作者" },
  { pid: 8, name: "Henrik Volkov",     role: "俄籍出版人" }
];
const MARK_LABEL = {
  unknown: "待查", suspect: "怀疑", cleared: "已排除", prime: "重点嫌疑"
};

function renderDashboard() {
  renderSuspectStrip();
  renderTimeline();
}

function renderSuspectStrip() {
  const strip = document.getElementById("suspect-strip");
  if (!strip) return;
  const marks = BMM2.state.marks || {};
  const cluesByPid = {};
  // Index latest clue per person + count events involving them
  for (const c of Object.values(BMM2.clueIndex)) {
    if (c.type === "person" && c.pid) {
      cluesByPid[c.pid] = cluesByPid[c.pid] || { count: 0, latest: null };
      cluesByPid[c.pid].latest = c.title;
    }
  }
  // Count events per person. The clue.sub formats vary by table:
  //   KeycardAccess: "PersonID: 7 · AccessType: Entry"
  //   WiFiSessions:  "PersonID: 7 · APRoomID: 405"
  //   PhoneRecords:  title "2024-10-20 22:48 P#7" (FromPersonID prefixed as P#N)
  //   Conversations: "SpeakerID: 1 · ListenerID: 7"  (both speaker + listener count)
  // Accept all three: P#N, PersonID:N, FromPersonID/ToPersonID/SpeakerID:N
  function bumpPid(pid) {
    if (!pid) return;
    cluesByPid[pid] = cluesByPid[pid] || { count: 0, latest: null };
    cluesByPid[pid].count++;
  }
  for (const c of Object.values(BMM2.clueIndex)) {
    if (c.type === "event" || c.type === "comm") {
      const text = (c.sub || "") + " " + (c.title || "");
      // Match P#7 form
      const m1 = text.match(/P#(\d+)/g);
      if (m1) m1.forEach(t => bumpPid(parseInt(t.slice(2), 10)));
      // Match PersonID: 7, FromPersonID: 7, SpeakerID: 7, ListenerID: 7
      const rx = /(?:Person|From|To|Speaker|Listener|TakenBy|Deleted|Owner)?(?:PersonID|ID|By):\s*(\d+)/gi;
      let mm;
      while ((mm = rx.exec(text)) !== null) {
        bumpPid(parseInt(mm[1], 10));
      }
    }
  }

  strip.innerHTML = SUSPECT_LIST.map(s => {
    const mark = marks["person_" + s.pid] || "unknown";
    const photo = window.BMM_photoPath ? window.BMM_photoPath(s.pid) : null;
    const info = cluesByPid[s.pid];
    const discovered = !!info;  // they've appeared in a query result
    const tail = info && info.count > 0 ? `${info.count} 条相关证据` : (discovered ? "已识别" : "尚未出现");
    const photoEl = photo
      ? `<img src="${photo}" alt="" loading="lazy" decoding="async"/>`
      : `<div class="ph-placeholder">${s.name.charAt(0)}</div>`;
    return `
      <div class="suspect-tile mark-${mark} ${discovered ? "discovered" : "ghost"}"
           data-pid="${s.pid}"
           title="点击查看 ${esc(s.name)} 的完整档案">
        <div class="st-photo">${photoEl}</div>
        <div class="st-body">
          <div class="st-name">${esc(s.name)}</div>
          <div class="st-role">${esc(s.role)}</div>
          <div class="st-foot">
            <span class="st-pill pill-${mark}">${MARK_LABEL[mark]}</span>
            <span class="st-tail">${esc(tail)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Click → dossier (the rich modal that was hidden behind one click in
  // the left rail). This is the primary reasoning tool. Call the dossier
  // modal directly so it works even for not-yet-discovered suspects.
  strip.querySelectorAll(".suspect-tile").forEach(tile => {
    tile.addEventListener("click", () => {
      const pid = parseInt(tile.dataset.pid, 10);
      openSuspectModal(pid);
    });
  });

  // Update sub-line stats
  const found = SUSPECT_LIST.filter(s => cluesByPid[s.pid]).length;
  const sub = document.getElementById("dash-suspect-sub");
  if (sub) sub.textContent = `已识别 ${found} / 7 名 · 点击查看完整档案`;
}

// Parse an event clue's time. Clues for events have title === time string
// (e.g., "2024-10-20 00:48"). Returns minutes past midnight, or null.
function clueMinutes(c) {
  const s = String(c.title || "");
  const m = s.match(/(\d{2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function renderTimeline() {
  const tl = document.getElementById("tod-timeline");
  if (!tl) return;
  const all = Object.values(BMM2.clueIndex)
    .filter(c => c.type === "event" || c.type === "comm")
    .map(c => ({ c, mins: clueMinutes(c) }))
    .filter(x => x.mins != null && x.mins >= 0 && x.mins <= 120);

  // Window: 0:00 to 02:00 (120 min). ToD band: 00:30 to 01:30 (30-90).
  const total = 120;
  let html = `
    <div class="tl-scale">
      <span style="left:0%">00:00</span>
      <span style="left:25%">00:30</span>
      <span style="left:50%">01:00</span>
      <span style="left:75%">01:30</span>
      <span style="left:100%">02:00</span>
    </div>
    <div class="tl-track">
      <div class="tl-tod-band" title="法医估算死亡时间 00:30 – 01:30"></div>
  `;
  // Sort dots by time and assign a vertical row so same-minute events don't overlap
  all.sort((a, b) => a.mins - b.mins);
  let lastMins = -10, row = 0;
  for (const { c, mins } of all) {
    const pct = (mins / total) * 100;
    const text = (c.sub || "") + " " + (c.title || "");
    // Pull the FIRST person id from any of the known column forms
    let pid = null;
    const m1 = text.match(/P#(\d+)/);
    if (m1) pid = parseInt(m1[1], 10);
    if (!pid) {
      const m2 = text.match(/(?:Person|From|To|Speaker|TakenBy)?(?:PersonID|ID|By):\s*(\d+)/i);
      if (m2) pid = parseInt(m2[1], 10);
    }
    const photo = pid && window.BMM_photoPath ? window.BMM_photoPath(pid) : null;
    const colorClass = pid === 7 ? "is-eleanor" :
                       pid === 4 ? "is-marcus" :
                       pid === 2 ? "is-vivienne" : "";
    // Vertical stagger: if dots are within 2 minutes of each other, alternate rows
    if (mins - lastMins < 3) row = (row + 1) % 2;
    else row = 0;
    lastMins = mins;
    const topPx = 14 + row * 4;
    const titleAttr = esc((c.title || "") + (c.sub ? " · " + c.sub : ""));
    html += `<div class="tl-dot ${colorClass}" style="left:${pct.toFixed(2)}%; top:${topPx}px" title="${titleAttr}" data-key="${cssAttr(c.key)}">${photo ? `<img src="${photo}" alt=""/>` : ""}</div>`;
  }
  html += "</div>";
  tl.innerHTML = html;

  // Click → re-open result for that clue (use openClueDetail for events too)
  tl.querySelectorAll(".tl-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const key = dot.dataset.key;
      if (key) openClueDetail(key);
    });
  });

  // Sub-line
  const sub = document.getElementById("dash-timeline-sub");
  if (sub) {
    sub.textContent = all.length === 0
      ? "运行查询，事件会自动落在这条时间线上"
      : `${all.length} 个事件已落入 0:00–2:00 时间窗`;
  }
}
function cssAttr(s) { return String(s).replace(/"/g, '\\"'); }

function restoreClues() {
  // From state.clues, restore the index. Backfill pid by name if missing.
  for (const [key, data] of Object.entries(BMM2.state.clues || {})) {
    let pid = data.pid;
    if (!pid && data.type === "person" && window.BMM2_NAME_TO_PID) {
      pid = window.BMM2_NAME_TO_PID[data.title] || null;
    }
    BMM2.clueIndex[key] = {
      key, type: data.type, title: data.title, sub: data.sub,
      pid, fname: data.fname
    };
    // Persist the backfilled pid so future renders are stable
    if (pid && !data.pid) {
      BMM2.state.clues[key].pid = pid;
    }
  }
  save();
  renderClueList();
}

// ============================================================
// TASK CARD + Brennan
// ============================================================
function refreshTaskCard() {
  const card = document.getElementById("task-card");
  const t = currentTask();
  if (!t) {
    card.style.display = "none";
    return;
  }
  card.style.display = "block";
  card.classList.remove("minimized");
  document.getElementById("task-title").textContent = t.title;
  document.getElementById("task-body").textContent = t.task;
  document.getElementById("task-close").onclick = () => {
    card.classList.add("minimized");
    card.innerHTML = `<span>📋</span>`;
    card.addEventListener("click", () => refreshTaskCard(), { once: true });
  };
  document.getElementById("task-hint").onclick = () => {
    BMM2.state.stats.hintsUsed++;
    addScore(-5);
    save();
    showHint(t.hint);
  };
  document.getElementById("task-skip-anim").onclick = () => window.BMM2_brennan.skip();
}

async function speakCurrentIntro() {
  const t = currentTask();
  if (!t) return;
  // Play scene-before (chapter prologue) if defined and not yet played
  if (window.BMM2_SCENE_BEFORE && window.BMM2_SCENE_BEFORE[t.id]) {
    const sceneId = window.BMM2_SCENE_BEFORE[t.id];
    BMM2.state.scenesPlayed = BMM2.state.scenesPlayed || [];
    if (!BMM2.state.scenesPlayed.includes(sceneId)) {
      BMM2.state.scenesPlayed.push(sceneId);
      save();
      await window.BMM2_playScene(sceneId);
    }
  }
  const el = document.getElementById("brennan-speech");
  if (!el) return;
  BMM2.brennanDialogActive = true;
  setBubbleTime();
  await window.BMM2_brennan.type(el, t.brennanIntro || t.task);
  archiveCurrentBubble();
  BMM2.brennanDialogActive = false;
}

async function speakOutro(t) {
  const el = document.getElementById("brennan-speech");
  if (!el) return;
  BMM2.brennanDialogActive = true;
  archiveCurrentBubble();   // push any still-visible intro into the log first
  setBubbleTime();
  await window.BMM2_brennan.type(el, t.brennanOutro || "");
  // Mood line — strip the *...* wrap; CSS .brennan-mood is already italic
  if (t.brennanMood) {
    const mood = document.getElementById("brennan-mood");
    if (mood) {
      mood.innerHTML = String(t.brennanMood)
        .replace(/\*\[(.+?)\]\*/g, '<span class="mood-beat">[$1]</span>')
        .replace(/\*(.+?)\*/g, '$1');
    }
  }
  archiveCurrentBubble();
  BMM2.brennanDialogActive = false;
}

// ============================================================
// Dialogue log: stack of past Brennan utterances visible above the
// active speech bubble. Each completed utterance becomes a card.
// ============================================================
function setBubbleTime() {
  const t = document.getElementById("bubble-time");
  if (!t) return;
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  t.textContent = `${hh}:${mm}`;
}

function archiveCurrentBubble() {
  const speech = document.getElementById("brennan-speech");
  const time   = document.getElementById("bubble-time");
  const log    = document.getElementById("dialogue-log");
  if (!speech || !log) return;
  const txt = (speech.textContent || "").trim();
  if (!txt) return;
  // Snapshot into a card prepended to the log
  const card = document.createElement("div");
  card.className = "log-card";
  card.innerHTML = `
    <div class="log-card-head">
      <span class="log-card-time">${time ? time.textContent : ""}</span>
      <span class="log-card-name">DI Brennan</span>
    </div>
    <div class="log-card-body"></div>
  `;
  card.querySelector(".log-card-body").textContent = txt;
  log.insertBefore(card, log.firstChild);
  // Keep only the most recent 6 archived beats; older ones drop off
  while (log.children.length > 6) log.removeChild(log.lastChild);
  // Clear the live bubble for next utterance
  speech.textContent = "";
  const timeEl = document.getElementById("bubble-time");
  if (timeEl) timeEl.textContent = "";
}

function showHint(text) {
  const pop = document.createElement("div");
  pop.className = "hint-popover";
  pop.innerHTML = `<div class="hint-head">提示 (-5 探案分)</div><div>${esc(text)}</div><span class="hint-close">×</span>`;
  document.body.appendChild(pop);
  const btn = document.getElementById("task-hint").getBoundingClientRect();
  pop.style.left = (btn.left) + "px";
  pop.style.bottom = (window.innerHeight - btn.top + 8) + "px";
  pop.querySelector(".hint-close").addEventListener("click", () => pop.remove());
  setTimeout(() => pop.remove(), 14000);
}

// ============================================================
// SQL TERMINAL
// ============================================================
function bindTerminal() {
  const ed = document.getElementById("sql-editor");
  // Load starter
  const t = currentTask();
  if (t && !BMM2.state.queries[t.id]) ed.value = t.starter || "";
  else ed.value = BMM2.state.queries[t?.id] || (t?.starter || "");

  ed.addEventListener("input", () => {
    const tt = currentTask();
    if (tt) { BMM2.state.queries[tt.id] = ed.value; save(); }
  });
  ed.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ed.selectionStart, eend = ed.selectionEnd;
      ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(eend);
      ed.selectionStart = ed.selectionEnd = s + 2;
    }
    // Run query: Cmd/Ctrl+Enter OR Shift+Enter (PRD §9.2.1)
    if (((e.metaKey || e.ctrlKey) && e.key === "Enter") ||
        (e.shiftKey && e.key === "Enter")) {
      e.preventDefault(); runQuery();
    }
  });
  document.getElementById("btn-run").addEventListener("click", runQuery);
  document.getElementById("btn-clear").addEventListener("click", () => { ed.value = ""; ed.focus(); });
  document.getElementById("btn-starter").addEventListener("click", () => {
    const tt = currentTask(); if (tt) ed.value = tt.starter || "";
  });
  document.getElementById("btn-history").addEventListener("click", toggleHistory);
  document.getElementById("btn-result-close")?.addEventListener("click", hideResultPanel);

  // Resize handle
  const handle = document.getElementById("terminal-handle");
  let dragging = false, startY = 0, startH = 0;
  handle.addEventListener("mousedown", e => {
    dragging = true; startY = e.clientY;
    const tm = document.getElementById("terminal");
    startH = tm.getBoundingClientRect().height;
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const delta = startY - e.clientY;
    const newH = Math.max(80, Math.min(window.innerHeight * 0.7, startH + delta));
    document.documentElement.style.setProperty("--terminal-h", newH + "px");
  });
  window.addEventListener("mouseup", () => { dragging = false; });
}

function toggleHistory() {
  const pop = document.getElementById("history-pop");
  if (pop.classList.contains("open")) { pop.classList.remove("open"); return; }
  if (!BMM2.queryHistory.length) {
    showToast("尚无历史记录。", "warn");
    return;
  }
  pop.innerHTML = BMM2.queryHistory.slice(-20).reverse().map(q => `
    <div class="history-item" title="${esc(q)}">${esc(q.replace(/\s+/g, " ").slice(0, 100))}</div>
  `).join("");
  pop.classList.add("open");
  pop.querySelectorAll(".history-item").forEach((el, i) => {
    el.addEventListener("click", () => {
      document.getElementById("sql-editor").value = BMM2.queryHistory.slice(-20).reverse()[i];
      pop.classList.remove("open");
    });
  });
  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", function off(e) {
      if (!e.target.closest("#history-pop") && !e.target.closest("#btn-history")) {
        pop.classList.remove("open");
        document.removeEventListener("click", off);
      }
    });
  }, 50);
}

function runQuery() {
  const ed = document.getElementById("sql-editor");
  const sql = (ed.value || "").trim();
  if (!sql) { showToast("空查询。", "warn"); return; }
  BMM2.queryHistory.push(sql);
  let results;
  // Anti-spoiler filter — rewrite the SQL at the source (covers any
  // SELECT shape, not just queries that happen to return the sealed col).
  const safeSql = window.BMM2_filterQuery(sql, BMM2.state);
  try {
    results = BMM2.db.exec(safeSql);
  } catch (err) {
    BMM2.state.stats.errors++;
    save();
    showToast("❌ " + err.message, "err");
    brennanReact("语法没对。再读一遍 schema。");
    return;
  }
  BMM2.state.stats.queriesRun++;
  save();
  let last = results[results.length - 1];
  if (!last) {
    showToast("✓ 语句执行成功，无结果集。", "warn");
    brennanReact("空集。表里没那种行。换个角度。");
    return;
  }
  if (!last.values.length) {
    showToast("⚠ 查询无结果。再想想？", "warn");
    brennanReact("查到 0 行。WHERE 条件可能太严了。");
    return;
  }
  if (last.values.length > 100) {
    showToast(`⚠ 结果 ${last.values.length} 行，已截至前 50。请加 WHERE。`, "warn");
    last = { columns: last.columns, values: last.values.slice(0, 50) };
  }
  // Show the actual result table to the student (floating panel above the
  // terminal). Auto-replaces previous result; closeable.
  showResultPanel(last.columns, last.values);
  // Cards
  const added = addClues(last.columns, last.values);
  // Grade
  const t = currentTask();
  if (!t) {
    showToast(`✓ ${added} 条线索归档。`, "ok");
    return;
  }
  const verdict = window.BMM2_grade(t, last, sql);
  if (verdict.pass) {
    // Tutorial flag is consumed INSIDE completeCurrentTask so it fires
    // synchronously between Ch0 outro and Ch1 scene-before — preventing the
    // earlier race where the popover briefly flashed, then ch1_open scene
    // covered it, then it re-appeared after the scene closed.
    completeCurrentTask(t, sql);
  } else {
    showToast(`✓ ${added} 条线索归档 · 但 ${verdict.why}`, "warn");
  }
}

// ============================================================
// Onboarding tutorial popover (PRD §10.1) — fires once after the
// player completes their first SQL query in Ch0.
// ============================================================
// Promise-based variant: resolves once the player clicks 继续.
function showTutorialPopoverAsync() {
  return new Promise(resolve => {
    showTutorialPopover(resolve);
  });
}
function showTutorialPopover(onContinue) {
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  if (!veil || !m) { if (onContinue) onContinue(); return; }
  m.className = "modal";
  m.style.maxWidth = "520px";
  m.innerHTML = `
    <header>
      <h2 style="font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.12em;">
        欢迎进入调查台 · ONBOARDING
      </h2>
    </header>
    <div class="modal-body" style="font-family: var(--font-serif); line-height: 1.7; font-size: 15px; color: var(--text-primary);">
      <p>这就是你的工具。</p>
      <p>每跑一条 SQL，结果会出现在<b style="color:var(--accent-gold)">底部的结果浮层</b>（你查到的真实数据），并自动归档到左侧的<b style="color:var(--accent-gold)">线索栏</b>——按类型分类（人物/事件/地点/通讯/文档/物证）。</p>
      <p>中央的<b style="color:var(--accent-gold)">案件概览</b>是你的雷达：七张嫌疑人卡片显示每个人的最新进展和你给他打的标签；下方的<b style="color:var(--accent-gold)">死亡时间窗时间线</b>把所有时间戳事件按发生时间排好——红色 ToD 带是法医估算的关键一小时。</p>
      <p>点击任何<b style="color:var(--accent-gold)">嫌疑人卡片</b>，会浮出他的完整档案（门禁记录、通话、对话偷听、随章新增）。在档案里给每位嫌疑人打标签：<i>待查 / 怀疑 / 已排除 / 重点嫌疑</i>——你的判断会立刻反映到概览板上。</p>
      <p>右下角的<b style="color:var(--accent-gold)">侦探笔记</b>随时记你的推理。自动保存。右上角 <b>📁 档案柜</b> 是已完成步骤的回溯。</p>
      <p style="color: var(--text-secondary); font-style: italic; margin-top: 18px;">
        Brennan：「数据胜过直觉。开始吧。」
      </p>
      <div style="text-align: center; margin-top: 22px;">
        <button id="btn-tutorial-continue" style="background: var(--accent-gold); color: var(--bg-deepest); border: none; padding: 10px 32px; cursor: pointer; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em;">继续 →</button>
      </div>
    </div>
  `;
  veil.classList.add("open");
  document.getElementById("btn-tutorial-continue").addEventListener("click", () => {
    closeModal();
    if (onContinue) onContinue();
  });
}

function showToast(msg, cls) {
  const t = document.getElementById("terminal-toast");
  t.className = "terminal-toast show " + (cls || "");
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3500);
}

// ============================================================
// Result panel — show the actual table after each successful query.
// Auto-mounted by runQuery(); user can close with × or by running
// another query (which replaces the contents).
// ============================================================
function showResultPanel(columns, values) {
  const panel = document.getElementById("result-panel");
  const body  = document.getElementById("result-body");
  const meta  = document.getElementById("result-meta");
  if (!panel || !body) return;
  meta.textContent = `${values.length} 行 · ${columns.length} 列`;
  // Build the table
  let html = '<table class="result-table"><thead><tr>';
  for (const c of columns) html += `<th>${esc(String(c))}</th>`;
  html += '</tr></thead><tbody>';
  for (const row of values) {
    html += '<tr>';
    for (const cell of row) {
      const v = cell == null ? "<i class='null'>NULL</i>" : esc(String(cell));
      html += `<td>${v}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  body.innerHTML = html;
  panel.setAttribute("aria-hidden", "false");
  panel.classList.add("open");
}

function hideResultPanel() {
  const panel = document.getElementById("result-panel");
  if (!panel) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
}

// Helper: have Brennan say a short reaction line.
// Wraps the proper (el, text, opts) signature; guarded against the
// active intro/outro typewriter so we don't overlap the main task speech.
function brennanReact(text) {
  if (!window.BMM2_brennan || !window.BMM2_brennan.fadeAndType) return;
  if (BMM2.brennanDialogActive) return; // skip if main beat in progress
  const speech = document.getElementById("brennan-speech");
  if (!speech) return;
  window.BMM2_brennan.fadeAndType(speech, text, { speed: 24 });
}

async function completeCurrentTask(t, sql) {
  if (!taskDone(t.id)) {
    BMM2.state.completedTasks.push(t.id);
    addScore(t.rewards?.score || 10);
  }
  BMM2.state.currentTaskIdx++;
  BMM2.state.queries[t.id] = sql;
  save();

  showToast(`✓ 任务 ${t.id} 完成 · +${t.rewards?.score || 10} 探案分`, "ok");
  bumpScore();
  refreshTopbar();

  // Brennan reacts
  await speakOutro(t);

  // Onboarding tutorial — fire ONCE after Ch0.1 outro finishes, BEFORE the
  // Ch1 scene-before runs. Awaiting it here means the popover is fully closed
  // before any cutscene starts, eliminating the "flash → cutscene → flash"
  // race the player saw earlier.
  if (t.id === "0.1" && !BMM2.state.tutorialShown) {
    BMM2.state.tutorialShown = true;
    save();
    await showTutorialPopoverAsync();
  }

  // Trigger ritual if any
  if (t.ritual && !BMM2.state.ritualsPlayed?.includes(t.ritual)) {
    BMM2.state.ritualsPlayed = (BMM2.state.ritualsPlayed || []).concat(t.ritual);
    save();
    await playRitual(t.ritual);
  }

  // Play scene-after (chapter close narration) if mapped.
  // Value may be a string OR an array of scene IDs (played back-to-back).
  if (window.BMM2_SCENE_AFTER && window.BMM2_SCENE_AFTER[t.id]) {
    const sceneRef = window.BMM2_SCENE_AFTER[t.id];
    if (sceneRef) {
      const sceneIds = Array.isArray(sceneRef) ? sceneRef : [sceneRef];
      // Use the FIRST id as the "played" marker so the whole sequence
      // gates as one. This means re-running the task does not re-play scenes.
      const markerKey = "seqAfter:" + t.id;
      BMM2.state.scenesPlayed = BMM2.state.scenesPlayed || [];
      if (!BMM2.state.scenesPlayed.includes(markerKey)) {
        BMM2.state.scenesPlayed.push(markerKey);
        save();
        if (window.BMM2_playSceneSequence) {
          await window.BMM2_playSceneSequence(sceneIds);
        } else {
          for (const sid of sceneIds) {
            if (sid) await window.BMM2_playScene(sid);
          }
        }
        // Ch11: also play epilogue (G - book + courtroom) before report
        if (sceneIds.includes("finale_confession")) {
          await window.BMM2_playScene("finale_epilogue");
        }
      }
    }
  }

  // Advance to next task
  if (isComplete()) {
    refreshTopbar();
  } else {
    setTimeout(() => {
      refreshTaskCard();
      // Load next task's starter
      const nextT = currentTask();
      const ed = document.getElementById("sql-editor");
      if (ed && nextT && !BMM2.state.queries[nextT.id]) ed.value = nextT.starter || "";
      speakCurrentIntro();
    }, 800);
  }
}

function addScore(delta) {
  BMM2.state.score = Math.max(0, (BMM2.state.score || 0) + delta);
  save();
  refreshTopbar();
}

// ============================================================
// RIGHT RAIL — notes + dialogue history
// ============================================================
function bindRightRail() {
  const ta = document.getElementById("notes-area");
  ta.value = BMM2.state.notes || "";
  let t;
  ta.addEventListener("input", () => {
    BMM2.state.notes = ta.value;
    clearTimeout(t); t = setTimeout(save, 600);
  });
  document.getElementById("btn-export-notes").addEventListener("click", () => {
    const blob = new Blob([BMM2.state.notes || ""], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bmm-detective-notes-${Date.now()}.txt`;
    a.click();
  });
  document.getElementById("btn-dialogue-history").addEventListener("click", openDialogueHistory);
}

function openDialogueHistory() {
  const lines = BMM2.state.completedTasks.map(id => {
    const t = window.BMM2_TASKS.find(x => x.id === id);
    if (!t) return "";
    return `[第 ${t.chapter} 章 · 任务 ${t.id}]\n开场: ${t.brennanIntro}\n回应: ${t.brennanOutro}\n`;
  }).join("\n");
  const m = document.getElementById("modal-content");
  const veil = document.getElementById("modal-veil");
  m.className = "modal";
  m.innerHTML = `
    <header><h2 style="margin:0; font-family:var(--font-serif); font-size:18px; letter-spacing:0.14em;">Brennan 对话历史</h2><span class="close">×</span></header>
    <div class="modal-body" style="font-family:var(--font-serif); white-space:pre-wrap; line-height:1.7;">${esc(lines || "暂无对话历史。")}</div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}

// ============================================================
// CLUE DETAIL — suspect modal / document modal
// ============================================================
function openClueDetail(key) {
  const clue = BMM2.clueIndex[key];
  if (!clue) return;
  const pid = window.BMM2_pidForClue ? window.BMM2_pidForClue(clue) : clue.pid;
  if (clue.type === "person" && pid) return openSuspectModal(pid);
  if (clue.type === "doc" && clue.fname) return openDocModal(clue.fname);
  if (clue.type === "comm") return openCommModal(clue);
  // default: small info popup
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  m.className = "modal";
  m.innerHTML = `
    <header><h2 style="font-family: var(--font-serif); font-size: 16px;">${esc(clue.title)}</h2><span class="close">×</span></header>
    <div class="modal-body">${clueDetailTable(clue)}</div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}
function clueDetailTable(clue) {
  return `<table style="width:100%; font-family:var(--font-mono); font-size:12px;">
    ${clue.cols.map((c, i) => `<tr><td style="color:var(--accent-gold); padding:4px 8px 4px 0;">${esc(c)}</td><td style="padding:4px;">${esc(clue.row[i] == null ? "—" : clue.row[i])}</td></tr>`).join("")}
  </table>`;
}

function openSuspectModal(pid) {
  const row = runRows(`SELECT FullName, Age, Occupation, RelationToElias, RoomID, BirthYear, DeathYear, Notes FROM Persons WHERE PersonID=${pid}`)[0];
  if (!row) return;
  const [name, age, occ, rel, roomId, birth, death, notes] = row;
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  const photo = window.BMM_photoPath ? window.BMM_photoPath(pid) : null;
  const mark = (BMM2.state.marks || {})["person_" + pid] || "unknown";
  const ch7 = chDone(7);

  // Evidence sections (chapter-gated)
  const ev = [];
  if (chDone(2)) ev.push(["当晚刷卡", runRows(`SELECT AccessTime, Name, AccessType, Granted, k.Notes FROM KeycardAccess k JOIN Rooms r ON r.RoomID=k.RoomID WHERE k.PersonID=${pid} ORDER BY AccessTime`).map(r => `${r[0]} · ${r[1]} · ${r[2]}${r[3]?"":' <span style="color:var(--accent-blood-2)">DENIED</span>'}${r[4]?` — ${esc(r[4])}`:""}`)]);
  if (chDone(3)) ev.push(["通讯", runRows(`SELECT StartTime, RecordType, ToName, Content FROM PhoneRecords WHERE FromPersonID=${pid} ORDER BY StartTime`).map(r => `${r[0]} · ${r[1]} → ${esc(r[2]||"?")}${r[3]?` "${esc(r[3]).slice(0,90)}"`:""}`)]);
  if (chDone(4)) ev.push(["酒窖", runRows(`SELECT w.AccessTime, b.Label FROM WineCellarLog w JOIN WineBottles b ON b.BottleID=w.BottleID WHERE w.TakenByPersonID=${pid}`).map(r => `${r[0]} · ${esc(r[1])}`)]);
  if (chDone(5)) ev.push(["借阅", runRows(`SELECT lc.CheckoutDate, lc.ReturnDate, b.Title FROM LibraryCheckouts lc JOIN Books b ON b.BookID=lc.BookID WHERE lc.PersonID=${pid}`).map(r => `${r[0]} → ${r[1]||"未还"} · ${esc(r[2])}`)]);
  if (chDone(6)) ev.push(["Wi-Fi", runRows(`SELECT w.StartTime, w.EndTime, r.Name FROM WiFiSessions w JOIN Rooms r ON r.RoomID=w.APRoomID WHERE w.PersonID=${pid}`).map(r => `${r[0]} → ${r[1]||"?"} · AP: ${esc(r[2])}`)]);

  const convoRows = ch7 ? runRows(`SELECT c.SpokenTime, sp.FullName, ls.FullName, r.Name, c.Snippet FROM Conversations c JOIN Persons sp ON sp.PersonID=c.SpeakerID LEFT JOIN Persons ls ON ls.PersonID=c.ListenerID JOIN Rooms r ON r.RoomID=c.RoomID WHERE c.SpeakerID=${pid} OR c.ListenerID=${pid} ORDER BY c.SpokenTime`) : [];

  // Family — Ch9
  const family = chDone(9) ? runRows(`SELECT p.FullName, ft.RelationType, ft.RecordStatus, ft.EffectiveYear FROM FamilyTree ft JOIN Persons p ON p.PersonID=ft.RelatedPersonID WHERE ft.PersonID=${pid}`) : [];

  m.className = "modal suspect-modal";
  m.innerHTML = `
    <header>
      <img class="suspect-modal-photo" src="${photo || ""}" alt="" loading="lazy" decoding="async" ${photo ? "" : 'style="display:none"'}/>
      <div class="suspect-modal-info">
        <h2>${esc(name)}</h2>
        <div class="meta">${age ? age + " 岁 · " : ""}${esc(occ || "—")} · Room ${roomId ?? "—"}</div>
        <div class="desc">${esc(notes || "")}</div>
        <div class="actions">
          <select id="mark-select">
            <option value="unknown" ${mark==="unknown"?"selected":""}>待查</option>
            <option value="suspect" ${mark==="suspect"?"selected":""}>怀疑</option>
            <option value="cleared" ${mark==="cleared"?"selected":""}>已排除</option>
            <option value="prime"   ${mark==="prime"?"selected":""}>重点嫌疑</option>
          </select>
          <button id="interrogate-btn" ${ch7?"":"disabled"}>${ch7?"询问笔录":"询问笔录（完成第 7 章解锁）"}</button>
        </div>
      </div>
      <span class="close">×</span>
    </header>
    <div class="modal-body">
      ${ev.map(([label, items]) => `
        <div class="section-title">${esc(label)} (${items.length})</div>
        ${items.length ? items.map(t => `<div class="ev-line"><span class="t">${highlight(esc(t.split(" · ")[0]))}</span>${highlight(esc(t.split(" · ").slice(1).join(" · ")))}</div>`).join("") : `<div class="ev-line locked">（无记录）</div>`}
      `).join("")}
      ${ch7 ? `
        <div class="section-title">已偷听到的发言</div>
        ${convoRows.length ? convoRows.map(c => `
          <div class="quote">"${highlight(esc(c[4]))}"
            <div class="meta">${c[0]} · ${esc(c[1])} → ${esc(c[2]||"—")} · ${esc(c[3])}</div>
          </div>
        `).join("") : `<div class="ev-line locked">（无记录）</div>`}
      ` : `<div class="section-title">🔒 询问笔录 · 完成第 7 章解锁</div>`}
      ${family.length ? `
        <div class="section-title">家族关系（已解锁封存档案）</div>
        ${family.map(f => `<div class="ev-line"><span class="t">${f[3]||""}</span>${esc(f[1])} → ${esc(f[0])} <span style="color:${f[2]==='Sealed_Adoption'?'var(--accent-blood-2)':'var(--text-muted)'};">[${esc(f[2])}]</span></div>`).join("")}
      ` : ""}
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
  m.querySelector("#mark-select").addEventListener("change", e => {
    BMM2.state.marks = BMM2.state.marks || {};
    BMM2.state.marks["person_" + pid] = e.target.value;
    save();
    renderClueList();
    renderDashboard();   // refresh status pills in suspect strip
  });
  // Wire up the interrogation button (only when Ch7 unlocked)
  const ibtn = m.querySelector("#interrogate-btn");
  if (ibtn && !ibtn.disabled) {
    ibtn.addEventListener("click", () => openInterrogationTranscript(pid));
  }
}

// ============================================================
// Interrogation transcript modal — multi-tab (说话 / 听话 / 全部)
// Opened from suspect dossier's "询问笔录" button (Ch7+).
// Pulls Conversations rows for the person; highlights keywords.
// ============================================================
function openInterrogationTranscript(pid) {
  const speaker = runRows(`SELECT c.SpokenTime, p2.FullName AS Listener, c.Snippet, r.Name AS Room
                           FROM Conversations c
                           LEFT JOIN Persons p2 ON c.ListenerID = p2.PersonID
                           LEFT JOIN Rooms   r  ON c.RoomID     = r.RoomID
                           WHERE c.SpeakerID=${pid}
                           ORDER BY c.SpokenTime`);
  const listener = runRows(`SELECT c.SpokenTime, p1.FullName AS Speaker, c.Snippet, r.Name AS Room
                            FROM Conversations c
                            INNER JOIN Persons p1 ON c.SpeakerID = p1.PersonID
                            LEFT  JOIN Rooms   r  ON c.RoomID    = r.RoomID
                            WHERE c.ListenerID=${pid}
                            ORDER BY c.SpokenTime`);
  const persons = runRows(`SELECT FullName FROM Persons WHERE PersonID=${pid}`);
  const pname = persons.length ? persons[0][0] : "Unknown";

  const highlight = (s) => window.BMM2_cards && window.BMM2_cards.highlightKeywords
    ? window.BMM2_cards.highlightKeywords(String(s))
    : esc(s);

  const renderRows = (rows, otherLabel) => rows.length === 0
    ? `<div style="padding: 30px; text-align:center; color: var(--text-muted); font-style: italic;">— 无记录 —</div>`
    : rows.map(r => `
        <div class="transcript-card">
          <div class="transcript-meta">
            <span>${esc(r[0])}</span>
            <span>· ${esc(r[3] || "—")}</span>
            <span>· ${otherLabel}: <b>${esc(r[1] || "—")}</b></span>
          </div>
          <div class="transcript-quote">${highlight(r[2])}</div>
        </div>`).join("");

  const all = [].concat(
    speaker.map(r => ({ time: r[0], who: pname, to: r[1], snip: r[2], room: r[3], side: "→" })),
    listener.map(r => ({ time: r[0], who: r[1], to: pname, snip: r[2], room: r[3], side: "←" }))
  ).sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const allHtml = all.length === 0
    ? `<div style="padding: 30px; text-align:center; color: var(--text-muted);">— 无记录 —</div>`
    : all.map(r => `
        <div class="transcript-card">
          <div class="transcript-meta">
            <span>${esc(r.time)}</span> · <span>${esc(r.room || "—")}</span>
          </div>
          <div class="transcript-quote">
            <b>${esc(r.who)}</b> ${r.side} <b>${esc(r.to)}</b>:<br/>
            ${highlight(r.snip)}
          </div>
        </div>`).join("");

  const veil = document.getElementById("modal-veil");
  const m    = document.getElementById("modal-content");
  m.className = "modal";
  m.style.maxWidth = "640px";
  m.innerHTML = `
    <header>
      <h2 style="font-family: var(--font-serif); font-size: 17px;">
        ${esc(pname)} · 询问笔录
      </h2>
      <span class="close">×</span>
    </header>
    <div class="modal-body">
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="all">全部 (${all.length})</button>
        <button class="tab-btn"        data-tab="speaker">作为说话人 (${speaker.length})</button>
        <button class="tab-btn"        data-tab="listener">作为听话人 (${listener.length})</button>
      </div>
      <div class="tab-pane active" data-pane="all">${allHtml}</div>
      <div class="tab-pane"        data-pane="speaker">${renderRows(speaker, "对")}</div>
      <div class="tab-pane"        data-pane="listener">${renderRows(listener, "来自")}</div>
      <p style="color: var(--text-muted); font-style: italic; font-size: 12px; margin-top: 12px;">
        — 资料整理：Mrs Eileen Hodge（管家笔记本誊抄）
      </p>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
  m.querySelectorAll(".tab-btn").forEach(b => {
    b.addEventListener("click", () => {
      m.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
      m.querySelectorAll(".tab-pane").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      m.querySelector(`[data-pane="${b.dataset.tab}"]`).classList.add("active");
    });
  });
}

function openDocModal(fname) {
  const row = runRows(`SELECT EventTime, Action, FileName, CharCount, PreviewText FROM WritingSoftwareLog WHERE FileName='${String(fname).replace(/'/g, "''")}' ORDER BY EventTime`);
  if (!row.length) return;
  const ch10 = chDone(10);
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  m.className = "modal doc-modal";
  // Show last preview text. If Memo & Ch10 not done → encrypted.
  const last = row[row.length - 1];
  let body = last[4] || "";
  const isMemo = String(fname).startsWith("Memo_PersonalNote");
  if (isMemo && !ch10) body = "[文件加密。完成 10 章子查询任务后可恢复。]";
  const isDeleted = row.some(r => r[1] === "Delete");
  m.innerHTML = `
    <header>
      <div style="flex:1;">
        <div style="font-family: var(--font-serif); font-size: 18px; color: var(--text-primary);">📖 ${esc(fname)}</div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
          字符数: ${last[3] ?? "—"} · ${isDeleted ? '<span style="color:var(--accent-blood-2)">⚠ 已被删除</span>' : "完好"}
        </div>
      </div>
      <span class="close">×</span>
    </header>
    <div class="modal-body" style="padding:0;">
      <div class="doc-paper">
        <div class="doc-header">SCRIVENER · AUTOSAVE LOG</div>
        <div class="doc-meta">
          ${row.map(r => `<span>${esc(r[0])} · ${esc(r[1])}</span>`).join("")}
        </div>
        <div class="doc-body" id="doc-body">${highlight(esc(body))}</div>
      </div>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}

function openCommModal(clue) {
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  m.className = "modal";
  const content = (clue.cols.indexOf("Content") >= 0 ? clue.row[clue.cols.indexOf("Content")] : clue.cols.indexOf("Snippet") >= 0 ? clue.row[clue.cols.indexOf("Snippet")] : "");
  m.innerHTML = `
    <header><h2 style="font-family: var(--font-serif); font-size: 16px;">${esc(clue.title)}</h2><span class="close">×</span></header>
    <div class="modal-body">
      <div class="quote">${highlight(esc(content))}
        <div class="meta">${clueDetailTable(clue)}</div>
      </div>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}

function closeModal() {
  document.getElementById("modal-veil").classList.remove("open");
  const m = document.getElementById("modal-content");
  if (m) m.style.maxWidth = ""; // reset width overrides set by tutorial/help/etc.
}

// ============================================================
// HELP / 案件简介 (ⓘ button) — re-readable case briefing
// ============================================================
function openHelp() {
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  m.className = "modal";
  m.style.maxWidth = "580px";
  m.innerHTML = `
    <header>
      <h2 style="font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.10em;">
        案件简介 / OPERATIONS
      </h2>
      <span class="close">×</span>
    </header>
    <div class="modal-body" style="font-family: var(--font-serif); line-height: 1.65; font-size: 14px;">
      <p style="color: var(--accent-gold); letter-spacing: 0.08em; font-size: 12px;">— 案件 BMM-2024-1019</p>
      <p>Elias Blackwood，67 岁，三度 Booker 提名作家。<b>周日 (10/20) 08:30</b> 被秘书发现死于自己的书房（Room 103）。钝器击打头部，凶器：书桌上的青铜书挡。</p>
      <p>法医估算的<b style="color: var(--accent-blood);">死亡时间窗口：00:30 – 01:30</b>。一小时。</p>
      <p>当晚在庄园里的人：<b>7 位嘉宾</b> + <b>5 名常驻员工</b>。每个房间都有门禁刷卡，整栋楼有 Wi-Fi 日志。</p>
      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 16px 0;"/>
      <h3 style="font-family: var(--font-serif); font-size: 14px; color: var(--accent-gold); letter-spacing: 0.1em;">操作提示</h3>
      <ul style="padding-left: 22px;">
        <li>底部 SQL 终端：<code style="font-family: var(--font-mono); background: var(--bg-card); padding: 1px 6px;">⌘/Ctrl + ⏎</code> 或 <code style="font-family: var(--font-mono); background: var(--bg-card); padding: 1px 6px;">Shift + ⏎</code> 跑查询</li>
        <li>查询结果会自动归档成左栏<b style="color: var(--accent-gold);">线索卡片</b></li>
        <li>拖卡片到中央<b style="color: var(--accent-gold);">调查白板</b>（或点 ★ 钉住）</li>
        <li>白板上：按住 <b>Alt</b> 从一张卡拖到另一张，可以画 <b style="color:var(--accent-blood);">红色关联线</b></li>
        <li>单击人物卡 → <b style="color: var(--accent-gold);">完整档案</b>（可 Mark：待查/怀疑/已排除/重点嫌疑）</li>
        <li>右上角 📁 档案柜：你已完成的所有步骤回顾</li>
        <li>右栏底部：侦探笔记，自动保存</li>
        <li><b>用提示按钮会扣 5 探案分</b>——慎用</li>
      </ul>
      <p style="color: var(--text-muted); font-style: italic; font-size: 13px; margin-top: 18px;">
        Brennan：「数据胜过直觉。你的工具就在这里。开始吧。」
      </p>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}

// ============================================================
// SETTINGS
// ============================================================
function openSettings() {
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  m.className = "modal";
  m.innerHTML = `
    <header><h2 style="font-family: var(--font-serif); font-size: 16px; letter-spacing: 0.16em;">设置 / SETTINGS</h2><span class="close">×</span></header>
    <div class="modal-body" style="font-family: var(--font-mono); line-height: 2;">
      <p style="color: var(--text-secondary);">— 案件 BMM-2024-1019</p>
      <p>探案分: <b style="color:var(--accent-gold)">${BMM2.state.score}</b> · 已归档线索: ${BMM2.state.completedTasks.length}</p>
      <p>已运行查询: ${BMM2.state.stats.queriesRun} · 错误: ${BMM2.state.stats.errors} · 提示用次: ${BMM2.state.stats.hintsUsed}</p>
      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 16px 0;"/>
      <div style="display:flex; gap: 10px; flex-wrap: wrap;">
        <button id="btn-reset-game" style="background: var(--accent-blood); color: var(--text-primary); border: 1px solid var(--accent-blood); padding: 8px 16px; cursor: pointer; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em;">重新开始游戏</button>
        <button id="btn-show-report" ${isComplete()?"":"disabled"} style="background: transparent; color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 8px 16px; cursor: ${isComplete()?"pointer":"not-allowed"}; font-family: var(--font-mono); font-size: 11px; opacity: ${isComplete()?"1":"0.5"};">查看结案报告</button>
      </div>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  m.querySelector("#btn-reset-game").addEventListener("click", () => {
    if (confirm("确定要清空所有进度，回到开始画面吗？")) reset();
  });
  m.querySelector("#btn-show-report").addEventListener("click", () => { closeModal(); openCaseReport(); });
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
}

// ============================================================
// HELPERS
// ============================================================
function runRows(sql) {
  try {
    const r = BMM2.db.exec(sql);
    if (!r.length) return [];
    return r[0].values;
  } catch (e) {
    console.warn("runRows fail:", e); return [];
  }
}
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function highlight(s) { return window.BMM2_cards.highlightKeywords(s); }

// ============================================================
// Expose public API for cards.js / chapters.js
// ============================================================
window.BMM2_workspace = {
  refreshTopbar, save,
  openClueDetail, runRows, esc
};

// ============================================================
// Boot
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-enter")?.addEventListener("click", () => enterWorkspace(true));
  document.getElementById("btn-skip")?.addEventListener("click", skipOpening);
  boot();
});

// Forward-declared functions (defined in chapters.js)
function playRitual(name) { return window.BMM2_chapters?.playRitual(name); }
function openCaseReport() { return window.BMM2_chapters?.openCaseReport(); }
