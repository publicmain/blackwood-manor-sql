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
  setLoadingMsg("正在连接到阿什福德庄园临时指挥室...");
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
  });
  BMM2.db = new SQL.Database();
  BMM2.db.exec(window.BMM_SQL);
  setLoadingMsg("数据库已就绪");

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

  // Stage 4: 布伦南 monologue
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

伊莱亚斯·布莱克伍德，六十七岁，三度获奖作家，今早八点半被秘书发现死在自己的书房。
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
  // Phase 1: fade out the police-file/布伦南 monologue splash
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
  renderDashboard();   // case dashboard: suspect strip + progress glance
  refreshTaskCard();
  refreshTopbar();

  // Wire up
  bindTopbar();
  bindLeftRail();
  bindTerminal();
  bindRightRail();
  initPersonHoverCard();   // hover cards over names in 布伦南's dialogue

  // First run: pick a difficulty, THEN meet the cast. On later runs both
  // are skipped (flags persisted in state).
  function showCastOnce() {
    if (!BMM2.state.castShown) {
      BMM2.state.castShown = true;
      save();
      setTimeout(() => openCaseFile("cast"), 300);
    }
  }
  if (!BMM2.state.difficulty) {
    setTimeout(() => chooseDifficulty(() => {
      reloadCurrentStarter();   // apply the chosen scaffold to the editor
      showCastOnce();
    }), 300);
  } else {
    showCastOnce();
  }

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
        <button id="btn-casefile" title="案件资料：人物 / 数据表 / 庄园地图 / 案情进展">📂 案件资料</button>
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
            <span class="dash-label">📓 案情进展</span>
            <span class="dash-sub" id="dash-progress-sub">点击顶栏「📂 案件资料」查看完整回顾</span>
          </div>
          <div class="case-progress" id="case-progress-glance"></div>
        </div>
      </div>
      <div class="task-card" id="task-card">
        <div class="head">
          <span id="task-chapter">当前任务</span>
          <span class="close" id="task-close" title="收起">−</span>
        </div>
        <h3 id="task-title">—</h3>
        <div class="task-brief" id="task-brief"></div>
        <p class="task-detail" id="task-body">—</p>
        <div class="hint-row">
          <button id="task-hint">💡 提示</button>
          <button id="task-skip-anim" title="跳过台词打字动画">⏩ 台词</button>
        </div>
        <button id="task-skip-story" title="不想写 SQL？直接看数据、继续故事">⏭ 跳过此题 · 继续故事 →</button>
      </div>
    </section>

    <aside class="right-rail">
      <div class="brennan-block">
        <div class="brennan-head">
          ${brennanPhotoEl()}
          <div>
            <div class="brennan-name">詹姆斯·布伦南 督察</div>
            <div class="brennan-rank">格洛斯特郡 刑事调查科</div>
            <div class="brennan-mood" id="brennan-mood"></div>
          </div>
        </div>
        <!-- Dialogue log: newest beat on top, older ones stacked below, fading -->
        <div class="dialogue-log" id="dialogue-log"></div>
        <!-- Active speech bubble (current typewriter destination) -->
        <div class="speech-bubble" id="brennan-bubble">
          <div class="bubble-head">
            <span class="bubble-time" id="bubble-time"></span>
            <span class="bubble-name">布伦南</span>
          </div>
          <div class="speech" id="brennan-speech"></div>
        </div>
        <div class="brennan-actions">
          <button id="btn-dialogue-history">完整对话历史</button>
        </div>
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
      <div class="result-gain" id="result-gain" style="display:none;"></div>
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
      <div class="stamp">案件了结</div>
      <div class="stamp-sub">2024 · 10 · 30</div>
    </div>
  `;
}

function brennanPhotoEl() {
  // If portraits/布伦南.png exists, use it; otherwise emit an inline SVG
  // silhouette so the right-rail looks like a redacted dossier portrait
  // rather than two flat letters.
  return `<div class="brennan-photo svg-portrait">
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-label="詹姆斯·布伦南督察（肖像已隐去）">
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
      <text x="50" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="6" fill="#B89968" letter-spacing="0.2em">布伦南</text>
    </svg>
  </div>`;
}

// ============================================================
// TOP BAR / DRAWERS / MODALS / SETTINGS
// ============================================================
function bindTopbar() {
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("btn-casefile").addEventListener("click", () => openCaseFile("cast"));
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
// 案件资料 (CASE FILE) — a tabbed reference panel: 人物 / 数据表 /
// 庄园地图 / 案情进展. Built so Chinese-speaking players can keep
// track of foreign names, know what tables/columns exist, see where
// rooms are, and recap what has happened.
// ============================================================
const CASEFILE_CAST = {
  victim: [
    { pid: 1, en: "伊莱亚斯·布莱克伍德", zh: "伊莱亚斯·布莱克伍德", role: "死者 · 67 岁 · 三度获奖作家",
      rel: "本案死者", hook: "周日清晨被秘书发现死在书房，钝器（青铜书挡）击打头部。" }
  ],
  suspects: [
    { pid: 2, en: "薇薇安·阿什福德", zh: "薇薇安·阿什福德", role: "前妻 · 庄园主人",
      rel: "前妻（2016 离婚）", hook: "离婚后仍住庄园，怕失去终身居住权。" },
    { pid: 3, en: "索菲娅·布莱克伍德", zh: "索菲娅·布莱克伍德", role: "现任妻子 · 前编辑",
      rel: "现任妻子（2020 结婚）", hook: "曾是 伊莱亚斯 的编辑，婚前协议苛刻。" },
    { pid: 4, en: "马库斯·索恩", zh: "马库斯·索恩", role: "文学经纪人（合作 22 年）",
      rel: "经纪人", hook: "刚离婚、酗酒，怕被 伊莱亚斯 解约而破产。" },
    { pid: 5, en: "艾莉丝·陈", zh: "艾莉丝·陈", role: "2023 年黑木奖得主 · 后辈作家",
      rel: "门生", hook: "安静寡言，反复借阅 伊莱亚斯 的成名作《沉默时刻》。" },
    { pid: 6, en: "朱利安·哈特利", zh: "朱利安·哈特利", role: "同行 · 宿敌",
      rel: "对手", hook: "连续三年屈居黑木奖亚军，妻子 2023 年去世。" },
    { pid: 7, en: "埃莉诺·赖特", zh: "埃莉诺·赖特", role: "授权传记作者",
      rel: "授权传记作者", hook: "为 伊莱亚斯 写传记三年，剑桥三一学院出身。" },
    { pid: 8, en: "亨里克·沃尔科夫", zh: "亨里克·沃尔科夫", role: "文学评论家",
      rel: "评论家", hook: "俄裔，毒舌——骂过 伊莱亚斯 最近四部小说。" }
  ],
  family: [
    { pid: 14, en: "玛格丽特·布莱克伍德", zh: "玛格丽特·布莱克伍德", role: "伊莱亚斯 的妹妹（已故）",
      rel: "妹妹", hook: "有抱负的作家，1986 年 22 岁自杀。" },
    { pid: 15, en: "查尔斯·布莱克伍德", zh: "查尔斯·布莱克伍德", role: "父亲（已故）",
      rel: "父亲", hook: "伊莱亚斯 与 玛格丽特 的父亲。" },
    { pid: 16, en: "亨丽埃塔·布莱克伍德", zh: "亨丽埃塔·布莱克伍德", role: "母亲（已故）",
      rel: "母亲", hook: "伊莱亚斯 与 玛格丽特 的母亲。" },
    { pid: 17, en: "罗伯特·赖特", zh: "罗伯特·赖特", role: "埃莉诺 的养父（已故）",
      rel: "埃莉诺 养父", hook: "埃莉诺 的法定父亲。" },
    { pid: 18, en: "帕特里夏·赖特", zh: "帕特里夏·赖特", role: "埃莉诺 的养母（已故）",
      rel: "埃莉诺 养母", hook: "埃莉诺 的法定母亲。" }
  ],
  staff: [
    { pid: 9, en: "Mrs Eileen Hodge", zh: "艾琳·霍奇太太", role: "管家",
      rel: "庄园员工", hook: "随身带一本记录宾客言行的笔记本。" },
    { pid: 10, en: "Mr Albert Pemberton", zh: "阿尔伯特·彭伯顿", role: "男管家",
      rel: "庄园员工", hook: "CCTV 监控系统的管理员。" },
    { pid: 11, en: "安东·沃尔科夫", zh: "安东·沃尔科夫", role: "园丁",
      rel: "庄园员工", hook: "评论家 亨里克 疏远的儿子。" },
    { pid: 12, en: "Chef Pierre Dubois", zh: "皮埃尔·杜布瓦", role: "主厨",
      rel: "庄园员工", hook: "承办了周六的颁奖晚宴。" },
    { pid: 13, en: "萨拉 Whitcombe", zh: "萨拉·惠特科姆", role: "秘书",
      rel: "伊莱亚斯 的助理", hook: "周日上午发现尸体的人。" }
  ]
};

// Flat PersonID → cast entry lookup (used by hover cards & dossiers).
const CASEFILE_BY_PID = {};
for (const grp of Object.values(CASEFILE_CAST)) {
  for (const p of grp) CASEFILE_BY_PID[p.pid] = p;
}

// Rich Chinese biographies shown in the dossier (openSuspectModal).
// SPOILER RULE: surface personas only — no blood-link, no plagiarism,
// no hint at who the killer is. These read like a pre-investigation
// case file, not the solution.
const PERSON_BIO = {
  1: `伊莱亚斯·布莱克伍德，六十七岁，英国当代最负盛名的小说家之一，曾三度入围布克奖。二十六岁那年，他凭长篇《沉默时刻》一举成名，从此奠定文坛地位——后来设立的黑木文学奖，正是以他的姓氏命名。
