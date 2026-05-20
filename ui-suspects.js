// ============================================================
// Section B — Suspect cards
// ============================================================

BM.SUSPECT_IDS = [2, 3, 4, 5, 6, 7, 8]; // Guest persons

BM.renderSuspects = function() {
  const mount = document.getElementById('suspects-mount');
  if (!BM.isUnlocked(1)) {
    mount.innerHTML = BM.lockedBlock(1, '名册待解锁');
    return;
  }

  const persons = BM.queryAll(`SELECT * FROM Persons WHERE PersonID IN (${BM.SUSPECT_IDS.join(',')}) ORDER BY PersonID`);
  const rooms = BM.queryMap(`SELECT RoomID, Name FROM Rooms`, 'RoomID', 'Name');

  let html = '<div class="suspects-grid fade-in">';
  persons.forEach(p => {
    html += BM.renderSuspectCard(p, rooms);
  });
  html += '</div>';
  mount.innerHTML = html;

  // bind toggle + mark buttons
  mount.querySelectorAll('[data-action="toggle-ev"]').forEach(b => {
    b.onclick = () => {
      const pid = b.dataset.pid;
      const pane = mount.querySelector(`#ev-${pid}`);
      const shown = pane.style.display === 'block';
      pane.style.display = shown ? 'none' : 'block';
      b.textContent = shown ? '▸ 展开证据' : '▾ 收起证据';
    };
  });
  mount.querySelectorAll('[data-action="mark"]').forEach(b => {
    b.onclick = () => {
      const pid = b.dataset.pid;
      const val = b.dataset.val;
      if (BM.state.marks[pid] === val) {
        delete BM.state.marks[pid];
      } else {
        BM.state.marks[pid] = val;
      }
      BM.saveState();
      BM.renderSuspects();
    };
  });
};

