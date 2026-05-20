// ============================================================
// Blackwood Manor — main application
// Boots sql.js, manages progress, renders all sections.
// ============================================================

const BMM = {
  db: null,
  state: loadState(),
  rituals: new Set(),       // chapters that have already played their ritual
  currentTab: 1,
  tabQueries: {},           // chId -> last text typed
  noteText: ""
};
window.BMM = BMM;

// ----------- localStorage ------------------------------------
const LS_KEY = "bm_state_v1";
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { progress: {}, marks: {}, notes: "" };
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(BMM.state)); } catch (e) {}
}
function isUnlocked(chId) {
  return !!(BMM.state.progress[chId] && BMM.state.progress[chId].unlocked);
}
function highestUnlocked() {
  let max = 0;
  for (let i = 1; i <= 11; i++) if (isUnlocked(i)) max = i;
  return max;
}

// ----------- Boot sql.js -------------------------------------
async function boot() {
  setStatus("正在初始化数据库...");
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
  });
  BMM.db = new SQL.Database();
  BMM.db.exec(window.BMM_SQL);
  setStatus("");

  renderAll();
  bindGlobalHandlers();
  document.getElementById("loading").remove();

  // Replay UI for chapters already unlocked, without ritual.
  for (let i = 1; i <= 11; i++) {
    if (isUnlocked(i)) BMM.rituals.add(i);
  }
  applyUnlocks(false);
}

function setStatus(msg) {
  const el = document.getElementById("loading");
  if (el) el.querySelector(".msg").textContent = msg;
}

// ============================================================
// Top-level renderers
// ============================================================
function renderAll() {
  renderSidebar();
  renderWhiteboard();
  renderSuspects();
  renderFloorplan();
  renderTimeline();
  renderSandbox();
  renderFamilyTree();
  renderEvidenceCab();
  renderCCTVMatrix();
  renderConvos();
  renderCaseClosed();
  renderTopbarClosed();
}

