// ============================================================
// Sections H (CCTV), I (Overheard), J (Closing) + Notes
// ============================================================

// ---------------- Section H: CCTV matrix ----------------
BM.renderCCTV = function() {
  const mount = document.getElementById('cctv-mount');
  if (!BM.isUnlocked(8)) {
    mount.innerHTML = BM.lockedBlock(8, '监控状态矩阵待解锁');
    return;
  }
  const rooms = BM.queryAll(`SELECT * FROM Rooms ORDER BY Floor DESC, RoomID`);
  const cctv = BM.queryAll(`
    SELECT c.*, p.FullName AS DeletedByName
    FROM CCTVFiles c
    LEFT JOIN Persons p ON c.DeletedByID = p.PersonID
    ORDER BY c.RecordedStart
  `);

  let html = `<div class="cctv-matrix fade-in">
    <table>
      <thead>
        <tr>
          <th>Room</th><th>Wing/Floor</th><th>CCTV?</th>
          <th>录像段</th><th>状态</th><th>删除时间</th><th>删除者</th>
        </tr>
      </thead>
      <tbody>
  `;

  rooms.forEach(r => {
    const segs = cctv.filter(c => c.RoomID === r.RoomID);
    if (segs.length === 0) {
      html += `<tr>
        <td>${escapeHtml(r.Name)} <span class="muted">#${r.RoomID}</span></td>
        <td>${r.Wing} · F${r.Floor}</td>
        <td>${r.HasCCTV ? '<span style="color:#6da369">✓ Yes</span>' : '<span class="no-cctv-cell">✗ None</span>'}</td>
        <td colspan="4" class="no-cctv-cell">${r.HasCCTV ? '<i>(无该夜录像)</i>' : '<i>(此房间未安装 CCTV — 无任何监控覆盖)</i>'}</td>
      </tr>`;
    } else {
      segs.forEach((s, i) => {
        const isDeleted = s.FileStatus === 'Deleted';
        html += `<tr class="${isDeleted ? 'deleted-row' : ''}">
          ${i === 0 ? `<td rowspan="${segs.length}">${escapeHtml(r.Name)} <span class="muted">#${r.RoomID}</span></td>
          <td rowspan="${segs.length}">${r.Wing} · F${r.Floor}</td>
          <td rowspan="${segs.length}">${r.HasCCTV ? '<span style="color:#6da369">✓</span>' : '<span class="no-cctv-cell">—</span>'}</td>` : ''}
          <td>${s.RecordedStart} <span class="muted">+${Math.round(s.DurationSec / 60)}m</span></td>
          <td>${isDeleted ? '<span class="del">🚫 Deleted</span>' : '<span style="color:#6da369">Intact</span>'}</td>
          <td>${s.DeletedTime || '<span class="muted">—</span>'}</td>
          <td>${s.DeletedByName ? escapeHtml(s.DeletedByName) : '<span class="muted">—</span>'}</td>
        </tr>`;
      });
    }
  });
  html += `</tbody></table>
    <div class="annotation">
      <b style="color:var(--accent-clue);">注:</b> 东走廊 (Room 602) 00:00–02:00 段录像由 Elias 本人于 00:25 删除 —— 这是 删除日志,不是凶手日志。Elias 当时仍活着,他自己擦掉自己的足迹。Eleanor 的连接门通道 (Room 406) 与书房 (Room 103)、档案室 (Room 405) 均 没有 CCTV 覆盖。三个无监控房间形成一条完美的盲区走廊。
    </div>
  </div>`;
  mount.innerHTML = html;
};