// SQL helpers
BM.queryAll = function(sql) {
  const r = BM.runQuery(sql);
  if (r.error) { console.warn('queryAll err', sql, r.error); return []; }
  if (!r.cols || !r.cols.length) return [];
  return r.rows.map(row => {
    const obj = {};
    r.cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
};
BM.queryMap = function(sql, kCol, vCol) {
  const rows = BM.queryAll(sql);
  const m = {};
  rows.forEach(r => { m[r[kCol]] = r[vCol]; });
  return m;
};

BM.renderSuspectCard = function(p, rooms) {
  const initials = p.FullName.split(' ').map(w => w[0]).join('').slice(0, 2);
  const roomName = rooms[p.RoomID] || '—';
  const mark = BM.state.marks[p.PersonID] || '';
  const markBtn = (val, label) => {
    const active = mark === val ? ' active ' + val : '';
    return `<button class="mark-btn${active}" data-action="mark" data-pid="${p.PersonID}" data-val="${val}">${label}</button>`;
  };

  return `
  <div class="suspect-card fade-in">
    <div class="head">
      <div class="avatar">${initials}</div>
      <div>
        <div class="name">${escapeHtml(p.FullName)}</div>
        <div class="meta">${p.Age} · ${escapeHtml(p.Occupation || '')}</div>
      </div>
      <div class="id">#P${String(p.PersonID).padStart(2, '0')}</div>
    </div>
    <div class="body">
      <div class="row"><span class="k">Relation</span><span class="v">${escapeHtml(p.RelationToElias || '—')}</span></div>
      <div class="row"><span class="k">Room</span><span class="v">${p.RoomID} · ${escapeHtml(roomName)}</span></div>
      <div class="row"><span class="k">Type</span><span class="v">${escapeHtml(p.PersonType)}</span></div>
      ${p.Notes ? `<div class="notes-pub">${escapeHtml(p.Notes)}</div>` : ''}
    </div>
    <div class="actions">
      <button class="evidence-toggle" data-action="toggle-ev" data-pid="${p.PersonID}">▸ 展开证据</button>
      <div class="mark-group">
        ${markBtn('pending', '待查')}
        ${markBtn('suspect', '怀疑')}
        ${markBtn('cleared', '排除')}
      </div>
    </div>
    <div class="evidence-pane" id="ev-${p.PersonID}" style="display:none;">
      ${BM.renderEvidencePane(p.PersonID)}
    </div>
  </div>
  `;
};

BM.renderEvidencePane = function(pid) {
  let html = '';

  // Ch 2 — Keycard events
  if (BM.isUnlocked(2)) {
    const events = BM.queryAll(`
      SELECT k.AccessTime, k.AccessType, k.Granted, r.Name AS RoomName, r.RoomID, k.Notes
      FROM KeycardAccess k JOIN Rooms r ON k.RoomID = r.RoomID
      WHERE k.PersonID = ${pid}
      ORDER BY k.AccessTime
    `);
    html += `<div class="ev-section"><h5>🚪 Keycard 出入</h5>`;
    if (events.length === 0) {
      html += `<div style="color:var(--text-faint);">无记录</div>`;
    } else {
      html += '<ul>';
      events.forEach(e => {
        const granted = e.Granted == 0 ? '<span style="color:var(--accent-warn)">[DENIED]</span> ' : '';
        const t = e.AccessTime.split(' ')[1] || e.AccessTime;
        html += `<li><span class="ev-time">${t}</span>${granted}${escapeHtml(e.AccessType)} → ${escapeHtml(e.RoomName)} <span class="muted">#${e.RoomID}</span>${e.Notes ? '<br><span class="muted" style="font-size:11px;">'+escapeHtml(e.Notes)+'</span>' : ''}</li>`;
      });
      html += '</ul>';
    }
    html += '</div>';
  } else {
    html += `<div class="ev-locked">🔒 keycard 数据待 Ch 2 解锁</div>`;
  }

  // Ch 3 — SMS / phone
  if (BM.isUnlocked(3)) {
    const calls = BM.queryAll(`SELECT * FROM PhoneRecords WHERE FromPersonID = ${pid} ORDER BY StartTime`);
    html += `<div class="ev-section"><h5>💬 通讯</h5>`;
    if (calls.length === 0) {
      html += `<div style="color:var(--text-faint);">无记录</div>`;
    } else {
      html += '<ul>';
      calls.forEach(c => {
        const t = c.StartTime.split(' ')[1] || c.StartTime;
        const to = c.ToName ? escapeHtml(c.ToName) : escapeHtml(c.ToNumber);
        const body = c.Content ? `<br><span style="font-family:var(--serif);font-style:italic;color:var(--text-main)">"${escapeHtml(c.Content)}"</span>` : (c.DurationSec ? ` (${c.DurationSec}s call)` : '');
        html += `<li><span class="ev-time">${t}</span><span class="muted">[${c.RecordType}]</span> → ${to}${body}</li>`;
      });
      html += '</ul>';
    }
    html += '</div>';
  } else {
    html += `<div class="ev-locked">🔒 通讯记录待 Ch 3 解锁</div>`;
  }

  // Ch 4 — Wine
  if (BM.isUnlocked(4)) {
    const wines = BM.queryAll(`
      SELECT w.AccessTime, b.Label, b.Vintage
      FROM WineCellarLog w JOIN WineBottles b ON w.BottleID = b.BottleID
      WHERE w.TakenByPersonID = ${pid}
      ORDER BY w.AccessTime
    `);
    if (wines.length > 0) {
      html += `<div class="ev-section"><h5>🍷 酒窖取酒</h5><ul>`;
      wines.forEach(w => {
        html += `<li><span class="ev-time">${w.AccessTime.split(' ')[1] || w.AccessTime}</span>${escapeHtml(w.Label)} (${w.Vintage})</li>`;
      });
      html += '</ul></div>';
    }
  }

  // Ch 5 — Library
  if (BM.isUnlocked(5)) {
    const books = BM.queryAll(`
      SELECT b.Title, b.Author, c.CheckoutDate, c.ReturnDate
      FROM LibraryCheckouts c JOIN Books b ON c.BookID = b.BookID
      WHERE c.PersonID = ${pid}
      ORDER BY c.CheckoutDate
    `);
    if (books.length > 0) {
      html += `<div class="ev-section"><h5>📖 借阅历史 (${books.length})</h5><ul>`;
      books.forEach(b => {
        const ret = b.ReturnDate ? `→ ${b.ReturnDate}` : '<span style="color:var(--accent-warn)">[未归还]</span>';
        html += `<li><span class="ev-time">${b.CheckoutDate}</span> <i>${escapeHtml(b.Title)}</i> <span class="muted">— ${escapeHtml(b.Author)}</span> ${ret}</li>`;
      });
      html += '</ul></div>';
    }
  }

  // Ch 6 — WiFi
  if (BM.isUnlocked(6)) {
    const wifi = BM.queryAll(`
      SELECT w.StartTime, w.EndTime, w.DataMB, r.Name AS RoomName
      FROM WiFiSessions w JOIN Rooms r ON w.APRoomID = r.RoomID
      WHERE w.PersonID = ${pid}
      ORDER BY w.StartTime
    `);
    if (wifi.length > 0) {
      html += `<div class="ev-section"><h5>📱 WiFi 会话</h5><ul>`;
      wifi.forEach(w => {
        const st = (w.StartTime || '').split(' ')[1] || w.StartTime;
        const et = w.EndTime ? ((w.EndTime).split(' ')[1] || w.EndTime) : '?';
        html += `<li><span class="ev-time">${st}–${et}</span>${escapeHtml(w.RoomName)} (${w.DataMB} MB)</li>`;
      });
      html += '</ul></div>';
    }
  }

  // Ch 7 — Overheard
  if (BM.isUnlocked(7)) {
    const convs = BM.queryAll(`
      SELECT c.SpokenTime, c.Snippet, c.RoomID, r.Name AS RoomName,
             sp.FullName AS Speaker, ls.FullName AS Listener
      FROM Conversations c
      JOIN Persons sp ON c.SpeakerID = sp.PersonID
      LEFT JOIN Persons ls ON c.ListenerID = ls.PersonID
      JOIN Rooms r ON c.RoomID = r.RoomID
      WHERE c.SpeakerID = ${pid} OR c.ListenerID = ${pid}
      ORDER BY c.SpokenTime
    `);
    if (convs.length > 0) {
      html += `<div class="ev-section"><h5>🎙️ 偷听对话 (${convs.length})</h5>`;
      convs.forEach(c => {
        const role = c.Speaker === undefined ? '' : (BM.SUSPECT_IDS.includes(pid) && c.Speaker.includes('Wright')) ? '' : '';
        html += `<div style="margin: 6px 0; padding: 6px 8px; background: rgba(0,0,0,0.15); border-left: 2px solid var(--accent-clue-dim);">
          <div class="ev-time">${c.SpokenTime}</div>
          <div style="font-family:var(--serif);font-style:italic;color:var(--text-main);font-size:12.5px;">"${escapeHtml(c.Snippet)}"</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-dim);margin-top:3px;">— ${escapeHtml(c.Speaker)} → ${c.Listener ? escapeHtml(c.Listener) : '(无指定听众)'} @ ${escapeHtml(c.RoomName)}</div>
        </div>`;
      });
      html += '</div>';
    }
  }

  // Ch 8 — CCTV coverage (for whichever rooms this person traversed)
  if (BM.isUnlocked(8)) {
    const rooms = BM.queryAll(`
      SELECT DISTINCT r.Name, r.HasCCTV, r.RoomID
      FROM KeycardAccess k JOIN Rooms r ON k.RoomID = r.RoomID
      WHERE k.PersonID = ${pid}
    `);
    if (rooms.length > 0) {
      html += `<div class="ev-section"><h5>📹 经过的房间监控情况</h5><ul>`;
      rooms.forEach(r => {
        const c = r.HasCCTV == 1 ? '<span style="color:#6da369">✓ 有 CCTV</span>' : '<span style="color:var(--text-faint)">✗ 无 CCTV</span>';
        html += `<li>${escapeHtml(r.Name)} <span class="muted">#${r.RoomID}</span> — ${c}</li>`;
      });
      html += '</ul></div>';
    }
  }

  // Ch 9 — Family (only meaningful for Eleanor: PersonID 7)
  if (BM.isUnlocked(9)) {
    const family = BM.queryAll(`
      SELECT f.RelationType, f.RecordStatus, f.EffectiveYear, p.FullName, p.BirthYear, p.DeathYear
      FROM FamilyTree f JOIN Persons p ON f.RelatedPersonID = p.PersonID
      WHERE f.PersonID = ${pid}
    `);
    if (family.length > 0) {
      html += `<div class="ev-section"><h5>🧬 家族关系</h5><ul>`;
      family.forEach(f => {
        const sealed = f.RecordStatus !== 'Public' ? ' <span style="color:var(--accent-warn);font-family:var(--mono);font-size:10px;">[' + f.RecordStatus + ']</span>' : '';
        html += `<li>${escapeHtml(f.RelationType)} of ${escapeHtml(f.FullName)} ${f.BirthYear ? '('+f.BirthYear+(f.DeathYear ? '–'+f.DeathYear : '')+')' : ''}${sealed}</li>`;
      });
      html += '</ul></div>';
    }
  }

  // Ch 10 — Document references (anyone mentioned in Memo)
  if (BM.isUnlocked(10)) {
    const personRow = BM.queryAll(`SELECT FullName FROM Persons WHERE PersonID = ${pid}`)[0];
    if (personRow) {
      const fn = personRow.FullName.split(' ')[0]; // first name match
      const docs = BM.queryAll(`
        SELECT EventTime, Action, FileName, PreviewText
        FROM WritingSoftwareLog
        WHERE PreviewText LIKE '%${fn}%' OR FileName LIKE '%${fn}%'
        ORDER BY EventTime
      `);
      if (docs.length > 0) {
        html += `<div class="ev-section"><h5>📄 Elias 文档中提及</h5>`;
        docs.forEach(d => {
          const fn2 = d.FileName === 'Memo_PersonalNote.scriv' ? `<span style="color:var(--accent-warn)">${escapeHtml(d.FileName)}</span>` : escapeHtml(d.FileName);
          html += `<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,0.15);">
            <div class="ev-time">${d.EventTime}</div>
            <div style="font-family:var(--mono);font-size:10.5px;">${d.Action} · ${fn2}</div>
            <div style="font-family:var(--serif);font-style:italic;color:var(--text-main);font-size:12px;margin-top:3px;">"${escapeHtml((d.PreviewText || '').slice(0, 220))}${(d.PreviewText || '').length > 220 ? '...' : ''}"</div>
          </div>`;
        });
        html += '</div>';
      }
    }
  }

  return html || '<div class="ev-locked">完成相应章节以解锁更多证据</div>';
};