// ============================================================
// Section: Sidebar
// ============================================================
function renderSidebar() {
  const ul = document.getElementById("ch-list");
  ul.innerHTML = "";
  for (const c of window.BMM_META.chapters) {
    const li = document.createElement("li");
    li.className = "ch-item" + (isUnlocked(c.id) ? " unlocked" : "");
    li.title = `Ch ${c.id}: ${c.concept}`;
    li.innerHTML = `
      <span class="dot">${isUnlocked(c.id) ? "✓" : c.id}</span>
      <div>
        <div class="ch-num">CH ${String(c.id).padStart(2,"0")}</div>
        <div class="ch-concept">${esc(c.concept)}</div>
      </div>`;
    li.addEventListener("click", () => {
      BMM.currentTab = c.id; renderSandbox();
      document.getElementById("section-sql").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ul.appendChild(li);
  }
  const summary = document.getElementById("progress-summary");
  summary.innerHTML = `<span class="num">${highestUnlocked()}</span> / 11 已解锁`;
}

// ============================================================
// Section: Whiteboard
// ============================================================
function renderWhiteboard() {
  const wb = document.getElementById("wb-body");
  const cards = [];
  for (let i = 11; i >= 1; i--) {
    if (isUnlocked(i)) cards.push(wbCard(i));
  }
  wb.innerHTML = cards.length
    ? cards.join("")
    : `<div class="wb-empty">空板待书 · 跑通第一章查询即获首条线索。</div>`;
  document.getElementById("wb-progress").textContent = `进度 [ ${highestUnlocked()} / 11 章 ]`;
  // Click → jump to sandbox at that chapter
  wb.querySelectorAll(".wb-card").forEach(el => {
    el.querySelector(".wb-link")?.addEventListener("click", () => {
      const ch = parseInt(el.dataset.ch, 10);
      BMM.currentTab = ch; renderSandbox();
      document.getElementById("section-sql").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
function wbCard(ch) {
  const cls = (ch === 9 ? " ch9" : ch === 11 ? " ch11" : "");
  return `<div class="wb-card${cls}" data-ch="${ch}">
    <span class="wb-badge">CH ${String(ch).padStart(2,"0")}</span>
    <div class="wb-body-txt">${esc(window.BMM_META.whiteboard[ch])}</div>
    <a class="wb-link">→ 查看 SQL 证据</a>
  </div>`;
}

// ============================================================
// Section: Suspect grid
// ============================================================
function renderSuspects() {
  const wrap = document.getElementById("suspect-grid");
  const unlockedCh1 = isUnlocked(1);
  if (!unlockedCh1) {
    wrap.innerHTML = lockedPanel(1, "完成第 1 章查询以解锁嫌疑人名册");
    return;
  }

  const guests = runRows(`SELECT PersonID, FullName, Age, Occupation, RelationToElias, RoomID FROM Persons WHERE PersonType='Guest' ORDER BY PersonID`);
  const rooms  = Object.fromEntries(runRows(`SELECT RoomID, Name FROM Rooms`).map(r => [r[0], r[1]]));

  const html = guests.map((g, i) => suspectCard({
    pid: g[0], name: g[1], age: g[2], occ: g[3], rel: g[4], room: g[5], roomName: rooms[g[5]]
  }, i)).join("");
  wrap.innerHTML = `<div class="suspect-grid-inner" style="display:grid; gap:14px; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));">${html}</div>`;

  // Wire up
  wrap.querySelectorAll(".suspect-card").forEach(card => {
    const pid = parseInt(card.dataset.pid, 10);
    card.querySelector(".ev-toggle")?.addEventListener("click", () => {
      card.classList.toggle("evidence-open");
    });
    card.querySelectorAll(".sus-mark button").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = btn.dataset.mark;
        BMM.state.marks[`person_${pid}`] = v;
        saveState();
        renderSuspects();
      });
    });
  });
}

function suspectCard(g, idx) {
  const mark = BMM.state.marks[`person_${g.pid}`] || "unknown";
  const markCls = (mark === "suspect") ? "mark-suspect"
                 : (mark === "cleared") ? "mark-cleared" : "";
  // Eleanor (pid=7) gets the "evidence in position" pip after Ch 6 unlocks
  const evFlag = (g.pid === 7 && isUnlocked(6)) ? "has-evidence-flag" : "";
  const pno = "P-" + String(g.pid).padStart(3, "0");
  const avatar = (typeof window.BMM_avatarSvg === "function")
    ? `<div class="sus-avatar" data-pno="${pno}">${window.BMM_avatarSvg(g.pid)}</div>`
    : `<div class="sus-avatar initials-only">${esc(g.name.split(" ").map(p=>p[0]).join("").slice(0,2))}</div>`;
  return `<div class="suspect-card ${markCls} ${evFlag}" data-pid="${g.pid}" style="animation-delay:${idx*80}ms">
    <div class="sus-head">
      ${avatar}
      <div>
        <h4 class="sus-name">${esc(g.name)}</h4>
        <div class="sus-meta">${g.age ?? "?"} 岁 · ${esc(g.occ ?? "—")}</div>
      </div>
    </div>
    <div class="sus-public">
      <div><b>与 Elias 关系</b> · ${esc(g.rel ?? "—")}</div>
      <div><b>所住房间</b> · <span class="room">#${g.room ?? "—"} ${esc(g.roomName ?? "")}</span></div>
    </div>
    <button class="ev-toggle">查看证据 / Show Evidence <span>＋</span></button>
    <div class="ev-section">
      ${evidenceGroup("当晚刷卡记录", 2, () => evKeycard(g.pid))}
      ${evidenceGroup("通讯记录", 3, () => evPhone(g.pid))}
      ${evidenceGroup("酒窖取酒", 4, () => evWine(g.pid))}
      ${evidenceGroup("图书馆借阅", 5, () => evBooks(g.pid))}
      ${evidenceGroup("Wi-Fi 会话", 6, () => evWifi(g.pid))}
      ${evidenceGroup("被偷听到的话", 7, () => evConvos(g.pid))}
      ${evidenceGroup("CCTV 覆盖", 8, () => evCCTV(g.pid))}
      ${g.pid === 7 ? evidenceGroup("生物学家族关系", 9, () => evFamilyEleanor()) : ""}
      ${g.pid === 7 ? evidenceGroup("Elias 文档操作", 10, () => evDocsEleanor()) : ""}
    </div>
    <div class="sus-mark">
      <button data-mark="unknown" class="${mark==='unknown'?'active unknown':''}">待查</button>
      <button data-mark="suspect" class="${mark==='suspect'?'active suspect':''}">怀疑</button>
      <button data-mark="cleared" class="${mark==='cleared'?'active cleared':''}">已排除</button>
    </div>
  </div>`;
}
function evidenceGroup(label, needCh, builder) {
  if (!isUnlocked(needCh)) {
    return `<div class="ev-group locked">
      <h5>${esc(label)}</h5>
      <div class="ev-rows" data-need="${needCh}"></div>
    </div>`;
  }
  let inner = "";
  try { inner = builder(); } catch (e) { inner = `<div class="ev-row">（读取失败）</div>`; }
  return `<div class="ev-group">
    <h5>${esc(label)}</h5>
    <div class="ev-rows">${inner || `<div class="ev-row" style="color:var(--paper-mute)">（无记录）</div>`}</div>
  </div>`;
}
function evKeycard(pid) {
  const rows = runRows(`SELECT AccessTime, r.Name, k.AccessType, k.Granted, k.Notes
                        FROM KeycardAccess k JOIN Rooms r ON r.RoomID=k.RoomID
                        WHERE k.PersonID=${pid}
                        ORDER BY AccessTime`);
  return rows.map(r => {
    const granted = r[3] ? "" : ` <span style="color:var(--blood-bright)">DENIED</span>`;
    return `<div class="ev-row"><span class="t">${esc(r[0])}</span>${esc(r[1])} · ${esc(r[2])}${granted}${r[4]?` <span style="color:var(--paper-mute)">— ${esc(r[4])}</span>`:""}</div>`;
  }).join("");
}
function evPhone(pid) {
  const rows = runRows(`SELECT StartTime, RecordType, ToName, ToNumber, Content
                        FROM PhoneRecords WHERE FromPersonID=${pid} ORDER BY StartTime`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])}</span>${esc(r[1])} → ${esc(r[2]||r[3])}${r[4]?`<div style="color:var(--paper); margin-left:0; padding-left:0; font-style:italic;">"${esc(r[4])}"</div>`:""}</div>`).join("");
}
function evWine(pid) {
  const rows = runRows(`SELECT w.AccessTime, b.Label, b.Vintage FROM WineCellarLog w
                        JOIN WineBottles b ON b.BottleID=w.BottleID
                        WHERE w.TakenByPersonID=${pid} ORDER BY w.AccessTime`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])}</span>${esc(r[1])} (${r[2]})</div>`).join("");
}
function evBooks(pid) {
  const rows = runRows(`SELECT lc.CheckoutDate, lc.ReturnDate, b.Title FROM LibraryCheckouts lc
                        JOIN Books b ON b.BookID=lc.BookID
                        WHERE lc.PersonID=${pid} ORDER BY lc.CheckoutDate`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])} → ${esc(r[1]||"未还")}</span>${esc(r[2])}</div>`).join("");
}
function evWifi(pid) {
  const rows = runRows(`SELECT w.StartTime, w.EndTime, r.Name, w.DataMB, w.DeviceType FROM WiFiSessions w
                        JOIN Rooms r ON r.RoomID=w.APRoomID
                        WHERE w.PersonID=${pid} ORDER BY w.StartTime`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])} → ${esc(r[1]||"?")}</span>${esc(r[2])} · ${r[3]}MB · ${esc(r[4]||"")}</div>`).join("");
}
function evConvos(pid) {
  const rows = runRows(`SELECT c.SpokenTime, r.Name, c.Snippet,
                          (SELECT FullName FROM Persons WHERE PersonID=c.SpeakerID) AS sp,
                          (SELECT FullName FROM Persons WHERE PersonID=c.ListenerID) AS ls
                        FROM Conversations c JOIN Rooms r ON r.RoomID=c.RoomID
                        WHERE c.SpeakerID=${pid} OR c.ListenerID=${pid}
                        ORDER BY c.SpokenTime`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])}</span><span style="color:var(--paper-mute)">[${esc(r[1])}]</span> ${esc(r[3])} → ${esc(r[4]||"—")}<div style="font-style:italic;">"${esc(r[2])}"</div></div>`).join("");
}
function evCCTV(pid) {
  // Generic note shown on every card
  return `<div class="ev-row" style="color:var(--paper-mute)">嫌疑人本人不会出现在 CCTV 表里；详见 监控状态矩阵。</div>`;
}
function evFamilyEleanor() {
  const rows = runRows(`SELECT p.FullName, ft.RelationType, ft.RecordStatus, ft.EffectiveYear
                        FROM FamilyTree ft JOIN Persons p ON p.PersonID=ft.RelatedPersonID
                        WHERE ft.PersonID=7 ORDER BY ft.EffectiveYear`);
  return rows.map(r => `<div class="ev-row"><span class="t">${r[3]}</span>${esc(r[1])} → ${esc(r[0])} <span style="color:${r[2]==='Sealed_Adoption'?'var(--blood-bright)':'var(--paper-mute)'}">[${esc(r[2])}]</span></div>`).join("");
}
function evDocsEleanor() {
  const rows = runRows(`SELECT EventTime, Action, FileName, PreviewText FROM WritingSoftwareLog ORDER BY EventTime`);
  return rows.map(r => `<div class="ev-row"><span class="t">${esc(r[0])}</span>${esc(r[1])} · ${esc(r[2])}${r[3]?`<div style="font-size:10px; color:var(--paper-mute); font-style:italic;">${esc(r[3].slice(0,140))}${r[3].length>140?"...":""}</div>`:""}</div>`).join("");
}

// ============================================================
// Section: Floor plan
// ============================================================
const FP_ROOMS_LAYOUT = [
  // Floor 3 (Guest wing)
  { id: 301, x: 40,  y: 30,  w: 110, h: 56, label: "301 Thorne",  floor: 3 },
  { id: 302, x: 150, y: 30,  w: 110, h: 56, label: "302 Chen",    floor: 3 },
  { id: 303, x: 260, y: 30,  w: 110, h: 56, label: "303 Hartley", floor: 3 },
  { id: 304, x: 370, y: 30,  w: 110, h: 56, label: "304 Wright",  floor: 3 },
  { id: 305, x: 480, y: 30,  w: 110, h: 56, label: "305 Volkov",  floor: 3 },
  { id: 604, x: 40,  y: 86,  w: 550, h: 18, label: "604 Guest Corridor", floor: 3, narrow: true },

  // Floor 2 East
  { id: 101, x: 40,  y: 150, w: 100, h: 56, label: "101 Master (Elias)", floor: 2 },
  { id: 102, x: 140, y: 150, w: 100, h: 56, label: "102 Annex (Sophia)", floor: 2 },
  { id: 103, x: 240, y: 150, w: 110, h: 56, label: "103 Study",          floor: 2, scene: true },
  { id: 405, x: 350, y: 150, w: 110, h: 56, label: "405 Archive",        floor: 2 },
  { id: 602, x: 40,  y: 206, w: 420, h: 18, label: "602 East Corridor",  floor: 2, narrow: true },
  // Connecting door 406
  { id: 406, x: 345, y: 150, w: 8,   h: 56, label: "406", floor: 2, door: true },

  // Floor 2 West
  { id: 201, x: 470, y: 150, w: 110, h: 56, label: "201 Ashford Suite",  floor: 2 },
  { id: 603, x: 470, y: 206, w: 120, h: 18, label: "603 West Corridor",  floor: 2, narrow: true },

  // Floor 1 Main
  { id: 104, x: 40,  y: 270, w: 110, h: 56, label: "104 Library",        floor: 1 },
  { id: 105, x: 150, y: 270, w: 110, h: 56, label: "105 Drawing Room",   floor: 1 },
  { id: 402, x: 260, y: 270, w: 95,  h: 56, label: "402 Kitchen",        floor: 1 },
  { id: 403, x: 355, y: 270, w: 120, h: 56, label: "403 Dining Hall",    floor: 1 },
  { id: 404, x: 475, y: 270, w: 110, h: 56, label: "404 Conservatory",   floor: 1 },
  { id: 601, x: 40,  y: 326, w: 545, h: 18, label: "601 Main Hall",      floor: 1, narrow: true },

  // Floor 1 Grounds / Service
  { id: 501, x: 40,  y: 360, w: 180, h: 50, label: "501 Garden Cottage", floor: 1 },
  { id: 502, x: 230, y: 360, w: 180, h: 50, label: "502 Staff Quarters", floor: 1 },

  // Sub
  { id: 401, x: 240, y: 432, w: 220, h: 50, label: "401 Wine Cellar",    floor: -1 }
];

function renderFloorplan() {
  const wrap = document.getElementById("floorplan");
  if (!isUnlocked(1)) {
    wrap.innerHTML = lockedPanel(1, "完成第 1 章查询以解锁庄园平面图");
    return;
  }
  const rooms = Object.fromEntries(runRows(`SELECT RoomID, HasCCTV, HasKeycard FROM Rooms`).map(r => [r[0], { cctv: !!r[1], key: !!r[2] }]));
  const cctvShown = isUnlocked(8);
  const deletedFeedRooms = cctvShown
    ? new Set(runRows(`SELECT DISTINCT RoomID FROM CCTVFiles WHERE FileStatus='Deleted'`).map(r => r[0]))
    : new Set();

  // Floor groupings
  const floorLabels = [
    { y: 18,  text: "F3 · GUEST WING" },
    { y: 138, text: "F2 · MASTER & ARCHIVE" },
    { y: 258, text: "F1 · MAIN & GROUNDS" },
    { y: 420, text: "SUB · CELLAR" }
  ];

  let svg = `<svg viewBox="0 0 620 500" xmlns="http://www.w3.org/2000/svg">`;
  for (const fl of floorLabels) {
    svg += `<text x="40" y="${fl.y}" class="fp-floor-label">${fl.text}</text>`;
  }

  for (const r of FP_ROOMS_LAYOUT) {
    const meta = rooms[r.id] || { cctv: false, key: true };
    let cls = "fp-room";
    if (r.scene) cls += " scene";
    if (!meta.cctv) cls += " no-cctv";
    if (!meta.key) cls += " no-keycard";
    if (deletedFeedRooms.has(r.id)) cls += " deleted-feed";
    if (cctvShown) cls += " show-cctv";
    if (r.door) {
      // Render connecting door as a small gold dashed line later, skip rect-room here
      continue;
    }
    svg += `<g class="${cls}" data-room="${r.id}">
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="2"/>
      <text x="${r.x + 6}" y="${r.y + 14}" class="room-id">#${r.id}</text>
      <text x="${r.x + 6}" y="${r.y + (r.narrow ? 13 : 30)}">${esc(r.label.replace(/^[0-9]+ /, ""))}</text>
      ${r.scene ? `<text x="${r.x + r.w - 18}" y="${r.y + r.h - 8}" style="font-size:14px">🩸</text>` : ""}
    </g>`;
  }

  // Connecting door 406 (between 103 Study and 405 Archive)
  const doorVisible = isUnlocked(8);
  svg += `<line class="fp-connecting-door" x1="350" y1="160" x2="350" y2="200" />`;
  if (doorVisible) {
    svg += `<text x="354" y="183" style="fill:var(--gold); font-family:var(--font-mono); font-size:8px">406 · 私人连接门</text>`;
  } else {
    svg += `<text x="354" y="183" style="fill:var(--paper-mute); font-family:var(--font-mono); font-size:8px">406 · ?</text>`;
  }

  svg += `</svg>`;
  wrap.innerHTML = `<div class="floorplan-wrap" style="position:relative">${svg}<div id="fp-tooltip" style="display:none"></div></div>`;

  // Tooltip on hover
  const tt = wrap.querySelector("#fp-tooltip");
  wrap.querySelectorAll(".fp-room").forEach(g => {
    g.addEventListener("mouseenter", e => showFpTooltip(e, g.dataset.room, tt));
    g.addEventListener("mousemove", e => positionTooltip(e, tt));
    g.addEventListener("mouseleave", () => { tt.style.display = "none"; });
  });
}

function showFpTooltip(e, rid, tt) {
  rid = parseInt(rid, 10);
  const r = runRows(`SELECT Name, HasCCTV, HasKeycard, Wing, Floor FROM Rooms WHERE RoomID=${rid}`)[0];
  if (!r) return;
  let occ = "";
  if (isUnlocked(6)) {
    // Who was in this room during ToD window?
    const ppl = runRows(`SELECT DISTINCT p.FullName FROM Persons p
       JOIN WiFiSessions w ON w.PersonID=p.PersonID
       WHERE w.APRoomID=${rid}
         AND w.StartTime <= '2024-10-20 01:30'
         AND (w.EndTime >= '2024-10-20 00:30' OR w.EndTime IS NULL)`);
    if (ppl.length) occ = `<div class="tt-occ">当晚 ToD 期间在此 (Wi-Fi):<br>${ppl.map(p => "· " + esc(p[0])).join("<br>")}</div>`;
  }
  let convo = "";
  if (isUnlocked(7)) {
    const conv = runRows(`SELECT SpokenTime, Snippet FROM Conversations WHERE RoomID=${rid}`);
    if (conv.length) convo = `<div class="tt-conv">${conv.length} 句对话被偷听到</div>`;
  }
  tt.innerHTML = `
    <div class="tt-room">#${rid} ${esc(r[0])}</div>
    <div class="tt-meta">${esc(r[3])}翼 · F${r[4]} · ${r[1] ? "✓ CCTV" : "✗ 无 CCTV"} · ${r[2] ? "✓ Keycard" : "✗ 无读卡器"}</div>
    ${occ}${convo}
  `;
  tt.style.display = "block";
  positionTooltip(e, tt);
}
function positionTooltip(e, tt) {
  tt.className = "fp-tooltip";
  const r = tt.parentElement.getBoundingClientRect();
  tt.style.left = (e.clientX - r.left + 12) + "px";
  tt.style.top = (e.clientY - r.top + 12) + "px";
}

// ============================================================
// Section: Timeline
// ============================================================
function renderTimeline() {
  const wrap = document.getElementById("timeline");
  if (!isUnlocked(2)) {
    wrap.innerHTML = lockedPanel(2, "完成第 2 章查询以解锁案发时间线");
    return;
  }
  // 1820 px wide canvas (1 px per second over 9 hours from 18:00 Sat → 03:00 Sun ≈ way too wide). Use 1080 px.
  // Time axis: 18:00 Sat → 03:00 Sun (9 hours = 540 min). x = (minutesSince18:00) * 2 + 120 (label gutter)
  const T0 = new Date("2024-10-19T18:00:00").getTime();
  const T1 = new Date("2024-10-20T03:00:00").getTime();
  const totalMs = T1 - T0;
  const W = 1080, gutter = 130;
  const innerW = W - gutter - 10;
  const xOf = ms => gutter + ((ms - T0) / totalMs) * innerW;

  const tracks = [
    { label: "Elias",          pid: 1, y: 60  },
    { label: "Vivienne",       pid: 2, y: 90  },
    { label: "Sophia",         pid: 3, y: 120 },
    { label: "Marcus",         pid: 4, y: 150 },
    { label: "Iris",           pid: 5, y: 180 },
    { label: "Julian",         pid: 6, y: 210 },
    { label: "Eleanor",        pid: 7, y: 240 },
    { label: "Henrik",         pid: 8, y: 270 },
    { label: "Staff",          pid: null, y: 300 }
  ];
  const ROW_H = 30;
  const H = 340;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" id="tl-svg">`;

  // ToD band 00:30 – 01:30
  const todX1 = xOf(new Date("2024-10-20T00:30:00").getTime());
  const todX2 = xOf(new Date("2024-10-20T01:30:00").getTime());
  svg += `<rect class="tl-tod-band" x="${todX1}" y="40" width="${todX2-todX1}" height="${H-50}" />`;
  // tod label
  svg += `<text x="${(todX1+todX2)/2}" y="35" text-anchor="middle" fill="var(--blood-bright)" font-family="var(--font-mono)" font-size="10" letter-spacing="0.1em">TIME OF DEATH 00:30 – 01:30</text>`;

  // Axis ticks every hour
  for (let h = 18; h <= 27; h++) {
    const t = (h < 24) ? new Date(`2024-10-19T${String(h).padStart(2,"0")}:00:00`).getTime()
                       : new Date(`2024-10-20T${String(h-24).padStart(2,"0")}:00:00`).getTime();
    const x = xOf(t);
    svg += `<line class="tl-axis-tick" x1="${x}" y1="40" x2="${x}" y2="${H-10}" stroke-width="1" stroke-opacity="0.3"/>`;
    svg += `<text x="${x}" y="${H-2}" text-anchor="middle" class="tl-axis-label">${String(h%24).padStart(2,"0")}:00</text>`;
  }

  // Track backgrounds + labels
  tracks.forEach((tr, i) => {
    svg += `<rect class="tl-row-bg" x="${gutter}" y="${tr.y-12}" width="${innerW}" height="${ROW_H-2}"/>`;
    svg += `<text class="tl-row-label" x="${gutter-10}" y="${tr.y+2}" text-anchor="end">${esc(tr.label)}</text>`;
  });

  // Events — keycard
  const kcRows = runRows(`SELECT PersonID, AccessTime, Granted, AccessType, Notes, RoomID FROM KeycardAccess ORDER BY AccessTime`);
  for (const r of kcRows) {
    const pid = r[0]; const tr = tracks.find(t => t.pid === pid) || tracks.find(t => t.pid === null);
    const x = xOf(new Date(r[1].replace(" ", "T")).getTime());
    const color = r[2] ? "var(--evt-keycard-ok)" : "var(--evt-keycard-no)";
    const tip = `${r[1]} · ${esc(r[3])} room ${r[5]} ${r[2]?"":"DENIED"}${r[4]?` — ${esc(r[4])}`:""}`;
    svg += `<circle class="tl-event tl-keycard" data-tip="${esc(tip)}" cx="${x}" cy="${tr.y}" r="4" fill="${color}" stroke="var(--bg-1)" stroke-width="0.5"/>`;
  }

  // Events — SMS (only if Ch3 unlocked)
  if (isUnlocked(3)) {
    const sms = runRows(`SELECT FromPersonID, StartTime, RecordType, ToName, Content FROM PhoneRecords ORDER BY StartTime`);
    for (const r of sms) {
      const tr = tracks.find(t => t.pid === r[0]); if (!tr) continue;
      const x = xOf(new Date(r[1].replace(" ", "T")).getTime());
      const tip = `${r[1]} · ${esc(r[2])} → ${esc(r[3]||"?")} ${r[4]?`"${esc(r[4]).slice(0,60)}..."`:""}`;
      svg += `<rect class="tl-event tl-sms" data-tip="${esc(tip)}" x="${x-3}" y="${tr.y+5}" width="6" height="6" fill="var(--evt-sms)"/>`;
    }
  }

  // Events — wine (Ch4)
  if (isUnlocked(4)) {
    const wine = runRows(`SELECT w.TakenByPersonID, w.AccessTime, b.Label FROM WineCellarLog w JOIN WineBottles b ON b.BottleID=w.BottleID ORDER BY w.AccessTime`);
    for (const r of wine) {
      const tr = tracks.find(t => t.pid === r[0]) || tracks.find(t => t.pid === null);
      const x = xOf(new Date(r[1].replace(" ", "T")).getTime());
      const tip = `${r[1]} · 取酒：${esc(r[2])}`;
      svg += `<polygon class="tl-event tl-wine" data-tip="${esc(tip)}" points="${x},${tr.y-6} ${x+5},${tr.y+4} ${x-5},${tr.y+4}" fill="var(--evt-wine)"/>`;
    }
  }

  // Events — WiFi (Ch6) — as horizontal bars
  if (isUnlocked(6)) {
    const wf = runRows(`SELECT PersonID, StartTime, EndTime, DataMB, APRoomID FROM WiFiSessions ORDER BY StartTime`);
    for (const r of wf) {
      const tr = tracks.find(t => t.pid === r[0]); if (!tr) continue;
      const x1 = xOf(new Date(r[1].replace(" ", "T")).getTime());
      const x2 = xOf(new Date((r[2]||r[1]).replace(" ", "T")).getTime());
      const tip = `Wi-Fi ${r[1]} → ${r[2]||"?"} · AP ${r[4]} · ${r[3]}MB`;
      svg += `<rect class="tl-event tl-wifi-bar" data-tip="${esc(tip)}" x="${x1}" y="${tr.y-3}" width="${Math.max(2,x2-x1)}" height="2" fill="var(--evt-wifi)"/>`;
    }
    // Eleanor gap highlight 00:28 → 01:35
    const gx1 = xOf(new Date("2024-10-20T00:28:00").getTime());
    const gx2 = xOf(new Date("2024-10-20T01:35:00").getTime());
    const eY = tracks.find(t => t.pid === 7).y - 2;
    svg += `<line id="el-wifi-gap" class="tl-wifi-gap" x1="${gx1}" y1="${eY}" x2="${gx2}" y2="${eY}"/>`;
  }

  // Events — overheard convos (Ch7)
  if (isUnlocked(7)) {
    const cvs = runRows(`SELECT SpeakerID, SpokenTime, Snippet, RoomID FROM Conversations ORDER BY SpokenTime`);
    for (const r of cvs) {
      const tr = tracks.find(t => t.pid === r[0]); if (!tr) continue;
      const x = xOf(new Date(r[1].replace(" ", "T")).getTime());
      const tip = `${r[1]} · 室 ${r[3]}："${esc(r[2]).slice(0,80)}..."`;
      svg += `<circle class="tl-event tl-convo" data-tip="${esc(tip)}" cx="${x}" cy="${tr.y-7}" r="3.5" fill="var(--evt-convo)" stroke="var(--bg-1)" stroke-width="0.5"/>`;
    }
  }

  // Events — Doc operations (Ch10)
  if (isUnlocked(10)) {
    const docs = runRows(`SELECT EventTime, Action, FileName FROM WritingSoftwareLog ORDER BY EventTime`);
    const tr = tracks.find(t => t.pid === 1); // Elias track
    for (const r of docs) {
      const x = xOf(new Date(r[0].replace(" ", "T")).getTime());
      const color = r[1] === "Delete" ? "var(--blood-bright)" : "var(--evt-doc)";
      const tip = `${r[0]} · ${esc(r[1])} ${esc(r[2])}`;
      svg += `<polygon class="tl-event tl-doc" data-tip="${esc(tip)}" points="${x-4},${tr.y+8} ${x+4},${tr.y+8} ${x},${tr.y+14}" fill="${color}"/>`;
    }
  }

  // Time cursor (draggable)
  const cursorX = xOf(new Date("2024-10-20T00:48:00").getTime());
  svg += `<line id="tl-cursor" class="tl-cursor" x1="${cursorX}" y1="40" x2="${cursorX}" y2="${H-15}" data-x="${cursorX}"/>`;
  svg += `<polygon id="tl-cursor-handle" class="tl-cursor-handle" points="${cursorX-6},36 ${cursorX+6},36 ${cursorX},44"/>`;
  svg += `<text id="tl-cursor-label" class="tl-cursor-label" x="${cursorX}" y="32" text-anchor="middle">00:48</text>`;

  svg += `</svg>`;

  const legend = `<div class="timeline-legend">
    <span class="lg"><span class="swatch" style="background:var(--evt-keycard-ok)"></span> 刷卡 OK</span>
    <span class="lg"><span class="swatch" style="background:var(--evt-keycard-no)"></span> 刷卡 拒绝</span>
    ${isUnlocked(3)?`<span class="lg"><span class="swatch" style="background:var(--evt-sms); border-radius:0;"></span> 短信</span>`:""}
    ${isUnlocked(4)?`<span class="lg"><span class="swatch" style="background:var(--evt-wine); clip-path: polygon(50% 0, 100% 100%, 0 100%); border-radius:0;"></span> 取酒</span>`:""}
    ${isUnlocked(6)?`<span class="lg"><span class="swatch" style="background:var(--evt-wifi); height:3px; border-radius:0;"></span> Wi-Fi 会话</span>`:""}
    ${isUnlocked(7)?`<span class="lg"><span class="swatch" style="background:var(--evt-convo)"></span> 被偷听到</span>`:""}
    ${isUnlocked(10)?`<span class="lg"><span class="swatch" style="background:var(--evt-doc); clip-path:polygon(0 0, 100% 0, 50% 100%); border-radius:0;"></span> 文档操作</span>`:""}
  </div>
  ${!isUnlocked(6) ? `<div style="font-family:var(--font-mono); font-size:11px; color:var(--paper-mute); margin: 6px 0;">📡 需完成第 6 章 INNER JOIN 查询，方可调取 Wi-Fi 会话数据。</div>`:""}`;

  wrap.innerHTML = `<div class="timeline-wrap">
    ${legend}
    <div class="timeline-svg-wrap">${svg}</div>
    <div id="tl-event-detail" style="margin-top:8px; min-height:32px; padding:6px 10px; background:var(--bg-0); border:1px solid var(--border); border-radius:2px; font-family:var(--font-mono); font-size:11px; color:var(--paper-mute);">悬停事件 / 拖动金色游标查看 ±15 分钟内的活动</div>
  </div>`;

  // Wire tooltips
  wrap.querySelectorAll(".tl-event").forEach(ev => {
    ev.addEventListener("mouseenter", () => {
      const d = document.getElementById("tl-event-detail");
      d.textContent = ev.dataset.tip;
      d.style.color = "var(--paper)";
    });
  });

  // Cursor drag
  const svgEl = document.getElementById("tl-svg");
  const cursor = document.getElementById("tl-cursor");
  const handle = document.getElementById("tl-cursor-handle");
  const cursorLabel = document.getElementById("tl-cursor-label");
  let dragging = false;
  function getXFromMouse(e) {
    const rect = svgEl.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const xVB = (xPx / rect.width) * W;
    return Math.max(gutter, Math.min(W - 10, xVB));
  }
  function timeAtX(x) {
    const ms = T0 + ((x - gutter) / innerW) * totalMs;
    return new Date(ms);
  }
  function applyCursor(x) {
    cursor.setAttribute("x1", x); cursor.setAttribute("x2", x);
    handle.setAttribute("points", `${x-6},36 ${x+6},36 ${x},44`);
    cursorLabel.setAttribute("x", x);
    const d = timeAtX(x);
    cursorLabel.textContent = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    // glow events ±15 min
    const cMs = d.getTime();
    svgEl.querySelectorAll(".tl-event").forEach(ev => {
      const tip = ev.dataset.tip || "";
      const m = tip.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
      if (!m) return;
      const evMs = new Date(m[1].replace(" ", "T")).getTime();
      const close = Math.abs(evMs - cMs) <= 15 * 60 * 1000;
      ev.classList.toggle("glow", close);
      ev.classList.toggle("dimmed", !close);
    });
  }
  handle.addEventListener("mousedown", () => { dragging = true; });
  cursor.addEventListener("mousedown", () => { dragging = true; });
  window.addEventListener("mousemove", e => { if (dragging) applyCursor(getXFromMouse(e)); });
  window.addEventListener("mouseup",   () => { dragging = false; });
  // Initial: don't dim
}