// ---------------- Section I: Overheard ----------------
BM.renderOverheard = function() {
  const mount = document.getElementById('overheard-mount');
  if (!BM.isUnlocked(7)) {
    mount.innerHTML = BM.lockedBlock(7, '偷听记录待解锁');
    return;
  }
  const convs = BM.queryAll(`
    SELECT c.SpokenTime, c.Snippet, c.RoomID, r.Name AS RoomName,
           sp.FullName AS Speaker, ls.FullName AS Listener, ov.FullName AS Overheard
    FROM Conversations c
    JOIN Persons sp ON c.SpeakerID = sp.PersonID
    LEFT JOIN Persons ls ON c.ListenerID = ls.PersonID
    JOIN Persons ov ON c.OverheardByID = ov.PersonID
    JOIN Rooms r ON c.RoomID = r.RoomID
    ORDER BY c.SpokenTime
  `);
  let html = '<div class="overheard-grid fade-in">';
  convs.forEach(c => {
    html += `<div class="oh-card">
      <div class="oh-hand">${c.SpokenTime.split(' ')[1] || c.SpokenTime} — ${escapeHtml(c.RoomName)} — overheard by ${escapeHtml(c.Overheard)}</div>
      <div class="oh-meta">${c.SpokenTime} · Room #${c.RoomID}</div>
      <p class="oh-snippet">"${escapeHtml(c.Snippet)}"</p>
      <div class="oh-speaker"><b>${escapeHtml(c.Speaker)}</b> → ${c.Listener ? escapeHtml(c.Listener) : '(无指定听众)'}</div>
    </div>`;
  });
  html += '</div>';
  mount.innerHTML = html;
};