他出身 Cotswolds 的旧式家庭，年少时与妹妹玛格丽特一同在这座庄园长大。成名之后，他以严苛、骄傲、难以亲近著称：编辑、经纪人、后辈作家，几乎没人能轻易走近他。
近两年他不再发表新作，转而埋头写一部回忆录。书房那台笔记本电脑上的文档，停在了第七章。`,

  2: `薇薇安·阿什福德，伊莱亚斯的第一任妻子。黑木庄园原本属于阿什福德家族，是她带进这桩婚姻的嫁妆。
两人于 2016 年离婚，但按照离婚协议，薇薇安保留了庄园的终身居住权——前提是她一直住在这里。于是离婚之后，她依旧像女主人一样打理着这座庄园：安排晚宴、照看花园、管束仆役。
外人很难看清她对这段早已结束的婚姻究竟是怨还是恋。唯一确定的是，她最害怕的，是有朝一日被请出这扇大门。`,

  3: `索菲娅·布莱克伍德，伊莱亚斯的第二任妻子。她原是出版社的资深编辑，伊莱亚斯近十年的几部作品，都曾经她的手打磨成形。
两人于 2020 年结婚，外界议论颇多——她比他年轻许多。婚前协议的条款相当苛刻：若这段婚姻在伊莱亚斯生前破裂，她几乎将一无所获。
婚后她逐渐淡出编辑行业，全心扮演"作家妻子"的角色。但熟悉她的人都说，索菲娅从来不是甘心站在别人光环背后的人。`,

  4: `马库斯·索恩，与伊莱亚斯·布莱克伍德合作了整整二十二年的文学经纪人。从《沉默时刻》起，他便一路替伊莱亚斯打理合同、版税与版权，两人的事业几乎是绑在一起长大的。
然而近几年马库斯过得并不顺：一场离婚、长期酗酒、几位重要客户相继离去，让他的经纪公司摇摇欲坠。
如果连伊莱亚斯也决定与他解约，他多年苦心经营的一切，恐怕会在一夜之间崩塌。`,

  5: `艾莉丝·陈，年轻一代中最受瞩目的新锐作家，2023 年黑木文学奖得主。
她安静、寡言，在喧嚷的文学圈里几乎隐形，却被不少评论家视为伊莱亚斯之后最具分量的接班人。她对伊莱亚斯怀着近乎虔诚的敬意，曾反复借阅、研读他的成名作《沉默时刻》。
这个周末她受邀回到庄园领奖，却比任何人都更少出现在客厅与宴会厅。`,

  6: `朱利安·哈特利，与伊莱亚斯同辈的小说家，也是他公认的文坛宿敌。两人几乎在同一年出道，此后三十年被反复拿来比较。
黑木文学奖设立以来，朱利安连续三年止步亚军。2023 年，他的妻子病逝，此后他变得愈发沉默而尖锐。
他从不掩饰自己对伊莱亚斯的轻蔑——也从不掩饰，自己有多想赢下哪怕一次。`,

  7: `埃莉诺·赖特，四十四岁，伊莱亚斯亲自授权的传记作者。她毕业于剑桥三一学院，治学严谨，以擅长梳理庞杂的史料著称。
过去三年，她几乎住进了黑木庄园，逐字逐句地整理伊莱亚斯的书信、手稿与人生。她沉静、专注，对细节有着近乎执拗的认真——同一段往事，她总要反复核对到完全确凿，才肯落笔。
这部传记原定本周末随颁奖礼一同公布，是她三年心血的句点。`,

  8: `亨里克·沃尔科夫，俄裔文学评论家，以言辞犀利、毫不留情著称。他的书评是许多作家的噩梦——而伊莱亚斯近四部小说，几乎被他逐一贬得体无完肤。
两人在公开场合多次交锋，私下据说也早已积怨。亨里克坚持认为，真正的批评不该顾及情面。
他这次受邀出席颁奖礼，本身就让不少人感到意外。`,

  9: `艾琳·霍奇太太，黑木庄园的女管家，在这里已工作二十余年。庄园里大小事务、宾客起居，都归她照料。
她有一个多年的习惯——随身带着一本小笔记本，记下当天庄园里发生的事、听到的话。她说这是为了不出差错；但宾客们大多并不知道，自己随口的一句话，可能就被记进了那本本子里。`,

  10: `阿尔伯特·彭伯顿，黑木庄园的男管家，做事一丝不苟。除了迎送宾客、打理门厅，他还兼管着庄园那套并不算新的安保系统——门禁读卡器、各处的监控摄像头，都由他维护。
哪扇门在什么时间被刷过、哪个房间装没装监控，这些事，他比庄园里任何人都清楚。`,

  11: `安东·沃尔科夫，黑木庄园的园丁，沉默而勤恳，常常天还没亮就在花园里忙碌。
他是评论家亨里克·沃尔科夫的儿子，但父子俩多年来形同陌路，几乎不再往来。他选择在远离文学圈的庄园里做一名园丁——这本身，或许就是一种回答。`,

  12: `皮埃尔·杜布瓦，法国主厨，黑木庄园重要宴席的掌勺人。这个周末的颁奖晚宴正是由他一手操办，从菜单到上菜次序都亲自把关。
他大半时间都在厨房与宴会厅之间往返，当晚谁坐在哪、谁动过什么，往往都看在他眼里。`,

  13: `萨拉·惠特科姆，伊莱亚斯·布莱克伍德的私人秘书，已为他工作三年。她替伊莱亚斯打理日程、信件与书房事务，每周日上午都会准时把报纸与早餐送到书房门口。