// ============================================================
// Section: SQL Sandbox
// ============================================================
function renderSandbox() {
  const wrap = document.getElementById("sandbox");
  const tabsHtml = window.BMM_META.chapters.map(c => {
    const active = (BMM.currentTab === c.id) ? " active" : "";
    const unlocked = isUnlocked(c.id) ? " unlocked" : "";
    return `<button class="sql-tab${active}${unlocked}" data-ch="${c.id}">
      <span class="tab-num">CH ${String(c.id).padStart(2,"0")}</span>
      <span class="tab-concept">${esc(c.concept)}</span>
    </button>`;
  }).join("");

  const ch = window.BMM_META.chapters.find(c => c.id === BMM.currentTab);
  const editorVal = BMM.tabQueries[ch.id] ?? ch.starter;

  wrap.innerHTML = `<div class="sql-sandbox">
    <div class="sql-tabs">${tabsHtml}</div>
    <div class="sql-body">
      <div class="sql-prompt">
        <div class="ch-num">第 ${ch.id} 章 · ${esc(ch.concept)}</div>
        <div class="ch-title">${esc(ch.title)}</div>
        <div class="ch-goal">${esc(ch.goal)}</div>
        <div class="ch-expect">期望：${esc(ch.expect)}</div>
      </div>
      <div class="sql-editor-wrap">
        <textarea id="sql-editor" class="sql-editor" spellcheck="false">${esc(editorVal)}</textarea>
      </div>
      <div class="sql-actions">
        <button id="sql-run" class="primary">▶ Run</button>
        <button id="sql-hint">💡 Hint</button>
        <button id="sql-reset-editor">↺ Reset</button>
        <span class="kbd-hint">⌘/Ctrl + Enter 跑查询 · Tab 缩进</span>
      </div>
      <div id="sql-hint-box" class="sql-hint">
        <div class="h-title">提示 · Ch${ch.id}</div>
        <div style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 12px;">${esc(ch.hint)}</div>
      </div>
      <div id="sql-status" class="sql-status info" style="display:none"></div>
      <div id="sql-results" class="sql-results-wrap"></div>
    </div>
  </div>`;

  // Wire tabs
  wrap.querySelectorAll(".sql-tab").forEach(tb => {
    tb.addEventListener("click", () => {
      BMM.currentTab = parseInt(tb.dataset.ch, 10);
      renderSandbox();
    });
  });

  // Editor
  const ed = document.getElementById("sql-editor");
  ed.addEventListener("input", () => { BMM.tabQueries[ch.id] = ed.value; });
  ed.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ed.selectionStart, eend = ed.selectionEnd;
      ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(eend);
      ed.selectionStart = ed.selectionEnd = s + 2;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault(); runQuery();
    }
  });

  document.getElementById("sql-run").addEventListener("click", runQuery);
  document.getElementById("sql-hint").addEventListener("click", () => {
    document.getElementById("sql-hint-box").classList.toggle("open");
  });
  document.getElementById("sql-reset-editor").addEventListener("click", () => {
    ed.value = ch.starter; BMM.tabQueries[ch.id] = ch.starter;
  });
}