// ---------------- Section J: Closing ----------------
BM.renderClosing = function() {
  const mount = document.getElementById('closing-mount');
  if (!BM.isUnlocked(11)) {
    mount.innerHTML = `<div class="locked" style="padding:50px 24px;">
      <div class="lock-icon">🔒</div>
      <div class="lock-title" style="font-size:18px;">案件未结</div>
      <div style="margin-top:8px;font-size:13px;color:var(--text-dim);">完成第 11 章 — 七列证据综合查询 — 以解锁本节</div>
      <span class="lock-jump" onclick="BM.jumpToChapter(11)">→ 跳到 SQL 沙盘第 11 章</span>
    </div>`;
    return;
  }

  // Compute seven columns for each suspect from the DB
  const suspects = BM.queryAll(`SELECT PersonID, FullName FROM Persons WHERE PersonType = 'Guest' ORDER BY PersonID`);
  const tod1 = "'2024-10-20 00:30'", tod2 = "'2024-10-20 01:30'";

  // helpers
  const has = (sql) => {
    const r = BM.queryAll(sql);
    return r.length > 0 && Object.values(r[0])[0] > 0;
  };

  const sevenRows = suspects.map(s => {
    const pid = s.PersonID;
    const bloodRel = has(`SELECT COUNT(*) FROM FamilyTree WHERE PersonID = ${pid} AND RelatedPersonID = 14 AND RelationType = 'Parent'`);
    const enteredStudy = has(`SELECT COUNT(*) FROM KeycardAccess WHERE PersonID = ${pid} AND RoomID = 103 AND AccessTime BETWEEN ${tod1} AND ${tod2} AND AccessType IN ('Entry','Override')`);
    const noWifi = !has(`SELECT COUNT(*) FROM WiFiSessions WHERE PersonID = ${pid} AND StartTime <= ${tod2} AND (EndTime IS NULL OR EndTime >= ${tod1})`);
    // CCTVCoverageGone: any room they visited during ToD has no CCTV
    const cctvGone = has(`SELECT COUNT(*) FROM KeycardAccess k JOIN Rooms r ON k.RoomID = r.RoomID
      WHERE k.PersonID = ${pid} AND k.AccessTime BETWEEN ${tod1} AND ${tod2}
        AND (r.HasCCTV = 0 OR r.RoomID = 602)`);
    const preparedSms = has(`SELECT COUNT(*) FROM PhoneRecords WHERE FromPersonID = ${pid} AND Content LIKE '%prepared%'`);
    const firstName = s.FullName.split(' ')[0];
    const motiveDoc = has(`SELECT COUNT(*) FROM WritingSoftwareLog WHERE FileName = 'Memo_PersonalNote.scriv' AND PreviewText LIKE '%${firstName}%'`);
    return {
      name: s.FullName,
      cols: [bloodRel, enteredStudy, noWifi, cctvGone, preparedSms, motiveDoc],
    };
  });

  const colLabels = [
    'Blood<br>Relation',
    'Entered Study<br>during ToD',
    'No WiFi<br>during ToD',
    'CCTV Coverage<br>Gone',
    'Prepared in<br>Writing',
    'Motive by<br>Document'
  ];

  let table = `<table class="seven-table">
    <thead><tr><th>Suspect</th>${colLabels.map(l => `<th>${l}</th>`).join('')}<th>Hit Count</th></tr></thead>
    <tbody>`;
  sevenRows.forEach(row => {
    const hits = row.cols.filter(c => c).length;
    const target = hits === row.cols.length;
    table += `<tr${target ? ' class="target"' : ''}>
      <td style="text-align:left;font-family:var(--serif);">${escapeHtml(row.name)}</td>
      ${row.cols.map(c => `<td class="${c ? 'true' : 'false'}">${c ? '✓' : '·'}</td>`).join('')}
      <td>${hits}/${row.cols.length}</td>
    </tr>`;
  });
  table += '</tbody></table>';

  mount.innerHTML = `<div class="section-j fade-in">
    <div class="closed-head">
      <div class="closed-stamp">CLOSED</div>
      <div class="closed-sub">七列证据全部命中 · 逮捕令于 2024 年 10 月 30 日下午签发</div>
    </div>

    <h3 style="margin-bottom:12px;color:var(--accent-clue);">证据矩阵 — 你自己跑出来的</h3>
    <p style="font-family:var(--serif);font-size:13.5px;color:var(--text-dim);margin-bottom:14px;">
      没人替你填这张表。每一列都是一个 SQL 谓词,对每位嫌疑人独立计算。只有一行 六项全部为真。
    </p>
    ${table}

    <details class="denouement">
      <summary>终章 · The Denouement (点击展开)</summary>
      <div class="denouement-body">
        <p>Eleanor Wright,出生于 1980 年,黑木家族的女儿 —— 但不是公开记录上的那个 Eleanor Wright。Margaret Blackwood,自杀于 1986 年的二十二岁,在 1980 年留下了一个孩子,记录被 Charles Blackwood 用律师手段封存。Robert 与 Patricia Wright 是她的领养父母。Eleanor 在 Trinity 读历史时找到了线索;她花了二十年才回到这栋房子。</p>
        <p>她是以"授权传记作者"的身份获邀的 —— 唯一持有 Archive→Study 连接门 (Room 406) 通行权的非家族成员。这是 Elias 自己授予的。三年的传记工作,是她接近真相的合法掩护。</p>
        <p>在 16:20,她对 Iris Chen 说: <i>"Don't ask me how I know. Just know that he knows you read it."</i> 她已经看过了那本笔记。在 21:40 的晚宴上,她对 Elias 说: <i>"Tonight, after the gala. The Archive. Bring nothing."</i> Elias 同意了 —— 因为他正打算告诉她真相。</p>
        <p>他在 00:38 保存了 Memo_PersonalNote.scriv: <i>"Eleanor coming in 10 min. She knows. We will settle this..."</i> 但他没料到,她不是来 settle 的。00:48,她用连接门进入书房,把他的青铜书挡拿了起来。01:02 离开。01:35,她在自己房间重新连上 WiFi —— 一个完美的、为时 67 分钟的空窗。</p>
        <p>她以为 Elias 是来羞辱她的 —— 又一次像 1980 年那样用契约把她从家里抹掉。但他的 Contract #3 写得很清楚:<i>「Margaret 的手稿要在他的注释下发表」</i>。她毁掉的,本应是她生母的发声机会。</p>
        <p style="color:var(--accent-clue);font-style:italic;">SQL 不会替你判断。证据已就位。但七列同时为真的只有一个人。</p>
      </div>
    </details>

    <div class="dedication">
      <div>BMM-2024-1019 · 结案于 2024 年 10 月 30 日 · DI James Brennan</div>
      <div class="name" style="margin-top:10px;font-size:15px;">In memory of <b>Margaret Blackwood</b>, 1964–1986.</div>
      <div style="font-family:var(--mono);font-size:10px;margin-top:6px;color:var(--text-faint);">Aspiring author. Sister. Mother.</div>
    </div>
  </div>`;
};

// ---------------- Notes panel ----------------
BM.initNotesPanel = function() {
  const fab = document.getElementById('notes-fab');
  const panel = document.getElementById('notes-panel');
  const ta = document.getElementById('notes-textarea');
  const btnOpen = document.getElementById('btn-open-notes');
  const btnClose = document.getElementById('btn-close-notes');
  ta.value = BM.state.notes || '';
  ta.addEventListener('input', () => {
    BM.state.notes = ta.value;
    BM.saveState();
  });
  const toggle = () => panel.classList.toggle('open');
  fab.onclick = toggle;
  btnOpen.onclick = toggle;
  btnClose.onclick = toggle;
};
