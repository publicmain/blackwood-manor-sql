// ============================================================
// Section C — Floor plan SVG
// ============================================================

BM.FLOORS = [
  {
    label: 'Floor 3 — Guest Wing',
    rooms: [
      { id: 301, name: 'Thorne',   x: 60,  y: 40, w: 110, h: 70 },
      { id: 302, name: 'Chen',     x: 175, y: 40, w: 110, h: 70 },
      { id: 303, name: 'Hartley',  x: 290, y: 40, w: 110, h: 70 },
      { id: 304, name: 'Wright',   x: 405, y: 40, w: 110, h: 70, highlight: 'subtle' },
      { id: 305, name: 'Volkov',   x: 520, y: 40, w: 110, h: 70 },
      { id: 604, name: 'Guest Corridor', x: 60, y: 115, w: 570, h: 20 }
    ]
  },
  {
    label: 'Floor 2',
    rooms: [
      { id: 201, name: 'Ashford Suite', x: 60,  y: 40, w: 130, h: 80 },
      { id: 603, name: 'West Corridor', x: 195, y: 40, w: 100, h: 80 },
      { id: 101, name: 'Master (Elias)', x: 320, y: 40, w: 110, h: 70 },
      { id: 102, name: 'Annex (Sophia)', x: 435, y: 40, w: 110, h: 70 },
      { id: 405, name: 'Archive',        x: 550, y: 40, w: 110, h: 70 },
      { id: 103, name: 'Study',          x: 435, y: 115, w: 110, h: 70, scene: true },
      { id: 406, name: '↔', x: 545, y: 132, w: 8, h: 30, connecting: true },
      { id: 602, name: 'East Corridor',  x: 320, y: 190, w: 340, h: 22 }
    ]
  },
  {
    label: 'Floor 1 — Main / Grounds',
    rooms: [
      { id: 104, name: 'Library',     x: 60,  y: 40, w: 130, h: 70 },
      { id: 105, name: 'Drawing Rm',  x: 195, y: 40, w: 110, h: 70 },
      { id: 403, name: 'Dining Hall', x: 310, y: 40, w: 140, h: 70 },
      { id: 404, name: 'Conservatory',x: 455, y: 40, w: 130, h: 70 },
      { id: 402, name: 'Kitchen',     x: 590, y: 40, w: 90,  h: 70 },
      { id: 601, name: 'Main Hall',   x: 60,  y: 115, w: 525, h: 22 },
      { id: 502, name: 'Staff Quarters', x: 590, y: 115, w: 90, h: 35 },
      { id: 501, name: 'Garden Cottage', x: 60, y: 155, w: 130, h: 38 }
    ]
  },
  {
    label: 'Sub — Cellar',
    rooms: [
      { id: 401, name: 'Wine Cellar', x: 290, y: 30, w: 160, h: 40 }
    ]
  }
];