function runQuery() {
  const ed = document.getElementById("sql-editor");
  const sql = (ed.value || "").trim();
  const resWrap = document.getElementById("sql-results");
  const status = document.getElementById("sql-status");
  status.style.display = "block";
  if (!sql) {
    status.className = "sql-status bad"; status.textContent = "请输入 SQL 语句。";
    resWrap.innerHTML = ""; return;
  }
  let results;
  try {
    results = BMM.db.exec(sql);
  } catch (err) {
    status.className = "sql-status bad";
    status.textContent = "SQL 错误：" + err.message;
    resWrap.innerHTML = "";
    return;
  }
  // Render the LAST statement's result (so students can prefix with PRAGMA etc.)
  const last = results[results.length - 1];
  if (!last) {
    status.className = "sql-status info";
    status.textContent = "语句执行成功，但没有返回结果集。";
    resWrap.innerHTML = "";
    return;
  }
  renderResultTable(last, resWrap);

  // Grade
  const ch = BMM.currentTab;
  const verdict = window.BMM_grade(ch, last);
  if (verdict.pass) {
    status.className = "sql-status ok";
    const wasUnlocked = isUnlocked(ch);
    status.innerHTML = `✓ 查询命中预期。第 ${ch} 章解锁。<span style="color:var(--paper-mute); margin-left:8px;">→ 翻看新证据</span>`;
    if (!wasUnlocked) {
      BMM.state.progress[ch] = { unlocked: true, completedAt: Date.now(), queryText: sql };
      saveState();
      // Re-render and play ritual
      renderSidebar();
      renderWhiteboard();
      applyUnlocks(true);
    }
  } else {
    status.className = "sql-status info";
    status.textContent = `结果集：${last.values.length} 行 × ${last.columns.length} 列 · 但 ${verdict.why}。继续尝试。`;
  }
}

