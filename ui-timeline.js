// ============================================================
// Section D — Timeline SVG
// ============================================================

BM.TIMELINE = {
  startMin: 18 * 60,     // Sat 18:00
  endMin: 27 * 60,       // Sun 03:00 (next day = 24+3 = 27h from Sat 00:00)
  todStart: 24 * 60 + 30,// Sun 00:30
  todEnd: 25 * 60 + 30,  // Sun 01:30
  padLeft: 110,
  padRight: 24,
  padTop: 50,
  trackH: 38,
  width: 1180,
  cursorMin: 24 * 60 + 48 // Sun 00:48 — initial position is the Eleanor entry (interesting moment)
};

// minute calc — accepts '2024-10-19 23:15' or '2024-10-20 00:48'
function minOf(timeStr) {
  if (!timeStr) return null;
  const [d, t] = timeStr.split(' ');
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const day = d.split('-')[2]; // 19 or 20
  const offset = day === '20' ? 24 * 60 : 0;
  return offset + h * 60 + m;
}
function minToLabel(min) {
  const day = min >= 24 * 60 ? 'Sun' : 'Sat';
  let h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${day} ${String(h).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}`;
}

BM.TRACKS = [
  { pid: 1,  label: 'Elias Blackwood', color: '#a0392e' },
  { pid: 2,  label: 'Vivienne Ashford' },
  { pid: 3,  label: 'Sophia Blackwood' },
  { pid: 4,  label: 'Marcus Thorne' },
  { pid: 5,  label: 'Iris Chen' },
  { pid: 6,  label: 'Julian Hartley' },
  { pid: 7,  label: 'Eleanor Wright' },
  { pid: 8,  label: 'Henrik Volkov' },
  { pid: 'staff', label: 'Staff', pids: [9, 10, 11, 12, 13] }
];

BM.renderTimeline = function() {
  const mount = document.getElementById('timeline-mount');
  if (!BM.isUnlocked(2)) {
    mount.innerHTML = BM.lockedBlock(2, '时间线待解锁');
    return;
  }

  const T = BM.TIMELINE;
  const w = T.width;
  const contentW = w - T.padLeft - T.padRight;
  const h = T.padTop + BM.TRACKS.length * T.trackH + 30;
  const minToX = m => T.padLeft + ((m - T.startMin) / (T.endMin - T.startMin)) * contentW;

  // Gather data
  const keycards = BM.queryAll(`SELECT * FROM KeycardAccess`);
  const smses = BM.isUnlocked(3) ? BM.queryAll(`SELECT * FROM PhoneRecords WHERE RecordType='SMS' OR RecordType='Call'`) : [];
  const wines = BM.isUnlocked(4) ? BM.queryAll(`SELECT * FROM WineCellarLog`) : [];
  const wifis = BM.isUnlocked(6) ? BM.queryAll(`SELECT * FROM WiFiSessions`) : [];
  const convs = BM.isUnlocked(7) ? BM.queryAll(`SELECT * FROM Conversations`) : [];

  function trackForPid(pid) {
    for (let i = 0; i < BM.TRACKS.length; i++) {
      const t = BM.TRACKS[i];
      if (t.pid === pid) return i;
      if (t.pids && t.pids.includes(pid)) return i;
    }
    return -1;
  }

  let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" preserveAspectRatio="xMidYMid meet">`;

  // ToD band
  const todX1 = minToX(T.todStart);
  const todX2 = minToX(T.todEnd);
  svg += `<rect class="tl-tod-band" x="${todX1}" y="${T.padTop - 16}" width="${todX2 - todX1}" height="${h - T.padTop + 16 - 18}"/>`;
  svg += `<text class="tl-tod-label" x="${(todX1 + todX2) / 2}" y="${T.padTop - 22}" text-anchor="middle">TIME OF DEATH WINDOW · 00:30 – 01:30</text>`;

  // Hour gridlines + labels
  for (let m = T.startMin; m <= T.endMin; m += 60) {
    const x = minToX(m);
    svg += `<line class="tl-hourline" x1="${x}" y1="${T.padTop}" x2="${x}" y2="${h - 20}"/>`;
    const lbl = minToLabel(m);
    svg += `<text class="tl-hour-label" x="${x}" y="${h - 6}" text-anchor="middle">${lbl}</text>`;
  }

  // Tracks
  BM.TRACKS.forEach((tr, i) => {
    const y = T.padTop + i * T.trackH;
    svg += `<rect class="tl-track-bg" x="${T.padLeft}" y="${y + 6}" width="${contentW}" height="${T.trackH - 8}" fill-opacity="${i === 6 ? 0.3 : 0.15}"/>`;
    svg += `<text class="tl-track-label" x="${T.padLeft - 10}" y="${y + 24}" text-anchor="end">${escapeHtml(tr.label)}</text>`;
  });

  // WiFi segments (background-level)
  wifis.forEach(w => {
    const ti = trackForPid(w.PersonID);
    if (ti < 0) return;
    const m1 = minOf(w.StartTime);
    const m2 = minOf(w.EndTime) || (T.endMin);
    if (m1 == null) return;
    const x1 = minToX(m1), x2 = minToX(m2);
    const y = T.padTop + ti * T.trackH + 18;
    svg += `<line class="tl-evt tl-evt-wifi" data-tip='${encEvtTip('WiFi 会话', w.PersonID, w.StartTime, `${w.EndTime || '?'} · ${w.DataMB} MB · AP Room ${w.APRoomID} · ${w.DeviceType}`)}' x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="3" stroke-linecap="round" data-m="${m1}"/>`;
  });

  // Keycard events
  keycards.forEach(k => {
    const ti = trackForPid(k.PersonID);
    if (ti < 0) return;
    const m = minOf(k.AccessTime);
    if (m == null) return;
    const x = minToX(m);
    const y = T.padTop + ti * T.trackH + 22;
    let cls = 'tl-evt tl-evt-keycard-grant';
    if (k.Granted == 0) cls = 'tl-evt tl-evt-keycard-deny';
    if (k.AccessType === 'Override') cls = 'tl-evt tl-evt-keycard-override';
    svg += `<circle class="${cls}" data-tip='${encEvtTip('🚪 ' + k.AccessType + (k.Granted == 0 ? ' (DENIED)' : ''), k.PersonID, k.AccessTime, `Room #${k.RoomID}${k.Notes ? ' · ' + k.Notes : ''}`)}' cx="${x}" cy="${y}" r="4" data-m="${m}"/>`;
  });

  // SMS / Call dots
  smses.forEach(s => {
    const ti = trackForPid(s.FromPersonID);
    if (ti < 0) return;
    const m = minOf(s.StartTime);
    if (m == null) return;
    const x = minToX(m);
    const y = T.padTop + ti * T.trackH + 10;
    svg += `<rect class="tl-evt tl-evt-sms" data-tip='${encEvtTip('💬 ' + s.RecordType, s.FromPersonID, s.StartTime, (s.ToName || s.ToNumber) + (s.Content ? ' · "' + s.Content + '"' : ''))}' x="${x - 3}" y="${y - 3}" width="6" height="6" data-m="${m}"/>`;
  });

  // Wine dots
  wines.forEach(w => {
    const ti = trackForPid(w.TakenByPersonID);
    if (ti < 0) return;
    const m = minOf(w.AccessTime);
    if (m == null) return;
    const x = minToX(m);
    const y = T.padTop + ti * T.trackH + 30;
    svg += `<polygon class="tl-evt tl-evt-wine" data-tip='${encEvtTip('🍷 取酒', w.TakenByPersonID, w.AccessTime, 'Bottle #' + w.BottleID)}' points="${x},${y - 4} ${x + 4},${y + 3} ${x - 4},${y + 3}" data-m="${m}"/>`;
  });

  // Conversation dots — placed on speaker's track
  convs.forEach(c => {
    const ti = trackForPid(c.SpeakerID);
    if (ti < 0) return;
    const m = minOf(c.SpokenTime);
    if (m == null) return;
    const x = minToX(m);
    const y = T.padTop + ti * T.trackH + 34;
    svg += `<circle class="tl-evt tl-evt-overheard" data-tip='${encEvtTip('🎙️ 偷听', c.SpeakerID, c.SpokenTime, '"' + c.Snippet + '"')}' cx="${x}" cy="${y}" r="3" data-m="${m}"/>`;
  });

  // Cursor
  const cx = minToX(T.cursorMin);
  svg += `<line id="tl-cursor-line" class="tl-cursor-line" x1="${cx}" y1="${T.padTop - 18}" x2="${cx}" y2="${h - 22}"/>`;
  svg += `<polygon id="tl-cursor-handle" class="tl-cursor-handle" points="${cx - 7},${T.padTop - 32} ${cx + 7},${T.padTop - 32} ${cx},${T.padTop - 18}"/>`;

  svg += '</svg>';

  // Legend
  let legend = `<div class="fp-legend" style="margin-top: 10px;">
    <span><span class="swatch" style="background:#6da369;border-color:#6da369;"></span>Keycard (granted)</span>
    <span><span class="swatch" style="background:var(--accent-warn);border-color:var(--accent-warn);"></span>Denied</span>
    <span><span class="swatch" style="background:var(--accent-clue);border-color:var(--accent-clue);"></span>Override</span>`;
  if (BM.isUnlocked(3)) legend += `<span><span class="swatch" style="background:#d9b945;border-color:#d9b945;"></span>SMS/Call</span>`;
  if (BM.isUnlocked(4)) legend += `<span><span class="swatch" style="background:#9c6bb0;border-color:#9c6bb0;"></span>Wine</span>`;
  if (BM.isUnlocked(6)) legend += `<span><span class="swatch" style="background:#5f9bd8;border-color:#5f9bd8;"></span>WiFi 段</span>`;
  if (BM.isUnlocked(7)) legend += `<span><span class="swatch" style="background:#e07a3a;border-color:#e07a3a;"></span>偷听</span>`;
  legend += '</div>';

  const layersText = [];
  if (BM.isUnlocked(2)) layersText.push('🚪 keycard');
  if (BM.isUnlocked(3)) layersText.push('💬 SMS');
  if (BM.isUnlocked(4)) layersText.push('🍷 wine');
  if (BM.isUnlocked(6)) layersText.push('📱 WiFi');
  if (BM.isUnlocked(7)) layersText.push('🎙️ overheard');
  let pendingLayers = [];
  if (!BM.isUnlocked(3)) pendingLayers.push('Ch 3 → 💬 SMS');
  if (!BM.isUnlocked(4)) pendingLayers.push('Ch 4 → 🍷 wine');
  if (!BM.isUnlocked(6)) pendingLayers.push('Ch 6 → 📱 WiFi');
  if (!BM.isUnlocked(7)) pendingLayers.push('Ch 7 → 🎙️ overheard');

  mount.innerHTML = `
    <div class="timeline-wrap fade-in">
      <div class="tl-controls">
        <span>🎯 拖动顶部三角游标查看 ±15 分钟内的事件 (其它会变暗)</span>
        <span class="tl-cursor-readout" id="tl-cursor-readout">${minToLabel(T.cursorMin)}</span>
        ${pendingLayers.length ? `<span style="color:var(--text-faint);">未解锁层: ${pendingLayers.join(', ')}</span>` : ''}
      </div>
      ${svg}
      ${legend}
    </div>
  `;

  // Bind tooltips & cursor drag
  BM.bindTimelineInteractions(minToX);
};

