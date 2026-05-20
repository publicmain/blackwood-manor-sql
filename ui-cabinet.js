// ============================================================
// Section G — Evidence cabinet (tabs)
// ============================================================

BM.cabState = {
  activeTab: 'library',
  sortBy: {},
  sortDir: {}
};

BM.CAB_TABS = [
  { key: 'library', label: '借阅记录', icon: '📖', chUnlock: 5 },
  { key: 'wine',    label: '酒窖日志', icon: '🍷', chUnlock: 4 },
  { key: 'phone',   label: '通讯记录', icon: '💬', chUnlock: 3 },
  { key: 'docs',    label: '文档日志', icon: '📄', chUnlock: 10 }
];

BM.renderCabinet = function() {
  const mount = document.getElementById('cabinet-mount');
  if (!BM.isUnlocked(2)) {
    mount.innerHTML = BM.lockedBlock(2, '物证柜待解锁');
    return;
  }

  // Pick first unlocked tab as default
  const unlockedTabs = BM.CAB_TABS.filter(t => BM.isUnlocked(t.chUnlock));
  if (unlockedTabs.length && !unlockedTabs.find(t => t.key === BM.cabState.activeTab)) {
    BM.cabState.activeTab = unlockedTabs[0].key;
  }

  let html = '<div class="cabinet fade-in"><div class="cb-tabs">';
  BM.CAB_TABS.forEach(t => {
    const locked = !BM.isUnlocked(t.chUnlock);
    const active = !locked && t.key === BM.cabState.activeTab;
    html += `<button class="cb-tab${active ? ' active' : ''}${locked ? ' locked' : ''}"
              data-tab="${t.key}" ${locked ? 'disabled' : ''}>${t.icon} ${t.label}${locked ? ' <span class="lk">🔒 Ch ' + t.chUnlock + '</span>' : ''}</button>`;
  });
  html += '</div><div class="cb-pane" id="cb-pane"></div></div>';

  mount.innerHTML = html;
  mount.querySelectorAll('.cb-tab').forEach(b => {
    b.onclick = () => {
      if (b.classList.contains('locked')) return;
      BM.cabState.activeTab = b.dataset.tab;
      BM.renderCabinet();
    };
  });

  BM.renderCabPane();
};

BM.renderCabPane = function() {
  const pane = document.getElementById('cb-pane');
  if (!pane) return;
  const tab = BM.cabState.activeTab;
  if (tab === 'library') pane.innerHTML = BM.cabLibrary();
  else if (tab === 'wine') pane.innerHTML = BM.cabWine();
  else if (tab === 'phone') pane.innerHTML = BM.cabPhone();
  else if (tab === 'docs') pane.innerHTML = BM.cabDocs();
};

