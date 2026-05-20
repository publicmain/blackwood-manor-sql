// ============================================================
// boot.js — wires everything together once DOM + sql.js are ready
// ============================================================

(async function boot() {
  // 1. Load saved state
  BM.loadState();

  // 2. Init DB
  try {
    await BM.initDB();
  } catch (e) {
    document.getElementById('sb-result').innerHTML =
      `<div class="sb-result-status err">无法初始化 SQL 引擎: ${e.message}<br>请检查网络连接 (sql.js wasm 来自 CDN)。</div>`;
    return;
  }

  // 3. Initial UI render
  BM.renderSidebar();
  BM.renderProgressPill();
  BM.renderSandbox();
  BM.renderSuspects();
  BM.renderFloorplan();
  BM.renderTimeline();
  BM.renderFamilyTree(false);
  BM.renderCabinet();
  BM.renderCCTV();
  BM.renderOverheard();
  BM.renderClosing();

  // 4. Bind controls
  BM.bindEditorKeys();
  BM.initNotesPanel();

  document.getElementById('btn-run').onclick = () => BM.runActiveQuery();
  document.getElementById('btn-hint').onclick = () => BM.toggleHint();
  document.getElementById('btn-clear').onclick = () => {
    const ed = document.getElementById('sb-editor');
    ed.value = '';
    BM.state.chQueries[BM.state.activeCh] = '';
    BM.saveState();
    ed.focus();
  };
  document.getElementById('btn-schema').onclick = () => BM.showSchema();
  document.getElementById('schema-close').onclick = () =>
    document.getElementById('schema-modal').classList.remove('show');
  document.getElementById('schema-modal').addEventListener('click', e => {
    if (e.target.id === 'schema-modal') e.target.classList.remove('show');
  });

  // Bio modal backdrop click-to-close
  document.getElementById('bio-modal-backdrop').addEventListener('click', e => {
    if (e.target.id === 'bio-modal-backdrop') e.target.classList.remove('show');
  });

  // Reset flow
  document.getElementById('btn-reset').onclick = () => {
    document.getElementById('confirm-modal').classList.add('show');
  };
  document.getElementById('confirm-cancel').onclick = () =>
    document.getElementById('confirm-modal').classList.remove('show');
  document.getElementById('confirm-ok').onclick = () => BM.reset();

  // 5. If query was already drafted, render result placeholder
  console.log('[BM] Booted. Unlocked chapters:', BM.unlockedCount(), '/ 11');
})();