正是她，在那个周日清晨推开了书房的门——成为最早发现伊莱亚斯遇害的人。`,

  14: `玛格丽特·布莱克伍德，伊莱亚斯的妹妹，比他小几岁。她自幼在黑木庄园长大，和哥哥一样热爱文学，年轻时也怀着成为作家的抱负，写下过不少作品。
然而她的人生在 1986 年戛然而止——那一年她二十二岁，选择结束了自己的生命。家族对她的离世讳莫如深，多年来，很少有人在庄园里提起她的名字。`,

  15: `查尔斯·布莱克伍德，伊莱亚斯与玛格丽特的父亲，老一辈的布莱克伍德家主。他治家严厉，极重家族颜面，是那个年代典型的旧式英国家长。
他在世时极少在公开场合谈及家中私事，许多旧事，也随他一同沉入了沉默。`,

  16: `亨丽埃塔·布莱克伍德，伊莱亚斯与玛格丽特的母亲。她出身体面人家，一生操持着黑木庄园的内务。
关于她的记载不多——在那个年代，家族的女主人往往隐没在丈夫与子女的身影之后。`,

  17: `罗伯特·赖特，埃莉诺·赖特法律意义上的父亲。他是一位低调的乡村教师，与妻子帕特里夏一同把埃莉诺抚养成人。
他一生重视教育，埃莉诺日后能考入剑桥，与他早年的督促分不开。`,

  18: `帕特里夏·赖特，埃莉诺·赖特法律意义上的母亲。她温和持家，与丈夫罗伯特一起，给了埃莉诺一个安静的成长环境。
她为人低调，把一生的心力都给了这个家。`
};

// table → {中文名, 用途}. Columns are read live via PRAGMA table_info.
const CASEFILE_TABLES = [
  ["Persons",            "人物档案",   "庄园里每个人的基本信息：姓名、年龄、身份、与死者的关系、所住房间。"],
  ["Rooms",              "房间",       "庄园每个房间的名称、楼层、侧翼，以及是否装有监控。"],
  ["KeycardAccess",      "门禁刷卡",   "每张门卡进出每个房间的时间与类型（进入 / 离开 / 被拒 / 越权）。"],
  ["WiFiSessions",       "WiFi 会话",  "每个人的设备连接到哪个房间 AP 的起止时间——能反推人在哪。"],
  ["PhoneRecords",       "通讯记录",   "当晚的短信与通话记录，含发送人、时间、内容。"],
  ["WineCellarLog",      "酒窖取酒",   "谁、在什么时间、取走了哪一瓶酒。"],
  ["WineBottles",        "藏酒",       "酒窖里每瓶酒的酒名、年份、货架位置。"],
  ["Contracts",          "合同",       "庄园相关的法律合同，含状态（草稿 / 已签）与金额。"],
  ["LibraryCheckouts",   "借阅记录",   "谁借了哪本书、借出与归还日期。"],
  ["Books",              "藏书",       "图书馆书目：书名、作者、类型。"],
  ["SeatingChart",       "晚宴座次",   "周六颁奖晚宴每个座位坐了谁。"],
  ["Conversations",      "偷听对话",   "管家笔记本里记下的对话片段：说话人、听话人、地点、内容。"],
  ["CCTVFiles",          "监控文件",   "各房间监控录像的状态，包含被删除的录像。"],
  ["FamilyTree",         "家族关系",   "人物之间的亲属关系（部分领养记录被封存）。"],
  ["WritingSoftwareLog", "写作日志",   "伊莱亚斯 笔记本上 Scrivener 的自动保存与删除记录。"],
  ["PhysicalEvidence",   "现场物证",   "鉴证科采集的现场物证与指纹 / 纤维比对结果。"],
  ["PrizeHistory",       "获奖历史",   "黑木文学奖历年的得主与亚军。"]
];

function openCaseFile(tab) {
  tab = tab || "cast";
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  if (!veil || !m) return;
  m.className = "modal casefile-modal";
  const tabs = [
    ["cast",     "👥 人物"],
    ["tables",   "🗃️ 数据表"],
    ["map",      "🗺️ 庄园地图"],
    ["progress", "📓 案情进展"]
  ];
  m.innerHTML = `
    <header>
      <h2 style="font-family:var(--font-serif); font-size:17px; letter-spacing:0.12em;">📂 案件资料</h2>
      <span class="close">×</span>
    </header>
    <div class="casefile-tabs">
      ${tabs.map(([k, label]) =>
        `<button class="cf-tab ${k === tab ? "active" : ""}" data-tab="${k}">${label}</button>`
      ).join("")}
    </div>
    <div class="casefile-body" id="casefile-body"></div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  veil.addEventListener("click", e => { if (e.target === veil) closeModal(); });
  m.querySelectorAll(".cf-tab").forEach(b => {
    b.addEventListener("click", () => {
      m.querySelectorAll(".cf-tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderCaseFileTab(b.dataset.tab);
    });
  });
  renderCaseFileTab(tab);
}

function renderCaseFileTab(tab) {
  const body = document.getElementById("casefile-body");
  if (!body) return;
  if (tab === "cast")     body.innerHTML = caseFileCastHTML();
  else if (tab === "tables")  { body.innerHTML = caseFileTablesHTML(); bindCaseFileTables(body); }
  else if (tab === "map")     body.innerHTML = caseFileMapHTML();
  else if (tab === "progress") body.innerHTML = caseFileProgressHTML();
  body.scrollTop = 0;
  // Person cards open the full dossier.
  body.querySelectorAll("[data-person]").forEach(el => {
    el.addEventListener("click", () => {
      const pid = parseInt(el.dataset.person, 10);
      if (pid) openSuspectModal(pid, true);
    });
  });
}

function castCardHTML(p, opts) {
  opts = opts || {};
  const photo = window.BMM_photoPath ? window.BMM_photoPath(p.pid) : null;
  const marks = BMM2.state.marks || {};
  const mark = marks["person_" + p.pid];
  const markLabel = mark && mark !== "unknown" ? MARK_LABEL[mark] : "";
  const photoEl = photo
    ? `<img src="${photo}" alt="" loading="lazy" decoding="async"/>`
    : `<div class="cc-ph">${esc(p.en.charAt(0))}</div>`;
  return `
    <div class="cast-card ${opts.suspect ? "is-suspect" : ""}" data-person="${p.pid}"
         title="点击查看 ${esc(p.zh)} 的完整档案">
      <div class="cc-photo">${photoEl}</div>
      <div class="cc-body">
        <div class="cc-names">
          <span class="cc-zh">${esc(p.zh)}</span>
          ${markLabel ? `<span class="cc-mark mark-${mark}">${markLabel}</span>` : ""}
        </div>
        <div class="cc-role">${esc(p.role)}</div>
        <div class="cc-hook">${esc(p.hook)}</div>
      </div>
    </div>`;
}

function caseFileCastHTML() {
  const C = CASEFILE_CAST;
  return `
    <p class="cf-intro">外国人名难记？这一页随时可查。<b>点任意一张卡片</b>可打开此人的完整档案（门禁、通话、对话、当前线索）。</p>
    <div class="cf-group-title">☠ 死者</div>
    <div class="cast-grid">${C.victim.map(p => castCardHTML(p)).join("")}</div>
    <div class="cf-group-title">🎯 七名嫌疑人（昨晚住在庄园的 Guest）</div>
    <div class="cast-grid">${C.suspects.map(p => castCardHTML(p, { suspect: true })).join("")}</div>
    <div class="cf-group-title">🌳 布莱克伍德家族（已故 · 与动机相关）</div>
    <div class="cast-grid">${C.family.map(p => castCardHTML(p)).join("")}</div>
    <div class="cf-group-title">🛎 庄园员工</div>
    <div class="cast-grid">${C.staff.map(p => castCardHTML(p)).join("")}</div>
  `;
}