BM.cabLibrary = function() {
  const rows = BM.queryAll(`
    SELECT c.CheckoutID, c.CheckoutDate, c.ReturnDate, p.FullName, b.Title, b.Author, b.Genre, b.ShelfLocation
    FROM LibraryCheckouts c
    JOIN Persons p ON c.PersonID = p.PersonID
    JOIN Books b ON c.BookID = b.BookID
    ORDER BY c.CheckoutDate DESC
  `);
  let html = `<table class="evtable">
    <thead><tr><th>Checkout</th><th>Return</th><th>Reader</th><th>Title</th><th>Author</th><th>Genre</th></tr></thead><tbody>`;
  rows.forEach(r => {
    const ret = r.ReturnDate ? r.ReturnDate : '<span class="del">未归还</span>';
    html += `<tr>
      <td>${r.CheckoutDate}</td><td>${ret}</td><td>${escapeHtml(r.FullName)}</td>
      <td><i>${escapeHtml(r.Title)}</i></td><td>${escapeHtml(r.Author)}</td><td>${escapeHtml(r.Genre || '')}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
};

BM.cabWine = function() {
  const rows = BM.queryAll(`
    SELECT l.LogID, l.AccessTime, p.FullName, b.Label, b.Vintage, b.ShelfLocation
    FROM WineCellarLog l
    JOIN Persons p ON l.TakenByPersonID = p.PersonID
    JOIN WineBottles b ON l.BottleID = b.BottleID
    ORDER BY l.AccessTime
  `);
  let html = `<table class="evtable">
    <thead><tr><th>Time</th><th>Taken by</th><th>Bottle</th><th>Vintage</th><th>Shelf</th></tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr>
      <td>${r.AccessTime}</td>
      <td>${escapeHtml(r.FullName)}</td>
      <td>${escapeHtml(r.Label)}</td>
      <td>${r.Vintage}</td>
      <td>${escapeHtml(r.ShelfLocation || '')}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
};

BM.cabPhone = function() {
  const rows = BM.queryAll(`
    SELECT pr.StartTime, p.FullName AS FromName, pr.RecordType, pr.ToName, pr.ToNumber, pr.DurationSec, pr.Content
    FROM PhoneRecords pr
    JOIN Persons p ON pr.FromPersonID = p.PersonID
    ORDER BY pr.StartTime
  `);
  let html = `<table class="evtable">
    <thead><tr><th>Time</th><th>Type</th><th>From</th><th>To</th><th>Content / Duration</th></tr></thead><tbody>`;
  rows.forEach(r => {
    const to = r.ToName ? `${escapeHtml(r.ToName)} <span class="muted">(${escapeHtml(r.ToNumber)})</span>` : escapeHtml(r.ToNumber);
    const body = r.Content ? `<div class="preview-cell">"${escapeHtml(r.Content)}"</div>` : `<span class="muted">${r.DurationSec}s</span>`;
    html += `<tr>
      <td>${r.StartTime}</td>
      <td>${r.RecordType}</td>
      <td>${escapeHtml(r.FromName)}</td>
      <td>${to}</td>
      <td>${body}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
};

BM.cabDocs = function() {
  const rows = BM.queryAll(`SELECT * FROM WritingSoftwareLog ORDER BY EventTime`);
  const ch10 = BM.isUnlocked(10);
  let html = `<table class="evtable">
    <thead><tr><th>Time</th><th>Action</th><th>File</th><th>Chars</th><th>Preview</th></tr></thead><tbody>`;
  rows.forEach(r => {
    const isDeletedFile = (r.FileName === 'Memo_PersonalNote.scriv');
    let preview;
    if (isDeletedFile && r.Action !== 'Delete') {
      preview = ch10
        ? `<div class="preview-cell" style="color:var(--text-main);">"${escapeHtml(r.PreviewText || '')}"</div>`
        : `<span class="del">[已被删除 · 待 Ch 10 解锁恢复]</span>`;
    } else if (r.Action === 'Delete') {
      preview = `<span class="del">[file deleted]</span>`;
    } else {
      preview = `<div class="preview-cell">"${escapeHtml((r.PreviewText || '').slice(0, 240))}${(r.PreviewText || '').length > 240 ? '...' : ''}"</div>`;
    }
    const action = r.Action === 'Delete' ? `<span class="del">${r.Action}</span>` : r.Action;
    const fnHtml = isDeletedFile ? `<b style="color:var(--accent-warn)">${escapeHtml(r.FileName)}</b>` : escapeHtml(r.FileName);
    html += `<tr>
      <td>${r.EventTime}</td>
      <td>${action}</td>
      <td>${fnHtml}</td>
      <td>${r.CharCount == null ? '<span class="muted">—</span>' : r.CharCount}</td>
      <td>${preview}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  if (ch10) {
    html += `<div style="margin-top:14px;"><button onclick="BM.showMemoModal()" class="primary">📜 完整查看 Memo_PersonalNote.scriv</button></div>`;
  }
  return html;
};

BM.showMemoModal = function() {
  // create overlay if needed
  let overlay = document.getElementById('memo-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'memo-overlay';
    overlay.className = 'confirm-modal-backdrop';
    overlay.innerHTML = `<div class="memo-modal" id="memo-modal-inner"></div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
    document.body.appendChild(overlay);
  }
  const memo = BM.queryAll(`SELECT * FROM WritingSoftwareLog WHERE FileName = 'Memo_PersonalNote.scriv' AND Action = 'Save'`)[0];
  if (!memo) return;
  const inner = document.getElementById('memo-modal-inner');
  inner.innerHTML = `
    <div class="memo-meta">EventTime: ${memo.EventTime} · 1840 chars · autosaved before deletion at 00:51</div>
    <div class="memo-body">
      <p>${escapeHtml(memo.PreviewText)}</p>
      <p style="text-align:right;font-family:var(--mono);font-size:11px;color:#8a7d5f;margin-top:18px;">— E.B., 2024-10-20 00:38</p>
      <span class="deleted-stamp">DELETED 00:51</span>
    </div>
    <div style="margin-top:18px;text-align:right;font-family:var(--sans);">
      <button onclick="document.getElementById('memo-overlay').classList.remove('show')" style="font-family:var(--sans);">关闭</button>
    </div>
  `;
  overlay.classList.add('show');
};