BM.renderFloorplan = function() {
  const mount = document.getElementById('floorplan-mount');
  if (!BM.isUnlocked(1)) {
    mount.innerHTML = BM.lockedBlock(1, '平面图待解锁');
    return;
  }

  const ch8 = BM.isUnlocked(8);
  const rooms = BM.queryAll(`SELECT * FROM Rooms`).reduce((m, r) => { m[r.RoomID] = r; return m; }, {});

  // Get people in rooms during ToD (visible after Ch 6)
  const peopleByRoom = {};
  if (BM.isUnlocked(6)) {
    const evts = BM.queryAll(`
      SELECT k.RoomID, p.FullName, k.AccessTime
      FROM KeycardAccess k JOIN Persons p ON k.PersonID = p.PersonID
      WHERE k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
        AND k.AccessType IN ('Entry','Override')
    `);
    evts.forEach(e => {
      if (!peopleByRoom[e.RoomID]) peopleByRoom[e.RoomID] = [];
      peopleByRoom[e.RoomID].push(`${e.FullName} @ ${e.AccessTime.split(' ')[1]}`);
    });
  }

  let html = `<div class="floorplan-wrap fade-in">
    <div class="fp-legend">
      <span><span class="swatch" style="background:rgba(160,57,46,0.15);border-color:var(--accent-warn);"></span>案发现场</span>
      ${ch8 ? '<span><span class="swatch" style="border-color:var(--accent-warn);border-style:dashed;background:transparent;"></span>无 CCTV</span>' : ''}
      ${ch8 ? '<span><span class="swatch" style="background:rgba(160,57,46,0.2);border-color:var(--accent-warn);"></span>CCTV 被删</span>' : ''}
      ${ch8 ? '<span><span class="swatch" style="border-color:var(--accent-clue);border-style:dashed;background:rgba(184,153,104,0.1);"></span>档案室↔书房 私人连接门</span>' : ''}
    </div>
  `;

  BM.FLOORS.forEach((floor, fi) => {
    const isSub = floor.label.includes('Sub');
    const isF3 = floor.label.includes('3');
    let svgH = isSub ? 90 : (isF3 ? 150 : 220);
    if (fi === 2) svgH = 210;
    html += `<div style="margin-bottom: 16px;">
      <svg viewBox="0 0 720 ${svgH}" preserveAspectRatio="xMidYMid meet">
        <text class="floor-label" x="10" y="20">${floor.label}</text>
    `;
    floor.rooms.forEach(r => {
      const meta = rooms[r.id] || {};
      let cls = 'room';
      if (r.scene) cls += ' scene';
      if (r.connecting) {
        if (ch8) cls += ' connecting';
        else return; // hide until Ch 8
      }
      if (ch8 && meta.HasCCTV === 0 && !r.scene && !r.connecting) cls += ' no-cctv';
      // CCTV deleted = East Corridor 602
      if (ch8 && r.id === 602) cls += ' deleted-cctv';

      html += `<g class="${cls}" data-rid="${r.id}">
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" />`;
      if (!r.connecting) {
        const cy = r.y + 22;
        const cy2 = r.y + r.h - 8;
        html += `<text x="${r.x + 8}" y="${cy}" class="rn">#${r.id}</text>`;
        html += `<text x="${r.x + 8}" y="${cy + 14}">${escapeHtml(r.name)}</text>`;
        if (r.scene) {
          html += `<text x="${r.x + r.w - 22}" y="${cy2 + 2}" class="ic">🩸</text>`;
        }
        if (ch8 && meta.HasCCTV === 1 && r.id !== 602) {
          html += `<text x="${r.x + r.w - 24}" y="${r.y + 16}" style="font-size:10px;fill:#6da369;">📹</text>`;
        }
      }
      html += `</g>`;
    });
    html += `</svg></div>`;
  });

  html += '</div>';
  mount.innerHTML = html;

  // Tooltips
  const tt = document.getElementById('fp-tooltip');
  mount.querySelectorAll('.room').forEach(g => {
    g.addEventListener('mousemove', e => {
      const rid = +g.dataset.rid;
      const room = rooms[rid] || {};
      let body = '';
      body += `<div class="tt-name">${escapeHtml(room.Name || '?')} <span style="color:var(--text-faint)">#${rid}</span></div>`;
      body += `<div class="tt-row">Wing: <b>${escapeHtml(room.Wing || '')}</b> · Floor ${room.Floor}</div>`;
      if (ch8) {
        body += `<div class="tt-row">CCTV: <b>${room.HasCCTV ? 'Yes' : 'No'}</b> · Keycard: <b>${room.HasKeycard ? 'Yes' : 'No'}</b></div>`;
        if (rid === 602) body += `<div class="tt-row" style="color:var(--accent-warn);">⚠ 00:00–02:00 段录像已删除 by Elias 自己 (00:25)</div>`;
        if (rid === 406) body += `<div class="tt-row" style="color:var(--accent-clue);">⚠ 私人连接门 · 无 CCTV · 仅 Elias 与 授权传记作者持卡</div>`;
      }
      if (rid === 103) body += `<div class="tt-row" style="color:var(--accent-warn);">🩸 案发现场</div>`;
      const peeps = peopleByRoom[rid] || [];
      if (peeps.length > 0 && BM.isUnlocked(6)) {
        body += `<div class="tt-row" style="margin-top:6px;color:var(--accent-clue);">ToD 期间访问者:</div>`;
        peeps.forEach(p => { body += `<div class="tt-row" style="font-size:10px;">· ${escapeHtml(p)}</div>`; });
      }
      tt.innerHTML = body;
      tt.style.display = 'block';
      const r = mount.getBoundingClientRect();
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top = (e.clientY + 10 + window.scrollY) + 'px';
    });
    g.addEventListener('mouseleave', () => { tt.style.display = 'none'; });
  });
};
