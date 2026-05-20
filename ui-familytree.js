// ============================================================
// Section F — Family tree SVG
// ============================================================

BM.renderFamilyTree = function(triggerReveal) {
  const mount = document.getElementById('familytree-mount');
  if (!BM.isUnlocked(1)) {
    mount.innerHTML = BM.lockedBlock(1, '家族树待解锁');
    return;
  }

  const ch9 = BM.isUnlocked(9);

  // Layout — three generations of Blackwoods + Wrights side
  // Top: Charles & Henrietta + Robert & Patricia
  // Middle: Elias / Margaret / Eleanor
  // Bottom: Anton (henrik's son), Sophia (spouse), Vivienne (ex)
  const nodes = [
    // gen 1
    { id: 15, name: 'Charles Blackwood', years: '1932–2002', x: 130, y: 50, deceased: true },
    { id: 16, name: 'Henrietta Blackwood', years: '1935–2018', x: 290, y: 50, deceased: true },
    { id: 17, name: 'Robert Wright', years: '1940–2010', x: 540, y: 50, deceased: true },
    { id: 18, name: 'Patricia Wright', years: '1942–2008', x: 700, y: 50, deceased: true },
    // gen 2
    { id: 1, name: 'Elias Blackwood', years: '1957–2024', x: 130, y: 220, victim: true, deceased: true },
    { id: 14, name: 'Margaret Blackwood', years: '1964–1986', x: 290, y: 220, deceased: true, italics: true },
    { id: 7, name: 'Eleanor Wright', years: '1980–', x: 620, y: 220 },
    // spouses / others
    { id: 2, name: 'Vivienne Ashford', years: '1972–', x: 50, y: 380, exspouse: true },
    { id: 3, name: 'Sophia Blackwood', years: '1992–', x: 200, y: 380 },
    { id: 8, name: 'Henrik Volkov', years: '1963–', x: 460, y: 380 },
    { id: 11, name: 'Anton Volkov', years: '1996–', x: 460, y: 500 }
  ];

  const nodeById = {};
  nodes.forEach(n => { nodeById[n.id] = n; });

  // Edges (Public)
  // (parent, child) — parents above
  const edges = [
    { from: 15, to: 1, type: 'parent' },
    { from: 16, to: 1, type: 'parent' },
    { from: 15, to: 14, type: 'parent' },
    { from: 16, to: 14, type: 'parent' },
    { from: 17, to: 7, type: 'parent' },
    { from: 18, to: 7, type: 'parent' },
    { from: 1, to: 2, type: 'exspouse' },
    { from: 1, to: 3, type: 'spouse' },
    { from: 8, to: 11, type: 'parent' }
  ];

  const w = 820, h = 580;
  let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;

  // Sibling line: Elias <-> Margaret (siblings) — a horizontal bar
  svg += `<line class="ft-link" x1="${nodeById[1].x}" y1="${nodeById[1].y - 14}" x2="${nodeById[14].x}" y2="${nodeById[14].y - 14}" stroke-dasharray="2 3"/>`;
  svg += `<text x="${(nodeById[1].x + nodeById[14].x) / 2}" y="${nodeById[1].y - 20}" text-anchor="middle" style="font-family:var(--mono);font-size:9px;fill:var(--text-faint);">siblings</text>`;

  // Public edges
  edges.forEach(e => {
    const a = nodeById[e.from], b = nodeById[e.to];
    if (!a || !b) return;
    let cls = 'ft-link' + (e.type === 'spouse' || e.type === 'exspouse' ? ' spouse' : '');
    // bezier from a (top) to b (bottom)
    if (e.type === 'parent') {
      const midY = (a.y + b.y) / 2;
      svg += `<path class="${cls}" d="M ${a.x} ${a.y + 26} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - 26}"/>`;
    } else {
      svg += `<line class="${cls}" x1="${a.x}" y1="${a.y + 26}" x2="${b.x}" y2="${b.y - 26}"/>`;
    }
  });

  // Sealed adoption — Margaret → Eleanor (Margaret is the BIRTH MOTHER)
  // Only drawn after Ch 9; animated reveal on trigger.
  const sealedClass = ch9 ? 'ft-link sealed revealed' : 'ft-link sealed';
  const m14 = nodeById[14], el = nodeById[7];
  svg += `<path id="ft-sealed-link" class="${sealedClass}"
            d="M ${m14.x + 16} ${m14.y + 16} C ${(m14.x + el.x) / 2} ${(m14.y + el.y) / 2 - 30}, ${el.x - 80} ${el.y - 40}, ${el.x - 30} ${el.y - 8}"/>`;
  if (ch9) {
    svg += `<text x="${(m14.x + el.x) / 2}" y="${m14.y + 80}" text-anchor="middle" style="font-family:var(--mono);font-size:10px;fill:var(--accent-warn);letter-spacing:0.1em;">[Sealed_Adoption · 1980]</text>`;
  }

  // Nodes
  nodes.forEach(n => {
    let cls = 'ft-node' + (n.deceased ? ' deceased' : '') + (n.victim ? ' victim' : '');
    svg += `<g class="${cls}" data-pid="${n.id}" transform="translate(${n.x}, ${n.y})">
      <circle r="26"/>
      <text x="0" y="46" style="${n.italics ? 'font-style:italic;' : ''}">${escapeHtml(n.name)}</text>
      <text x="0" y="62" class="ft-years">${n.years}</text>
      <text x="0" y="5" style="font-family:var(--serif);font-size:14px;fill:${n.victim ? 'var(--accent-warn)' : 'var(--accent-clue)'};font-weight:600;">${n.name.split(' ').map(s => s[0]).join('')}</text>
    </g>`;
  });

  // Legend & generation labels
  svg += `<text x="20" y="40" style="font-family:var(--mono);font-size:10px;fill:var(--text-faint);letter-spacing:0.12em;">GEN 1</text>`;
  svg += `<text x="20" y="210" style="font-family:var(--mono);font-size:10px;fill:var(--text-faint);letter-spacing:0.12em;">GEN 2</text>`;
  svg += `<text x="20" y="370" style="font-family:var(--mono);font-size:10px;fill:var(--text-faint);letter-spacing:0.12em;">SPOUSES</text>`;
  svg += `<text x="20" y="490" style="font-family:var(--mono);font-size:10px;fill:var(--text-faint);letter-spacing:0.12em;">GEN 3</text>`;

  svg += '</svg>';

  mount.innerHTML = `<div class="familytree-wrap fade-in">
    ${svg}
    <div class="ft-reveal-banner" id="ft-reveal-banner">封存的领养记录浮出水面 — Margaret 是 Eleanor 的生母</div>
  </div>`;

  // Node clicks → bio modal
  mount.querySelectorAll('.ft-node').forEach(n => {
    n.addEventListener('click', () => {
      const pid = +n.dataset.pid;
      const p = BM.queryAll(`SELECT * FROM Persons WHERE PersonID = ${pid}`)[0];
      if (!p) return;
      BM.showBio(p);
    });
  });

  // Trigger reveal animation when Ch 9 first completes
  if (triggerReveal && ch9) {
    const banner = document.getElementById('ft-reveal-banner');
    setTimeout(() => {
      banner.classList.add('show');
      // briefly zoom-in feel: scale the svg
      const svgEl = mount.querySelector('svg');
      svgEl.style.transition = 'transform 600ms cubic-bezier(.2,.7,.2,1)';
      svgEl.style.transformOrigin = `${(m14.x / w) * 100}% ${(m14.y / h) * 100}%`;
      svgEl.style.transform = 'scale(1.15)';
      setTimeout(() => { svgEl.style.transform = 'scale(1)'; }, 1400);
    }, 200);
  }
};

BM.showBio = function(p) {
  const m = document.getElementById('bio-modal-content');
  const years = p.BirthYear ? `${p.BirthYear}${p.DeathYear ? '–' + p.DeathYear : '–'}` : '';
  m.innerHTML = `
    <h3>${escapeHtml(p.FullName)}</h3>
    <div class="yrs">${years} · ${escapeHtml(p.PersonType)} · ${escapeHtml(p.Occupation || '')}</div>
    <p><b style="color:var(--accent-clue)">关系:</b> ${escapeHtml(p.RelationToElias || '—')}</p>
    ${p.Notes ? `<p style="font-style:italic;">${escapeHtml(p.Notes)}</p>` : ''}
    <button class="close" onclick="document.getElementById('bio-modal-backdrop').classList.remove('show')">关闭</button>
  `;
  document.getElementById('bio-modal-backdrop').classList.add('show');
};