function renderResultTable(result, container) {
  const cols = result.columns;
  const rows = result.values.slice(0, 50);
  const more = result.values.length > 50 ? `<div style="padding:6px 10px; color:var(--paper-mute); font-size:11px;">（仅显示前 50 行，共 ${result.values.length} 行）</div>` : "";
  const head = cols.map(c => `<th>${esc(c)}</th>`).join("");
  const body = rows.map(r => `<tr>${r.map(v => v == null ? `<td class="null">NULL</td>` : `<td>${esc(v)}</td>`).join("")}</tr>`).join("");
  container.innerHTML = `<table class="sql-results"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${more}`;
}

// ============================================================
// Section: Family tree
// ============================================================
function renderFamilyTree() {
  const wrap = document.getElementById("familytree");
  if (!isUnlocked(1)) {
    wrap.innerHTML = lockedPanel(1, "完成第 1 章查询以解锁家族树");
    return;
  }
  // Node layout — manual
  const nodes = {
    15: { x: 250, y: 50,  label: "Charles",   yrs: "1932–2002", flags: ["deceased"] },
    16: { x: 380, y: 50,  label: "Henrietta", yrs: "1935–2018", flags: ["deceased"] },
    14: { x: 250, y: 165, label: "Margaret",  yrs: "1964–1986", flags: ["deceased"] },
    1:  { x: 380, y: 165, label: "Elias",     yrs: "1957–2024", flags: ["victim","deceased"] },
    2:  { x: 510, y: 165, label: "Vivienne",  yrs: "1972–",     flags: [] },
    3:  { x: 600, y: 165, label: "Sophia",    yrs: "1992–",     flags: [] },
    17: { x: 50,  y: 50,  label: "Robert W.", yrs: "1940–2010", flags: ["deceased"] },
    18: { x: 130, y: 50,  label: "Patricia W.",yrs:"1942–2008", flags: ["deceased"] },
    7:  { x: 90,  y: 165, label: "Eleanor",   yrs: "1980–",     flags: ["sealed-hint"] },
    8:  { x: 700, y: 50,  label: "Henrik",    yrs: "1963–",     flags: [] },
    11: { x: 700, y: 165, label: "Anton",     yrs: "1996–",     flags: [] }
  };
  const ch9 = isUnlocked(9);

  // Build clipPath defs for any node with a photo
  let defs = `<defs>`;
  for (const [id, n] of Object.entries(nodes)) {
    const photo = window.BMM_photoPath && window.BMM_photoPath(parseInt(id, 10));
    if (photo) {
      defs += `<clipPath id="ft-clip-${id}"><circle cx="${n.x}" cy="${n.y}" r="22"/></clipPath>`;
    }
  }
  defs += `</defs>`;

  const ftEdges = runRows(`SELECT PersonID, RelatedPersonID, RelationType, RecordStatus FROM FamilyTree`);
  let svg = `<svg viewBox="0 0 770 260" xmlns="http://www.w3.org/2000/svg" id="ft-svg">${defs}`;

  for (const e of ftEdges) {
    const [pid, rid, type, status] = e;
    if (!nodes[pid] || !nodes[rid]) continue;
    if (status === "Sealed_Adoption" && !ch9) continue;
    const a = nodes[pid], b = nodes[rid];
    let cls = "ft-edge";
    if (type === "Spouse" || type === "ExSpouse") cls += " spouse";
    if (status === "Sealed_Adoption") cls += " sealed";
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + (Math.abs(a.x - b.x) > 100 ? 8 : 0);
    if (status === "Sealed_Adoption") {
      svg += `<path id="ft-sealed-path" class="${cls}" d="M${a.x},${a.y} Q${cx},${cy+20} ${b.x},${b.y}"/>`;
    } else {
      svg += `<path class="${cls}" d="M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}"/>`;
    }
  }

  // Nodes — photo if available, else flat circle
  for (const [id, n] of Object.entries(nodes)) {
    const pid = parseInt(id, 10);
    const photo = window.BMM_photoPath && window.BMM_photoPath(pid);
    const flagCls = n.flags.map(f => " " + f).join("");
    const isMargaret = (pid === 14);
    svg += `<g class="ft-node${flagCls}${photo ? " has-photo" : ""}${isMargaret ? " margaret" : ""}" data-pid="${id}">`;
    if (photo) {
      // Photo-clipped portrait
      svg += `<image href="${photo}" x="${n.x - 22}" y="${n.y - 22}" width="44" height="44"
                preserveAspectRatio="xMidYMid slice" clip-path="url(#ft-clip-${id})"/>`;
      // Sepia tint overlay
      svg += `<circle cx="${n.x}" cy="${n.y}" r="22" fill="rgba(184,153,104,0.08)" pointer-events="none"/>`;
      // Border circle on top
      svg += `<circle cx="${n.x}" cy="${n.y}" r="22" fill="none" stroke="${n.flags.includes("victim")?"var(--blood)":n.flags.includes("deceased")?"var(--paper-mute)":"var(--paper)"}" stroke-width="${n.flags.includes("victim")?2:1.2}" ${n.flags.includes("deceased")?'stroke-dasharray="2 2"':''}/>`;
    } else {
      svg += `<circle cx="${n.x}" cy="${n.y}" r="22"/>`;
    }
    // Label below
    svg += `<text x="${n.x}" y="${n.y + 36}" font-size="9">${esc(n.label)}</text>`;
    svg += `<text x="${n.x}" y="${n.y + 47}" class="ft-years">${esc(n.yrs)}</text>`;
    if (n.flags.includes("sealed-hint") && !ch9) {
      svg += `<text x="${n.x + 18}" y="${n.y - 18}" class="ft-sealed-icon">🔒</text>`;
    }
    svg += `</g>`;
  }
  svg += `</svg>`;

  wrap.innerHTML = `<div class="familytree-wrap">
    ${svg}
    <div class="ft-reveal-overlay"><div id="ft-banner" class="banner">封存的领养记录浮出水面。</div></div>
  </div>`;
}