function caseFileTablesHTML() {
  let html = `<p class="cf-intro">这是案件数据库里的全部数据表。写 SQL 前先在这里查清楚<b>表名和字段名</b>。点「▶ 看看内容」可预览前几行真实数据。</p>`;
  for (const [name, zh, purpose] of CASEFILE_TABLES) {
    let colsHtml = "";
    try {
      const info = BMM2.db.exec(`PRAGMA table_info('${name}')`);
      const rows = (info[0] && info[0].values) ? info[0].values : [];
      colsHtml = rows.map(r => {
        const colName = r[1], colType = r[2], pk = r[5];
        return `<span class="cf-col">${esc(colName)}<span class="cf-type">${esc(colType || "")}</span>${pk ? '<span class="cf-pk">PK</span>' : ""}</span>`;
      }).join("");
    } catch (e) {
      colsHtml = `<span class="cf-col">（无法读取字段）</span>`;
    }
    html += `
      <div class="cf-table" data-table="${esc(name)}">
        <div class="cf-table-head">
          <span class="cf-table-name">${esc(name)}</span>
          <span class="cf-table-zh">${esc(zh)}</span>
        </div>
        <div class="cf-table-purpose">${esc(purpose)}</div>
        <div class="cf-cols">${colsHtml}</div>
        <button class="cf-peek" data-table="${esc(name)}">▶ 看看内容（前 5 行）</button>
        <div class="cf-peek-result"></div>
      </div>`;
  }
  return html;
}

function bindCaseFileTables(body) {
  body.querySelectorAll(".cf-peek").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.table;
      const out = btn.nextElementSibling;
      if (out.innerHTML) { out.innerHTML = ""; btn.textContent = "▶ 看看内容（前 5 行）"; return; }
      let res;
      try {
        const safe = window.BMM2_filterQuery
          ? window.BMM2_filterQuery(`SELECT * FROM ${name} LIMIT 5`, BMM2.state)
          : `SELECT * FROM ${name} LIMIT 5`;
        res = BMM2.db.exec(safe);
      } catch (e) { out.innerHTML = `<div class="cf-peek-err">读取失败：${esc(e.message)}</div>`; return; }
      const r = res[0];
      if (!r || !r.values.length) { out.innerHTML = `<div class="cf-peek-err">（这张表暂时没有可见数据。）</div>`; btn.textContent = "▲ 收起"; return; }
      let t = `<table class="cf-peek-table"><thead><tr>${r.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`;
      for (const row of r.values) {
        t += `<tr>${row.map(c => `<td>${c == null ? "<i>NULL</i>" : esc(String(c).slice(0, 60))}</td>`).join("")}</tr>`;
      }
      t += "</tbody></table>";
      out.innerHTML = t;
      btn.textContent = "▲ 收起";
    });
  });
}

// Hand-laid manor floor plan. Each room is placed on a CSS grid so the
// map reads like a real architectural plan, not a flat list.
//   c = grid column start, r = row start, cw = column span, rw = row span
//   kind: "room" | "corridor" | "stair"
const MANOR_FLOORPLAN = {
  3: {
    name: "三楼 · 宾客层", cols: 6,
    desc: "七名嫌疑人就住在这一层的客房里。",
    rooms: [
      { rid: 604, zh: "宾客区走廊",        c: 1, r: 1, cw: 6, kind: "corridor" },
      { rid: 301, zh: "客房 · 马库斯·索恩",  c: 1, r: 2 },
      { rid: 302, zh: "客房 · 艾莉丝·陈",    c: 2, r: 2 },
      { rid: 303, zh: "客房 · 朱利安·哈特利", c: 3, r: 2 },
      { rid: 304, zh: "客房 · 埃莉诺·赖特",  c: 4, r: 2 },
      { rid: 305, zh: "客房 · 亨里克·沃尔科夫", c: 5, r: 2 }
    ]
  },
  2: {
    name: "二楼 · 案发楼层", cols: 6,
    desc: "凶案发生在书房（103）。红色标出的，是案发现场以及与它相邻的房间——书房、档案室，和它们之间的那道连接门。",
    rooms: [
      { rid: 603, zh: "西翼走廊",  c: 1, r: 1, cw: 2, kind: "corridor" },
      { rid: 602, zh: "东翼走廊",  c: 3, r: 1, cw: 4, kind: "corridor" },
      { rid: 201, zh: "阿什福德套房 · 薇薇安", c: 1, r: 2, cw: 2 },
      { rid: 405, zh: "档案室",    c: 3, r: 2, crime: true },
      { rid: 406, zh: "连接门",    c: 4, r: 2, crime: true, kind: "door" },
      { rid: 103, zh: "书房 · 案发现场", c: 5, r: 2, crime: true },
      { rid: 101, zh: "主人套房 · 伊莱亚斯", c: 6, r: 2 },
      { rid: 102, zh: "主人配房 · 索菲娅",   c: 6, r: 3 }
    ]
  },
  1: {
    name: "一楼 · 公共区域", cols: 4,
    desc: "晚宴、酒会都在这一层。",
    rooms: [
      { rid: 601, zh: "正厅",     c: 1, r: 1, cw: 2 },
      { rid: 403, zh: "宴会厅",   c: 3, r: 1 },
      { rid: 402, zh: "厨房",     c: 4, r: 1 },
      { rid: 105, zh: "客厅",     c: 1, r: 2 },
      { rid: 104, zh: "图书馆",   c: 2, r: 2 },
      { rid: 404, zh: "温室",     c: 3, r: 2, cw: 2 },
      { rid: 502, zh: "仆役区",   c: 1, r: 3 },
      { rid: 501, zh: "花园小屋", c: 3, r: 3, cw: 2 }
    ]
  },
  "-1": {
    name: "地下 · 酒窖层", cols: 3,
    desc: "恒温 13 度。深夜正常没人下来。",
    rooms: [
      { rid: 401, zh: "酒窖", c: 2, r: 1 }
    ]
  }
};

function caseFileMapHTML() {
  // CCTV status straight from the DB so the map stays accurate.
  const cctv = {};
  try {
    const res = BMM2.db.exec("SELECT RoomID, HasCCTV FROM Rooms");
    for (const [rid, has] of (res[0] ? res[0].values : [])) cctv[rid] = has;
  } catch (e) { /* fall back to no-cctv */ }

  let html = `<p class="cf-intro">黑木庄园平面图。<b style="color:var(--accent-blood-2)">红色</b>标出案发现场及与它相邻的房间。
    🎥 = 该房间装有监控，🚫 = 监控盲区。后面几章查门禁、查走廊时，对照这张图看会清楚很多。</p>`;

  for (const fk of ["3", "2", "1", "-1"]) {
    const fl = MANOR_FLOORPLAN[fk];
    if (!fl) continue;
    html += `<div class="cf-floor">
      <div class="cf-floor-name">${esc(fl.name)}</div>
      <div class="cf-floor-desc">${esc(fl.desc)}</div>
      <div class="cf-plan" style="grid-template-columns: repeat(${fl.cols}, 1fr);">`;
    for (const room of fl.rooms) {
      const cw = room.cw || 1, rw = room.rw || 1;
      const hasCctv = cctv[room.rid];
      const cls = ["cf-cell"];
      if (room.kind === "corridor") cls.push("is-corridor");
      else if (room.kind === "door") cls.push("is-door");
      if (room.crime) cls.push("is-crime");
      const meta = room.kind === "corridor" ? "走廊"
        : room.kind === "door" ? "🚫 监控盲区"
        : (hasCctv ? "🎥 有监控" : "🚫 监控盲区");
      html += `<div class="${cls.join(" ")}"
        style="grid-column:${room.c} / span ${cw}; grid-row:${room.r} / span ${rw};">
        <div class="cf-cell-id">#${room.rid}</div>
        <div class="cf-cell-name">${esc(room.zh)}</div>
        <div class="cf-cell-meta">${meta}</div>
      </div>`;
    }
    html += `</div></div>`;
  }
  return html;
}