function encEvtTip(title, pid, time, body) {
  const name = (BM.queryAll(`SELECT FullName FROM Persons WHERE PersonID = ${pid}`)[0] || {}).FullName || '';
  return escapeHtml(JSON.stringify({ t: title, p: name, ti: time, b: body }));
}

BM.bindTimelineInteractions = function(minToX) {
  const tt = document.getElementById('tl-tooltip');
  const evts = document.querySelectorAll('.tl-evt');
  evts.forEach(e => {
    e.addEventListener('mousemove', ev => {
      try {
        const d = JSON.parse(e.dataset.tip);
        tt.innerHTML = `<div class="tt-h">${escapeHtml(d.t)}</div>
          <div><b>${escapeHtml(d.p)}</b> @ ${escapeHtml(d.ti)}</div>
          <div style="margin-top:4px;color:var(--text-dim);">${escapeHtml(d.b)}</div>`;
        tt.style.display = 'block';
        tt.style.left = (ev.clientX + 14) + 'px';
        tt.style.top = (ev.clientY + 10 + window.scrollY) + 'px';
      } catch (err) {}
    });
    e.addEventListener('mouseleave', () => { tt.style.display = 'none'; });
  });

  // Cursor dragging
  const T = BM.TIMELINE;
  const svg = document.querySelector('#timeline-mount svg');
  const line = document.getElementById('tl-cursor-line');
  const handle = document.getElementById('tl-cursor-handle');
  const readout = document.getElementById('tl-cursor-readout');
  if (!svg || !line || !handle) return;

  let dragging = false;
  const updateCursor = (m) => {
    m = Math.max(T.startMin, Math.min(T.endMin, m));
    T.cursorMin = m;
    const x = minToX(m);
    line.setAttribute('x1', x);
    line.setAttribute('x2', x);
    handle.setAttribute('points', `${x - 7},${T.padTop - 32} ${x + 7},${T.padTop - 32} ${x},${T.padTop - 18}`);
    readout.textContent = minToLabel(m);
    // Dim non-nearby events
    document.querySelectorAll('.tl-evt').forEach(e => {
      const em = +e.dataset.m;
      if (Math.abs(em - m) > 15) e.classList.add('dim');
      else e.classList.remove('dim');
    });
  };
  updateCursor(T.cursorMin);

  const onMove = (ev) => {
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const xScale = svg.viewBox.baseVal.width / rect.width;
    const xInSvg = (ev.clientX - rect.left) * xScale;
    const m = T.startMin + ((xInSvg - T.padLeft) / (T.width - T.padLeft - T.padRight)) * (T.endMin - T.startMin);
    updateCursor(m);
  };
  handle.addEventListener('mousedown', () => { dragging = true; });
  svg.addEventListener('click', (ev) => {
    if (dragging) return;
    const rect = svg.getBoundingClientRect();
    const xScale = svg.viewBox.baseVal.width / rect.width;
    const xInSvg = (ev.clientX - rect.left) * xScale;
    if (xInSvg < T.padLeft) return;
    const m = T.startMin + ((xInSvg - T.padLeft) / (T.width - T.padLeft - T.padRight)) * (T.endMin - T.startMin);
    updateCursor(m);
  });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', () => { dragging = false; });
};