// ============================================================
// Section: Evidence cabinet
// ============================================================
function renderEvidenceCab() {
  const wrap = document.getElementById("evidence-cab");
  if (!isUnlocked(2)) {
    wrap.innerHTML = lockedPanel(2, "完成第 2 章查询以解锁物证柜");
    return;
  }
  const tabs = [
    { id: "books",  label: "图书借阅",   needCh: 5 },
    { id: "wine",   label: "酒窖日志",   needCh: 4 },
    { id: "phone",  label: "通讯记录",   needCh: 3 },
    { id: "docs",   label: "文档日志",   needCh: 10 }
  ];
  // Default active: highest unlocked
  let active = tabs.find(t => isUnlocked(t.needCh))?.id || "books";
  if (wrap.dataset.activeTab) active = wrap.dataset.activeTab;

  const tabsHtml = tabs.map(t => {
    const unlocked = isUnlocked(t.needCh);
    return `<button class="ev-tab ${unlocked?"":"locked"} ${active===t.id?"active":""}" data-tab="${t.id}" ${!unlocked?"disabled":""}>
      ${esc(t.label)} ${unlocked?"":`<span style="font-size:9px; color:var(--paper-mute);">CH${t.needCh}</span>`}
    </button>`;
  }).join("");

  const panels = tabs.map(t => {
    const cls = "ev-panel" + (active===t.id ? " active" : "");
    if (!isUnlocked(t.needCh)) {
      return `<div class="${cls}" data-tab="${t.id}">${lockedPanelInline(t.needCh)}</div>`;
    }
    return `<div class="${cls}" data-tab="${t.id}">${evPanelBody(t.id)}</div>`;
  }).join("");

  wrap.innerHTML = `<div class="evidence-cab">
    <div class="ev-tabs">${tabsHtml}</div>
    ${panels}
  </div>`;

  wrap.querySelectorAll(".ev-tab:not(.locked)").forEach(b => {
    b.addEventListener("click", () => {
      wrap.dataset.activeTab = b.dataset.tab;
      renderEvidenceCab();
    });
  });
}