function caseFileProgressHTML() {
  let html = `<p class="cf-intro">每完成一章，这里就记下你<b>已经查实了什么</b>。读不下去时回这里回顾。</p>`;
  let any = false;
  for (let ch = 1; ch <= 11; ch++) {
    if (chapterComplete(ch)) {
      any = true;
      html += `
        <div class="cf-recap done">
          <div class="cf-recap-ch">✓ 第 ${ch} 章</div>
          <div class="cf-recap-text">${esc(CHAPTER_RECAP[ch] || "")}</div>
        </div>`;
    }
  }
  const cur = currentTask();
  if (cur) {
    html += `
      <div class="cf-recap current">
        <div class="cf-recap-ch">▸ 第 ${cur.chapter} 章 · 进行中</div>
        <div class="cf-recap-text">当前任务：<b>${esc(cur.title)}</b><br/>${esc(cur.task || "")}</div>
      </div>`;
  }
  if (!any && !cur) html += `<p class="cf-intro">调查尚未开始。</p>`;
  return html;
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
  { pid: 2, name: "薇薇安·阿什福德",   role: "前妻 · 庄园主人" },
  { pid: 3, name: "索菲娅·布莱克伍德", role: "现任妻子 · 前编辑" },
  { pid: 4, name: "马库斯·索恩",       role: "文学经纪人 · 合作 22 年" },
  { pid: 5, name: "艾莉丝·陈",         role: "2023 黑木奖得主" },
  { pid: 6, name: "朱利安·哈特利",     role: "作家 · 宿敌" },
  { pid: 7, name: "埃莉诺·赖特",       role: "授权传记作者" },
  { pid: 8, name: "亨里克·沃尔科夫",   role: "文学评论家" }
];
const MARK_LABEL = {
  unknown: "待查", suspect: "怀疑", cleared: "已排除", prime: "重点嫌疑"
};

function renderDashboard() {
  renderSuspectStrip();
  renderProgressGlance();
}

// Chapter-by-chapter recap. Each line is "what the player has established"
// after finishing that chapter — shown only for COMPLETED chapters so it
// never spoils ahead. Used by the dashboard glance and the 案件资料 panel.
const CHAPTER_RECAP = {
  1:  "确认昨晚有 7 名 Guest 在庄园过夜——这就是嫌疑池。",
  2:  "法医把死亡时间锁定在 00:30–01:30。这一小时里，只有 埃莉诺·赖特 的门卡进出了书房。",
  3:  "短信筛出三条动机：马库斯 怕破产、薇薇安 怕失去庄园、埃莉诺 提到「日记本」「最后的篇章」。",
  4:  "薇薇安 案发时段下酒窖取了一瓶 Pétrus——实为取回藏在酒窖的合同草稿。她有动机，但全程在酒窖与卧室，排除。",
  5:  "借阅记录显示 埃莉诺 借的全是 玛格丽特 的手稿、领养档案、抄袭法律书——这不是传记研究，是案件准备。",
  6:  "马库斯 的 WiFi 整晚锁在自己房间，排除。埃莉诺 的手机在 00:28–01:35 有 67 分钟空窗，整个死亡窗口不在任何 AP 上。",
  7:  "管家偷听到：埃莉诺 约 伊莱亚斯「今夜，档案室」；伊莱亚斯 当面对她说「名字刻在牌子上不等于家人」。",
  8:  "书房、档案室、连接走廊都没有监控。死亡窗口的门禁显示只有 埃莉诺 的卡碰过书房，其余六人都有不在场证明。",
  9:  "封存的领养记录浮出：埃莉诺 是 玛格丽特 的私生女，是 伊莱亚斯 的外甥女——她当了三年他的传记作者。",
  10: "写作日志暴露 伊莱亚斯 两面：第七章写要认错，GalaSpeech 终稿却要当众反口。物证：书挡掌纹比中 埃莉诺，死亡时间收窄到 00:50–01:05。",
  11: "八列证据链完成——动机、机会、手段齐全。埃莉诺·赖特 被捕。"
};

// True only when EVERY task of a chapter is completed.
function chapterComplete(ch) {
  const tasks = window.BMM2_TASKS.filter(t => t.chapter === ch);
  return tasks.length > 0 && tasks.every(t => taskDone(t.id));
}