function evPanelBody(tab) {
  if (tab === "books") {
    const rows = runRows(`SELECT lc.CheckoutDate, lc.ReturnDate, b.Title, b.Author, p.FullName
                          FROM LibraryCheckouts lc JOIN Books b ON b.BookID=lc.BookID
                          JOIN Persons p ON p.PersonID=lc.PersonID
                          ORDER BY lc.CheckoutDate DESC`);
    return tableHtml(["借出", "归还", "书目", "作者", "借阅人"], rows);
  }
  if (tab === "wine") {
    const rows = runRows(`SELECT w.AccessTime, b.Label, b.Vintage, b.ShelfLocation, p.FullName
                          FROM WineCellarLog w JOIN WineBottles b ON b.BottleID=w.BottleID
                          JOIN Persons p ON p.PersonID=w.TakenByPersonID
                          ORDER BY w.AccessTime`);
    return tableHtml(["时间", "酒款", "年份", "货架", "取酒者"], rows);
  }
  if (tab === "phone") {
    const rows = runRows(`SELECT StartTime, p.FullName, RecordType, ToName, ToNumber, Content
                          FROM PhoneRecords pr JOIN Persons p ON p.PersonID=pr.FromPersonID
                          ORDER BY StartTime`);
    return tableHtml(["时间", "发起人", "类型", "对方", "号码", "内容"], rows);
  }
  if (tab === "docs") {
    const rows = runRows(`SELECT EventTime, Action, FileName, CharCount, PreviewText FROM WritingSoftwareLog ORDER BY EventTime`);
    const rendered = rows.map(r => {
      const isDeleted = r[1] === "Delete";
      const isMemo = String(r[2]).startsWith("Memo_PersonalNote");
      const hideMemo = isMemo && !isUnlocked(10);
      const preview = r[4] == null ? "" : r[4];
      const memoMarker = hideMemo ? `<span class="blurred">${esc(preview).slice(0,80)}...</span>` : esc(preview);
      const cls = isDeleted ? "deleted" : "";
      return `<tr class="${cls}"><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${r[3]==null?"":r[3]}</td><td class="preview-cell">${memoMarker}</td></tr>`;
    }).join("");
    return `<table class="ev-table"><thead><tr><th>时间</th><th>动作</th><th>文件</th><th>字数</th><th>预览</th></tr></thead><tbody>${rendered}</tbody></table>`;
  }
  return "";
}
function tableHtml(cols, rows) {
  return `<table class="ev-table">
    <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v == null ? "—" : esc(v)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

// ============================================================
// Section: CCTV matrix
// ============================================================
function renderCCTVMatrix() {
  const wrap = document.getElementById("cctv-matrix");
  if (!isUnlocked(8)) {
    wrap.innerHTML = lockedPanel(8, "完成第 8 章 LEFT JOIN 查询以解锁监控状态矩阵");
    return;
  }
  const rooms = runRows(`SELECT r.RoomID, r.Name, r.HasCCTV,
      (SELECT COUNT(*) FROM CCTVFiles WHERE RoomID=r.RoomID AND FileStatus='Intact'),
      (SELECT COUNT(*) FROM CCTVFiles WHERE RoomID=r.RoomID AND FileStatus='Deleted'),
      (SELECT GROUP_CONCAT(DeletedTime) FROM CCTVFiles WHERE RoomID=r.RoomID AND FileStatus='Deleted'),
      (SELECT GROUP_CONCAT(DISTINCT p.FullName) FROM CCTVFiles c JOIN Persons p ON p.PersonID=c.DeletedByID WHERE c.RoomID=r.RoomID AND c.FileStatus='Deleted'),
      (SELECT GROUP_CONCAT(DISTINCT c.DeletedByID) FROM CCTVFiles c WHERE c.RoomID=r.RoomID AND c.FileStatus='Deleted')
    FROM Rooms r ORDER BY r.RoomID`);

  const rendered = rooms.map(r => {
    const deletedCount = r[4] || 0;
    const cls = deletedCount > 0 ? "deleted" : "";
    let deleterCell = esc(r[6] || "—");
    if (r[7]) {
      const pid = parseInt(String(r[7]).split(",")[0], 10);
      const pPath = window.BMM_photoPath(pid);
      if (pPath) {
        deleterCell = `<img class="cctv-mini-avatar" src="${pPath}" alt=""/> ${esc(r[6])}`;
      }
    }
    return `<tr class="${cls}">
      <td>#${r[0]}</td><td>${esc(r[1])}</td>
      <td>${r[2] ? "✓" : "—"}</td>
      <td>${r[3] || 0}</td>
      <td>${deletedCount}</td>
      <td>${esc(r[5] || "—")}</td>
      <td>${deleterCell}</td>
    </tr>`;
  }).join("");

  // System admin badge
  const pembertonPath = window.BMM_photoPath(10);
  const adminBadge = pembertonPath ? `
    <div class="cctv-admin-badge">
      <img src="${pembertonPath}" alt="Pemberton"/>
      <div>
        <div class="cctv-admin-label">CCTV SYSTEM ADMIN</div>
        <div class="cctv-admin-name">Mr Albert Pemberton · 管家长</div>
        <div class="cctv-admin-note">系统由其管理，但 00:25 的删除由 Elias 本人执行（管理员账号）</div>
      </div>
    </div>` : "";

  wrap.innerHTML = `<div class="cctv-matrix">
    ${adminBadge}
    <table>
      <thead><tr><th>RoomID</th><th>名称</th><th>有 CCTV</th><th>完好片段</th><th>已删片段</th><th>删除时间</th><th>删除者</th></tr></thead>
      <tbody>${rendered}</tbody>
    </table>
    <div class="annotation">这是删除日志，不是凶手。书房 / 档案室 / 连接门走廊均无摄像头；东走廊 (602) 的两段录像于 00:25 被删除——任何在该走廊往来的人都将留下视觉真空。</div>
  </div>`;
}

// ============================================================
// Section: Overheard conversations
// ============================================================
function renderConvos() {
  const wrap = document.getElementById("convos");
  if (!isUnlocked(7)) {
    wrap.innerHTML = lockedPanel(7, "完成第 7 章多表 JOIN 以解锁偷听对话记录");
    return;
  }
  const rows = runRows(`SELECT c.SpokenTime, c.Snippet, r.Name,
      sp.FullName, ls.FullName, ob.FullName,
      c.OverheardByID, c.SpeakerID
    FROM Conversations c
    JOIN Persons sp ON sp.PersonID=c.SpeakerID
    LEFT JOIN Persons ls ON ls.PersonID=c.ListenerID
    JOIN Persons ob ON ob.PersonID=c.OverheardByID
    JOIN Rooms r ON r.RoomID=c.RoomID
    ORDER BY c.SpokenTime`);
  const cards = rows.map((r, i) => {
    const obPath = window.BMM_photoPath(r[6]);
    const spPath = window.BMM_photoPath(r[7]);
    const obAvatar = obPath ? `<img class="convo-ob-avatar" src="${obPath}" alt="${esc(r[5])}" title="overheard by ${esc(r[5])}" />` : "";
    const spAvatar = spPath ? `<img class="convo-sp-avatar" src="${spPath}" alt="${esc(r[3])}" />` : "";
    return `<div class="convo-card slide-in" style="animation-delay:${i*100}ms">
      ${obAvatar}
      <div class="convo-note">${esc(r[0]).slice(11,16)} — ${esc(r[2])} — overheard by ${esc(r[5])}</div>
      <div class="convo-attr">${spAvatar}<b>${esc(r[3])}</b> → ${esc(r[4]||"—")}</div>
      <div class="convo-quote">"${esc(r[1])}"</div>
    </div>`;
  }).join("");
  wrap.innerHTML = `<div class="convo-grid">${cards}</div>`;
}

// ============================================================
// Section: Case closed
// ============================================================
function renderCaseClosed() {
  const wrap = document.getElementById("case-closed");
  if (!isUnlocked(11)) {
    wrap.innerHTML = `<div class="locked-panel">
      <div class="lock-icon">⚖️</div>
      <div>案件未结。请完成第 11 章最终查询。</div>
      <button class="lock-cta" data-jump="11">→ 跳到 SQL 沙盘第 11 章</button>
    </div>`;
    return;
  }
  // Seven columns of evidence — student-computed
  // Columns: 进入 ToD 书房 · 财务/恩怨动机 · Wi-Fi 空窗 · 借阅 · 文档关联 · 偷听约定 · 生物血缘
  const persons = ["Vivienne Ashford","Sophia Blackwood","Marcus Thorne","Iris Chen","Julian Hartley","Eleanor Wright","Henrik Volkov"];
  const cells = {
    "Vivienne Ashford": ["—", "✓ 庄园纠纷", "—", "—", "—", "—", "—"],
    "Sophia Blackwood": ["—", "✓ 婚姻", "—", "—", "—", "—", "—"],
    "Marcus Thorne":    ["—", "✓ 代理终止", "—", "—", "—", "—", "—"],
    "Iris Chen":        ["—", "✓ 代笔暴露", "—", "—", "—", "—", "—"],
    "Julian Hartley":   ["—", "✓ 文学积怨", "—", "—", "—", "—", "—"],
    "Eleanor Wright":   ["✓ 00:48–01:02", "✓ Margaret 遗稿", "✓ 67 分钟空窗", "✓ Margaret + 领养档案", "✓ 'She knows' 备忘录", "✓ 21:40 约定", "✓ Margaret 之女"],
    "Henrik Volkov":    ["—", "✓ 批评积怨", "✓ ToD 离线", "—", "—", "—", "—"]
  };
  const cols = ["进入 ToD 书房","动机","Wi-Fi 空窗","图书借阅","文档关联","偷听约定","生物血缘"];
  const tbl = `<table>
    <thead><tr><th>嫌疑人</th>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${persons.map(p => `<tr class="${p==='Eleanor Wright'?'eleanor':''}"><td>${esc(p)}</td>${cells[p].map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;

  wrap.innerHTML = `<div class="case-closed">
    <h3>CASE STATUS · CLOSED</h3>
    <div class="status-line">七列证据全部命中。逮捕令于 2024 年 10 月 30 日下午签发。</div>
    <div class="seven-cols">${tbl}</div>
    <button class="narration-toggle" id="narration-toggle">展开 / 收起 终章叙事</button>
    <div class="narration" id="narration"><p>三年前，Eleanor Wright 接受 Elias Blackwood 的委托，为他立传。她翻档案、对手稿、读家书，从一封封被遗忘的信里拼出一个名字：Margaret Blackwood。1986 年坠井而亡的所谓"妹妹"，是她从未谋面的生母。</p>
    <p>10 月 19 日晚 21:40，她与 Elias 在主厅一角约定：今夜，宴会之后，档案室相见。22:30，Elias 在走廊冷漠回应——"你以为名字刻在大理石牌上就是家人了。"00:25，他亲手删除了东走廊的两段监控。00:38，他在笔记本上写下："Eleanor 十分钟后来。她知道了。"00:48，Eleanor 用传记作者的特权钥匙从档案室的连接门进入书房。01:02，她离开。01:35 她的手机重新连上 Wi-Fi——干净的，重整过的，回到了 304 房。</p>
    <p>八小时后，Sarah Whitcombe 推开书房的门。Elias 的笔记本盖着，记忆体在午夜过后被清空。所有可以摧毁的证据都摧毁了——除了一件：刷卡日志、Wi-Fi 会话和封存了四十四年的领养档案，谁也没有想过去碰。</p>
    <p>她不是恶人。她不是凶手的脸。她只是一个被告知自己不是"家人"的女儿。</p></div>
    <div class="dedication">献给 Margaret Blackwood · 1964 — 1986</div>
  </div>`;

  document.getElementById("narration-toggle").addEventListener("click", () => {
    document.getElementById("narration").classList.toggle("open");
  });
}

// ============================================================
// Topbar [CLOSED] tag
// ============================================================
function renderTopbarClosed() {
  const tag = document.querySelector(".case-id .closed-tag");
  if (tag) tag.classList.toggle("hidden", !isUnlocked(11));
}

// ============================================================
// Unlock rituals + cross-component cascades
// ============================================================
function applyUnlocks(playRituals) {
  // For each unlocked chapter that hasn't played its ritual yet, play once.
  for (let i = 1; i <= 11; i++) {
    if (!isUnlocked(i)) continue;
    if (playRituals && !BMM.rituals.has(i)) {
      playRitual(i);
      BMM.rituals.add(i);
    }
  }
  // Always re-render every section since unlock state may have changed
  renderSuspects();
  renderFloorplan();
  renderTimeline();
  renderFamilyTree();
  renderEvidenceCab();
  renderCCTVMatrix();
  renderConvos();
  renderCaseClosed();
  renderTopbarClosed();
}

function playRitual(ch) {
  // Many rituals naturally play via CSS animation on re-render (e.g. suspect flip-in).
  if (ch === 1) {
    // Cards already have animation. Scroll to the section.
    setTimeout(() => document.getElementById("section-suspects")?.scrollIntoView({behavior:"smooth"}), 400);
  } else if (ch === 2) {
    setTimeout(() => {
      const band = document.querySelector(".tl-tod-band");
      if (!band) return;
      let n = 0; const pulse = () => {
        if (n >= 3) return;
        band.classList.add("tl-tod-pulse");
        setTimeout(() => band.classList.remove("tl-tod-pulse"), 200);
        n++; setTimeout(pulse, 400);
      }; pulse();
    }, 200);
  } else if (ch === 4) {
    setTimeout(() => {
      const cellar = document.querySelector(`.fp-room[data-room="401"]`);
      cellar?.classList.add("cellar-flash");
    }, 200);
  } else if (ch === 9) {
    // Family tree reveal animation
    setTimeout(() => {
      const banner = document.getElementById("ft-banner");
      if (banner) {
        banner.classList.add("show");
        setTimeout(() => banner.classList.remove("show"), 3500);
      }
      // Animate sealed path
      const p = document.getElementById("ft-sealed-path");
      if (p) {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len + " " + len;
        p.style.strokeDashoffset = len;
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 1.2s ease-out";
        p.style.strokeDashoffset = "0";
      }
    }, 200);
  } else if (ch === 10) {
    // Typewriter on Memo row
    setTimeout(() => {
      const cells = document.querySelectorAll(".ev-panel[data-tab='docs'] tr.deleted td.preview-cell");
      cells.forEach(cell => typewriter(cell, cell.textContent));
    }, 300);
  } else if (ch === 11) {
    showStampOverlay();
  }
}
function typewriter(el, text) {
  el.textContent = "";
  let i = 0;
  const id = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(id);
  }, 18);
}
function showStampOverlay() {
  let ov = document.getElementById("stamp-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "stamp-overlay"; ov.className = "stamp-overlay";
    ov.innerHTML = `<div class="stamp">CASE CLOSED</div>`;
    document.body.appendChild(ov);
  }
  setTimeout(() => ov.classList.add("show"), 30);
  const dismiss = () => { ov.classList.remove("show"); setTimeout(() => ov.remove(), 400); window.removeEventListener("keydown", dismiss); ov.removeEventListener("click", dismiss); };
  setTimeout(() => {
    // Auto-dismiss after 1.6s
    dismiss();
    setTimeout(() => {
      document.getElementById("section-case-closed")?.scrollIntoView({behavior:"smooth"});
    }, 600);
  }, 1600);
  window.addEventListener("keydown", dismiss, { once: true });
  ov.addEventListener("click", dismiss, { once: true });
}

// ============================================================
// Global handlers
// ============================================================
function bindGlobalHandlers() {
  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("确定要清空所有进度吗？此操作不可撤销。")) {
      localStorage.removeItem(LS_KEY);
      location.reload();
    }
  });
  // Jump CTAs in locked panels
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("[data-jump]");
    if (!btn) return;
    BMM.currentTab = parseInt(btn.dataset.jump, 10);
    renderSandbox();
    document.getElementById("section-sql").scrollIntoView({behavior:"smooth"});
  });
  // Notebook
  const fab = document.getElementById("notebook-fab");
  const panel = document.getElementById("notebook-panel");
  const ta = document.getElementById("notebook-text");
  ta.value = BMM.state.notes || "";
  ta.addEventListener("input", () => { BMM.state.notes = ta.value; saveState(); });
  fab.addEventListener("click", () => panel.classList.toggle("open"));
  document.getElementById("notebook-close").addEventListener("click", () => panel.classList.remove("open"));
}

// ============================================================
// Helpers
// ============================================================
function runRows(sql) {
  try {
    const r = BMM.db.exec(sql);
    if (!r.length) return [];
    return r[0].values;
  } catch (e) {
    console.warn("SQL helper failed:", sql, e);
    return [];
  }
}
function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function lockedPanel(needCh, label) {
  return `<div class="locked-panel">
    <div class="lock-icon">🔒</div>
    <div>${esc(label)}</div>
    <button class="lock-cta" data-jump="${needCh}">→ 跳到 SQL 沙盘第 ${needCh} 章</button>
  </div>`;
}
function lockedPanelInline(needCh) {
  return `<div class="locked-panel" style="margin:0; padding:24px;">
    <div class="lock-icon">🔒</div>
    <div>完成第 ${needCh} 章查询以解锁此 tab</div>
    <button class="lock-cta" data-jump="${needCh}">→ 跳到第 ${needCh} 章</button>
  </div>`;
}

// Boot when DOM ready
document.addEventListener("DOMContentLoaded", boot);