// Dashboard glance — always-visible running recap. Shows a ✓ line for each
// finished chapter and a ▸ line for the chapter in progress, so the player
// can always see "what have I established / where am I".
function renderProgressGlance() {
  const host = document.getElementById("case-progress-glance");
  if (!host) return;
  const cur = currentTask();
  const curCh = cur ? cur.chapter : 12;
  let html = "";
  for (let ch = 1; ch <= 11; ch++) {
    if (chapterComplete(ch)) {
      html += `<div class="cp-line done"><span class="cp-mark">✓</span>
        <span class="cp-ch">第 ${ch} 章</span>
        <span class="cp-text">${esc(CHAPTER_RECAP[ch] || "")}</span></div>`;
    } else if (ch === curCh) {
      html += `<div class="cp-line current"><span class="cp-mark">▸</span>
        <span class="cp-ch">第 ${ch} 章</span>
        <span class="cp-text">进行中：${esc(cur ? cur.title : "")}</span></div>`;
    }
  }
  if (!html) {
    html = `<div class="cp-line current"><span class="cp-mark">▸</span>
      <span class="cp-text">调查刚刚开始。完成一关后，这里会记下你查到了什么。</span></div>`;
  }
  host.innerHTML = html;
  // Newest (current) line scrolled into view.
  const curLine = host.querySelector(".cp-line.current");
  if (curLine) curLine.scrollIntoView({ block: "nearest" });
  const sub = document.getElementById("dash-progress-sub");
  if (sub) {
    const done = [1,2,3,4,5,6,7,8,9,10,11].filter(chapterComplete).length;
    sub.textContent = `已完成 ${done} / 11 章 · 顶栏「📂 案件资料」看完整回顾`;
  }
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
// TASK CARD + 布伦南
// ============================================================
function refreshTaskCard() {
  const card = document.getElementById("task-card");
  // The workspace may not be mounted yet — e.g. an opening-prologue
  // cutscene closing calls this before the task card exists. Bail safely.
  if (!card) return;
  const t = currentTask();
  if (!t) {
    card.style.display = "none";
    return;
  }
  card.style.display = "block";
  card.classList.remove("minimized");
  // Chapter / progress line.
  const chEl = document.getElementById("task-chapter");
  if (chEl) {
    chEl.textContent = t.chapter === 0
      ? "教程 · 热身"
      : `第 ${t.chapter} 章 / 共 11 章`;
  }
  document.getElementById("task-title").textContent = t.title;
  // Plain-language brief — 做什么 / 为什么 — for weak-comprehension players.
  const brief = window.BMM2_BRIEF && window.BMM2_BRIEF[t.id];
  const briefEl = document.getElementById("task-brief");
  if (briefEl) {
    if (brief) {
      briefEl.innerHTML =
        `<div class="tb-row"><div class="tb-label">🎯 这一步要做什么</div>` +
        `<div class="tb-text">${esc(brief.goal)}</div></div>` +
        `<div class="tb-row"><div class="tb-label">❓ 为什么要查它</div>` +
        `<div class="tb-text">${esc(brief.why)}</div></div>`;
      briefEl.style.display = "block";
    } else {
      briefEl.style.display = "none";
    }
  }
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
  document.getElementById("task-skip-story").onclick = () => skipTaskForStory();
}

// ============================================================
// Story-first skip — this game leads with NARRATIVE; the SQL is
// optional. Any task can be skipped: the canonical query is run for
// the player (so they still see the real data + clues), and the story
// continues exactly as if they had solved it. No score is awarded for
// a skip, but the full story — 布伦南's reaction, rituals, cutscenes
// — plays out, so a player who writes zero SQL still reads the whole
// murder mystery start to finish.
// ============================================================
function skipTaskForStory() {
  if (BMM2.awaitingContinue) return;          // a continue-gate is up
  const t = currentTask();
  if (!t) return;
  // Run the canonical answer so the player sees what the query reveals.
  const ans = window.BMM2_ANSWERS && window.BMM2_ANSWERS[t.id];
  if (ans && BMM2.db) {
    try {
      const safe = window.BMM2_filterQuery
        ? window.BMM2_filterQuery(ans, BMM2.state) : ans;
      const results = BMM2.db.exec(safe);
      const last = results[results.length - 1];
      if (last && last.values && last.values.length) {
        showResultPanel(last.columns, last.values);
        showResultGain(t.id);
        addClues(last.columns, last.values);
      }
    } catch (e) { /* canonical failed — story still continues */ }
  }
  completeCurrentTask(t, ans || "(skipped)", { skipped: true });
}

async function speakCurrentIntro() {
  const t = currentTask();
  if (!t) return;
  // Make sure the task card shows THIS task before anything else — the
  // card must never lag a chapter behind during the cutscene/intro chain.
  refreshTaskCard();
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
  // Re-assert after the cutscene closes (the scene veil can leave the
  // card visually stale on some timing paths).
  refreshTaskCard();
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
// Dialogue log: stack of past 布伦南 utterances visible above the
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
      <span class="log-card-name">布伦南 督察</span>
    </div>
    <div class="log-card-body"></div>
  `;
  // Copy markup (keeps **bold** + .person-ref hover spans); fall back to text.
  const bodyEl = card.querySelector(".log-card-body");
  const snap = speech.cloneNode(true);
  snap.querySelectorAll(".caret").forEach(c => c.remove());
  bodyEl.innerHTML = snap.innerHTML || txt;
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
// DIFFICULTY — the player picks a level; it controls how much SQL is
// pre-loaded into the editor for each task:
//   easy   → the full correct query (read it, run it, learn by example)
//   medium → the scaffold with ___ blanks to fill (default)
//   hard   → just the task comment; write the whole query yourself
// ============================================================
const DIFFICULTY_LABEL = { easy: "简单", medium: "普通", hard: "困难" };

function starterFor(task) {
  if (!task) return "";
  const diff = BMM2.state.difficulty || "medium";
  if (diff === "easy") {
    const ans = window.BMM2_ANSWERS && window.BMM2_ANSWERS[task.id];
    if (ans) {
      // Plain-Chinese explanation of what the preloaded query does, so an
      // Easy-mode player isn't just clicking Run on a black box.
      const brief = window.BMM2_BRIEF && window.BMM2_BRIEF[task.id];
      const goalLine = brief && brief.goal
        ? `-- 这条 SQL 在做的事：${brief.goal}\n` : "";
      return `-- 简单模式 · 完整 SQL 已为你写好。\n`
           + goalLine
           + `-- 读一遍，然后点 ▶ Run。想挑战可自己改写。\n\n${ans};`;
    }
    return task.starter || "";
  }
  if (diff === "hard") {
    // Keep only the leading -- comment lines from the medium scaffold.
    const lines = (task.starter || "").split("\n");
    const comments = [];
    for (const l of lines) {
      if (l.trim().startsWith("--")) comments.push(l);
      else if (comments.length) break;   // stop at the first SQL line
    }
    const head = comments.length ? comments.join("\n") : `-- ${task.task || ""}`;
    return `${head}\n-- 困难模式 · 完整的 SQL 由你独立写出。\n\n`;
  }
  return task.starter || "";   // medium — the ___ scaffold
}

// Reload the editor with the current task's scaffold for the active
// difficulty (called after the player picks / changes difficulty).
function reloadCurrentStarter() {
  const ed = document.getElementById("sql-editor");
  const t = currentTask();
  if (!ed || !t) return;
  delete BMM2.state.queries[t.id];
  ed.value = starterFor(t);
  save();
}

// First-run difficulty picker. Resolves via onDone callback once chosen.
function chooseDifficulty(onDone) {
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  if (!veil || !m) { if (onDone) onDone(); return; }
  m.className = "modal difficulty-modal";
  m.innerHTML = `
    <header><h2 style="font-family:var(--font-serif); font-size:17px; letter-spacing:0.12em;">选择难度</h2></header>
    <div class="modal-body">
      <p class="cf-intro">这桩案子要靠 SQL 查出来。难度决定每道题在编辑器里<b>预先帮你写好多少代码</b>——随时能在 ⚙ 设置里改。</p>
      <div class="diff-options">
        <button class="diff-opt" data-d="easy">
          <div class="diff-name">简单</div>
          <div class="diff-desc">完整的 SQL 已经写好，你读懂它、点运行即可。适合刚接触 SQL 的同学。</div>
        </button>
        <button class="diff-opt recommended" data-d="medium">
          <div class="diff-name">普通 <span class="diff-rec">推荐</span></div>
          <div class="diff-desc">给出 SQL 框架，关键处留 <code>___</code> 空格由你填写。适合学过基础语法的同学。</div>
        </button>
        <button class="diff-opt" data-d="hard">
          <div class="diff-name">困难</div>
          <div class="diff-desc">只给题目要求，完整 SQL 由你从零独立写出。留给学有余力的同学。</div>
        </button>
      </div>
    </div>
  `;
  veil.classList.add("open");
  m.querySelectorAll(".diff-opt").forEach(b => {
    b.addEventListener("click", () => {
      BMM2.state.difficulty = b.dataset.d;
      save();
      closeModal();
      if (onDone) onDone();
    });
  });
}

// ============================================================
// SQL TERMINAL
// ============================================================
function bindTerminal() {
  const ed = document.getElementById("sql-editor");
  // Load starter
  const t = currentTask();
  if (t && !BMM2.state.queries[t.id]) ed.value = starterFor(t);
  else ed.value = BMM2.state.queries[t?.id] || starterFor(t);

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
    const tt = currentTask(); if (tt) ed.value = starterFor(tt);
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
  // Pacing gate is up — the player must click 继续调查 first. Guards the
  // Ctrl/Cmd+Enter shortcut path (the Run button is already disabled).
  if (BMM2.awaitingContinue) {
    showToast("先点右侧「继续调查 →」。", "warn");
    return;
  }
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
    // Plain-language "你查到了什么" note on the result panel.
    showResultGain(t.id);
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
  // The onboarding Promise MUST resolve no matter how the popover closes.
  // The shared #modal-veil carries a stale "click-background-to-close"
  // handler left by earlier modals (openCaseFile / openSuspectModal): a
  // background click closes this popover via closeModal() WITHOUT firing the
  // 继续 button — without this failsafe the game soft-locks at Ch0→Ch1
  // because completeCurrentTask hangs forever at `await showTutorialPopoverAsync()`.
  let done = false;
  let obs = null;
  function finish() {
    if (done) return;
    done = true;
    if (obs) obs.disconnect();
    closeModal();
    if (onContinue) onContinue();
  }
  m.className = "modal";
  m.style.maxWidth = "520px";
  m.innerHTML = `
    <header>
      <h2 style="font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.12em;">
        欢迎进入调查台 · ONBOARDING
      </h2>
    </header>
    <div class="modal-body" style="font-family: var(--font-serif); line-height: 1.7; font-size: 15px; color: var(--text-primary);">
      <p><b style="color:var(--accent-gold)">这首先是一个故事。</b>一桩发生在黑木庄园的谋杀案，你会跟着 布伦南 一章章把它读完。</p>
      <p>每一关有一道 SQL 小题——写对了，你就亲手查到了那条线索。<b style="color:var(--accent-gold)">但写不出来完全不要紧</b>：任务卡上永远有一个「⏭ 跳过此题 · 继续故事」按钮，点它就直接看到数据、听 布伦南 讲这一段，故事照样往下走。<b style="color:var(--accent-gold)">不写一行 SQL，也能读完整个完整的故事。</b></p>
      <p>看不懂外国人名、忘了有哪些表、想不起前面发生了什么？顶栏的 <b style="color:var(--accent-gold)">📂 案件资料</b> 里有：人物表、数据表、庄园地图、案情进展回顾——随时可查。</p>
      <p>跑过的查询结果会归档到左侧<b style="color:var(--accent-gold)">线索栏</b>；中央<b style="color:var(--accent-gold)">案件概览</b>显示嫌疑人和进展；点嫌疑人卡片可看完整档案。</p>
      <p style="color: var(--text-secondary); font-style: italic; margin-top: 18px;">
        布伦南：「慢慢来。重要的不是你查得多快——是你最后看懂了这个故事。」
      </p>
      <div style="text-align: center; margin-top: 22px;">
        <button id="btn-tutorial-continue" style="background: var(--accent-gold); color: var(--bg-deepest); border: none; padding: 10px 32px; cursor: pointer; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em;">继续 →</button>
      </div>
    </div>
  `;
  veil.classList.add("open");
  document.getElementById("btn-tutorial-continue").addEventListener("click", finish);
  // Failsafe: if the veil is dismissed by ANY other path, still resolve.
  obs = new MutationObserver(() => {
    if (!veil.classList.contains("open")) finish();
  });
  obs.observe(veil, { attributes: true, attributeFilter: ["class"] });
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
  // A fresh query — clear any previous "你查到了" gain note; it's only
  // re-shown if this query actually completes the task.
  const gainEl = document.getElementById("result-gain");
  if (gainEl) { gainEl.style.display = "none"; gainEl.textContent = ""; }
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

// Show the plain-language "你查到了什么" note on the result panel — called
// when a task is completed (solved or skipped) so a weak-comprehension
// player gets told, in one sentence, what this step achieved.
function showResultGain(taskId) {
  const gainEl = document.getElementById("result-gain");
  const brief = window.BMM2_BRIEF && window.BMM2_BRIEF[taskId];
  if (!gainEl || !brief || !brief.gain) return;
  gainEl.innerHTML = `<span class="rg-tag">📌 你查到了</span>${esc(brief.gain)}`;
  gainEl.style.display = "block";
}

// Helper: have 布伦南 say a short reaction line.
// Wraps the proper (el, text, opts) signature; guarded against the
// active intro/outro typewriter so we don't overlap the main task speech.
function brennanReact(text) {
  if (!window.BMM2_brennan || !window.BMM2_brennan.fadeAndType) return;
  if (BMM2.brennanDialogActive) return; // skip if main beat in progress
  const speech = document.getElementById("brennan-speech");
  if (!speech) return;
  window.BMM2_brennan.fadeAndType(speech, text, { speed: 24 });
}

async function completeCurrentTask(t, sql, opts) {
  opts = opts || {};
  const skipped = !!opts.skipped;
  if (!taskDone(t.id)) {
    BMM2.state.completedTasks.push(t.id);
    // Skipping (story-first) earns no score — the score rewards SQL effort,
    // the story is delivered to everyone regardless.
    if (!skipped) addScore(t.rewards?.score || 10);
  }
  BMM2.state.currentTaskIdx++;
  BMM2.state.queries[t.id] = sql;
  save();

  if (skipped) {
    showToast(`本节已跳过 · 故事继续`, "warn");
  } else {
    showToast(`✓ 任务 ${t.id} 完成 · +${t.rewards?.score || 10} 探案分`, "ok");
    bumpScore();
  }
  refreshTopbar();

  // Gate A — let the player actually LOOK at the query result before
  // 布伦南's analysis writes itself out in the right rail.
  await waitForContinue(skipped
    ? "看完下方数据，听 布伦南 讲这一段 →"
    : "查询正确 ✓ 看完下方结果，听 布伦南 分析 →");

  // 布伦南 reacts + Gate B. The outro types AND the 继续 gate appears at
  // the same time — clicking the gate fast-forwards the typewriter, so the
  // player never has to hunt for a separate "skip animation" button.
  if (t.id === "0.1" && !BMM2.state.tutorialShown) {
    await speakOutro(t);
    BMM2.state.tutorialShown = true;
    save();
    await showTutorialPopoverAsync();
  } else {
    const outroDone = speakOutro(t);
    await waitForContinue("继续调查 →");
    if (window.BMM2_brennan && window.BMM2_brennan.skip) {
      window.BMM2_brennan.skip();   // jump any still-running typewriter to the end
    }
    await outroDone;
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

  // Advance to next task. No setTimeout — the 继续调查 gate above already
  // gave the player a deliberate pause; chain straight into the next beat.
  renderDashboard();   // refresh the 案情进展 glance now this chapter may be done
  if (isComplete()) {
    refreshTopbar();
    // Case closed — guarantee the final report opens, even if the Ch11
    // stamp ritual was interrupted or a finale cutscene veil covered it.
    if (window.BMM2_chapters && window.BMM2_chapters.openCaseReport) {
      window.BMM2_chapters.openCaseReport();
    }
  } else {
    refreshTaskCard();
    const nextT = currentTask();
    const ed = document.getElementById("sql-editor");
    // Always load the next task's scaffold FRESH. Tasks advance strictly
    // forward, so the next task has not been attempted — any queries[]
    // entry for it would be a mis-attributed save (e.g. a stray keystroke
    // landed while currentTaskIdx had already advanced) and must not be
    // allowed to block the reload, or the editor keeps the prior query.
    if (ed && nextT) {
      delete BMM2.state.queries[nextT.id];
      ed.value = starterFor(nextT);
      save();
    }
    speakCurrentIntro();
  }
}

// ============================================================
// Pacing gate — shows a "继续调查 →" button and resolves only when the
// player clicks it (or presses Enter). While it is up, the Run button is
// disabled so a stray query can't grade against the next task. This is
// what stops the game auto-racing through outro → cutscene → next intro.
// ============================================================
function waitForContinue(label) {
  return new Promise(resolve => {
    // A FIXED-position bar — never buried in the scrollable right rail.
    // (Playtest: a weak player got soft-locked when the gate button was
    // clipped out of view AND the skip button was disabled by the gate.)
    document.querySelectorAll(".continue-gate-bar").forEach(el => el.remove());

    const runBtn = document.getElementById("btn-run");
    const skipBtn = document.getElementById("task-skip-story");
    if (runBtn) runBtn.disabled = true;
    if (skipBtn) skipBtn.disabled = true;   // a gate is up — skip is moot
    BMM2.awaitingContinue = true;

    const bar = document.createElement("div");
    bar.className = "continue-gate-bar";
    const btn = document.createElement("button");
    btn.className = "continue-gate";
    btn.textContent = label || "继续调查 →";
    bar.appendChild(btn);

    // Keep the gate ABOVE the result panel so it never covers query rows.
    // When no result panel is open, fall back to the CSS default (just
    // above the terminal).
    function placeGate() {
      const rp = document.getElementById("result-panel");
      if (rp && rp.classList.contains("open")) {
        const top = rp.getBoundingClientRect().top;
        bar.style.bottom = Math.round(window.innerHeight - top + 12) + "px";
      } else {
        bar.style.bottom = "";
      }
    }

    function finish() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeGate);
      BMM2.awaitingContinue = false;
      if (runBtn) runBtn.disabled = false;
      if (skipBtn) skipBtn.disabled = false;
      bar.remove();
      resolve();
    }
    function onKey(e) {
      if (e.key === "Enter" &&
          document.activeElement &&
          document.activeElement.id !== "sql-editor" &&
          document.activeElement.id !== "notes-area") {
        e.preventDefault();
        finish();
      }
    }
    btn.addEventListener("click", finish, { once: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeGate);
    document.body.appendChild(bar);
    placeGate();
    setTimeout(placeGate, 360);   // re-measure after the panel's slide-in
  });
}

function addScore(delta) {
  BMM2.state.score = Math.max(0, (BMM2.state.score || 0) + delta);
  save();
  refreshTopbar();
}

// ============================================================
// RIGHT RAIL — dialogue history
// ============================================================
function bindRightRail() {
  const hist = document.getElementById("btn-dialogue-history");
  if (hist) hist.addEventListener("click", openDialogueHistory);
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
    <header><h2 style="margin:0; font-family:var(--font-serif); font-size:18px; letter-spacing:0.14em;">布伦南 对话历史</h2><span class="close">×</span></header>
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

// ============================================================
// Person hover card — floating mini-dossier shown when the player
// hovers a Chinese name (.person-ref span) inside 布伦南's dialogue.
// Clicking the name opens the full dossier.
// ============================================================
let _personHoverCardEl = null;
function initPersonHoverCard() {
  if (_personHoverCardEl) return;
  const card = document.createElement("div");
  card.className = "person-hover-card";
  card.style.display = "none";
  document.body.appendChild(card);
  _personHoverCardEl = card;

  function place(ref) {
    const r = ref.getBoundingClientRect();
    const cw = card.offsetWidth || 280;
    const chh = card.offsetHeight || 110;
    let left = r.left + r.width / 2 - cw / 2;
    let top = r.top - chh - 10;
    if (top < 8) top = r.bottom + 10;   // flip below if no room above
    left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
    card.style.left = left + "px";
    card.style.top = top + "px";
  }
  function show(ref) {
    const pid = parseInt(ref.getAttribute("data-pid"), 10);
    const p = CASEFILE_BY_PID[pid];
    if (!p) return;
    const photo = window.BMM_photoPath ? window.BMM_photoPath(pid) : null;
    const photoEl = photo
      ? `<img src="${photo}" alt="" loading="lazy" decoding="async"/>`
      : `<div class="phc-ph">${esc(p.en.charAt(0))}</div>`;
    card.innerHTML = `
      <div class="phc-photo">${photoEl}</div>
      <div class="phc-body">
        <div class="phc-zh">${esc(p.zh)}</div>
        <div class="phc-role">${esc(p.role || "")}</div>
        <div class="phc-hook">${esc(p.hook || "")}</div>
      </div>`;
    card.style.display = "flex";
    place(ref);
  }
  function hide() { card.style.display = "none"; }

  // One delegated handler: mouseover fires for every element the cursor
  // enters. Over a name → show; over anything else → hide. This dismisses
  // the card reliably the instant the mouse leaves a name (the old
  // separate mouseout handler could leave the card stuck).
  document.addEventListener("mouseover", e => {
    const ref = e.target.closest && e.target.closest(".person-ref");
    if (ref) show(ref);
    else hide();
  });
  document.addEventListener("click", e => {
    const ref = e.target.closest && e.target.closest(".person-ref");
    if (ref) {
      const pid = parseInt(ref.getAttribute("data-pid"), 10);
      if (pid) { hide(); openSuspectModal(pid); }
    }
  });
}

function openSuspectModal(pid, fromCaseFile) {
  const row = runRows(`SELECT FullName, Age, Occupation, RelationToElias, RoomID, BirthYear, DeathYear, Notes FROM Persons WHERE PersonID=${pid}`)[0];
  if (!row) return;
  const [name, age, occ, rel, roomId, birth, death, notes] = row;
  const veil = document.getElementById("modal-veil");
  const m = document.getElementById("modal-content");
  const photo = window.BMM_photoPath ? window.BMM_photoPath(pid) : null;
  const mark = (BMM2.state.marks || {})["person_" + pid] || "unknown";
  const ch7 = chDone(7);
  // Rich Chinese biography + a short header tagline.
  const cast = CASEFILE_BY_PID[pid];
  const bioText = PERSON_BIO[pid] || notes || "";
  const bioHTML = bioText.split(/\n+/).map(s => s.trim()).filter(Boolean)
    .map(s => `<p>${esc(s)}</p>`).join("");
  const tagline = (cast && cast.zh ? cast.zh + " · " : "") + (cast && cast.role ? cast.role : "");
  // When opened from the Case File, "×" should return there, not the desk.
  const back = fromCaseFile ? () => openCaseFile("cast") : closeModal;

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
        <div class="desc">${esc(tagline || notes || "")}</div>
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
      ${bioHTML ? `
        <div class="section-title">人物背景</div>
        <div class="suspect-bio">${bioHTML}</div>
      ` : ""}
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
  m.querySelector(".close").addEventListener("click", back);
  veil.addEventListener("click", e => { if (e.target === veil) back(); });
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
      <p>伊莱亚斯·布莱克伍德，67 岁，三度 布克 提名作家。<b>周日 (10/20) 08:30</b> 被秘书发现死于自己的书房（书房）。钝器击打头部，凶器：书桌上的青铜书挡。</p>
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
        布伦南：「数据胜过直觉。你的工具就在这里。开始吧。」
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
      <p style="color: var(--accent-gold); letter-spacing:0.1em;">SQL 难度（决定编辑器预加载多少代码）</p>
      <div class="settings-diff" style="display:flex; gap:6px; margin:6px 0 4px;">
        ${["easy","medium","hard"].map(d =>
          `<button class="set-diff ${ (BMM2.state.difficulty||"medium")===d ? "active":"" }" data-d="${d}">${DIFFICULTY_LABEL[d]}</button>`
        ).join("")}
      </div>
      <p style="color: var(--text-muted); font-size:10px; line-height:1.6;">简单=完整答案 · 普通=填空框架 · 困难=只给题目。切换后当前题的编辑器会重新加载。</p>
      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 16px 0;"/>
      <div style="display:flex; gap: 10px; flex-wrap: wrap;">
        <button id="btn-reset-game" style="background: var(--accent-blood); color: var(--text-primary); border: 1px solid var(--accent-blood); padding: 8px 16px; cursor: pointer; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em;">重新开始游戏</button>
        <button id="btn-show-report" ${isComplete()?"":"disabled"} style="background: transparent; color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 8px 16px; cursor: ${isComplete()?"pointer":"not-allowed"}; font-family: var(--font-mono); font-size: 11px; opacity: ${isComplete()?"1":"0.5"};">查看结案报告</button>
      </div>
    </div>
  `;
  veil.classList.add("open");
  m.querySelector(".close").addEventListener("click", closeModal);
  m.querySelectorAll(".set-diff").forEach(b => {
    b.addEventListener("click", () => {
      BMM2.state.difficulty = b.dataset.d;
      save();
      reloadCurrentStarter();
      m.querySelectorAll(".set-diff").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      showToast(`难度已切换为「${DIFFICULTY_LABEL[b.dataset.d]}」`, "ok");
    });
  });
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
