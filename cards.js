// ============================================================
// cards.js — SQL row → clue card pipeline + board / drag / pin
// ============================================================

(function () {
  // Canonical name → PersonID map (matches Persons table).
  // Used to recover pid when the player's query didn't SELECT PersonID.
  const NAME_TO_PID = {
    "Elias Blackwood": 1,
    "Vivienne Ashford": 2,
    "Sophia Blackwood": 3,
    "Marcus Thorne": 4,
    "Iris Chen": 5,
    "Julian Hartley": 6,
    "Eleanor Wright": 7,
    "Henrik Volkov": 8,
    "Mrs Eileen Hodge": 9,
    "Mr Albert Pemberton": 10,
    "Anton Volkov": 11,
    "Chef Pierre Dubois": 12,
    "Sarah Whitcombe": 13,
    "Margaret Blackwood": 14,
    "Charles Blackwood": 15,
    "Henrietta Blackwood": 16,
    "Robert Wright": 17,
    "Patricia Wright": 18
  };
  function pidForClue(clue) {
    if (clue && clue.pid) return clue.pid;
    if (clue && clue.type === "person" && NAME_TO_PID[clue.title]) return NAME_TO_PID[clue.title];
    return null;
  }
  window.BMM2_NAME_TO_PID = NAME_TO_PID;
  window.BMM2_pidForClue = pidForClue;

  // ---------- type detection ----------
  function detectType(cols) {
    const set = new Set(cols.map(c => c.toLowerCase()));
    if (set.has("snippet") || set.has("content")) return "comm";
    if (set.has("filename")) return "doc";
    if (set.has("title") && set.has("author")) return "doc";
    if (set.has("label") && set.has("vintage")) return "evid";
    if (set.has("accesstime") || set.has("starttime") || set.has("spokentime") || set.has("eventtime")) return "event";
    if (set.has("hascctv") || set.has("wing")) return "place";
    if (set.has("personid") || set.has("fullname")) return "person";
    if (set.has("roomid") && set.has("name")) return "place";
    return "generic";
  }
  const TYPE_ICONS = { person: "👤", event: "🕐", place: "🚪", comm: "💬", doc: "📖", evid: "🍷", generic: "📋" };

  // Build a unique id for a row to dedupe
  function rowKey(type, cols, row) {
    const idxs = ["PersonID","RoomID","LogID","SessionID","RecordID","CheckoutID","FileID","BookID","ConvID","BottleID","ContractID","Year","EventTime","AccessTime","StartTime","SpokenTime","FileName"];
    let parts = [type];
    for (const k of idxs) {
      const i = cols.indexOf(k);
      if (i >= 0) parts.push(k + ":" + row[i]);
    }
    if (parts.length === 1) {
      parts.push(row.map(v => String(v)).join("|"));
    }
    return parts.join("/");
  }

  // Build the card data object
  function rowToClue(cols, row, type, idx) {
    const i = (name) => cols.indexOf(name);
    let title = "—", sub = "", pid = null, fname = null;

    if (type === "person") {
      pid = i("PersonID") >= 0 ? row[i("PersonID")] : null;
      title = (i("FullName") >= 0 ? row[i("FullName")] : "Person #" + (pid || "?")) + "";
      // Recover pid by name if not present
      if (!pid && NAME_TO_PID[title]) pid = NAME_TO_PID[title];
      const age = i("Age") >= 0 ? row[i("Age")] : null;
      const occ = i("Occupation") >= 0 ? row[i("Occupation")] : null;
      const rm  = i("RoomID") >= 0 ? row[i("RoomID")] : null;
      sub = [age && age + "y", occ, rm && "Room " + rm].filter(Boolean).join(" · ");
    } else if (type === "event") {
      // first time col
      let timeCol = ["AccessTime","StartTime","SpokenTime","EventTime"].find(n => cols.includes(n));
      const t = timeCol ? row[cols.indexOf(timeCol)] : null;
      title = t || "Event";
      // Compose sub from other columns
      const other = cols.map((c, ci) => c !== timeCol && row[ci] != null ? `${c}: ${String(row[ci]).slice(0,40)}` : null).filter(Boolean).slice(0, 2);
      sub = other.join(" · ");
    } else if (type === "place") {
      const rid = i("RoomID") >= 0 ? row[i("RoomID")] : null;
      const nm  = i("Name") >= 0 ? row[i("Name")] : "Room";
      title = (rid ? "#" + rid + " " : "") + nm;
      const wing = i("Wing") >= 0 ? row[i("Wing")] : null;
      const floor = i("Floor") >= 0 ? row[i("Floor")] : null;
      sub = [wing && wing + " 翼", floor !== null && "F" + floor].filter(Boolean).join(" · ");
    } else if (type === "comm") {
      const sender = i("FromPersonID") >= 0 ? "P#" + row[i("FromPersonID")] : (i("SpeakerID") >= 0 ? "P#" + row[i("SpeakerID")] : "—");
      const t = i("StartTime") >= 0 ? row[i("StartTime")] : (i("SpokenTime") >= 0 ? row[i("SpokenTime")] : "");
      const c = i("Content") >= 0 ? row[i("Content")] : (i("Snippet") >= 0 ? row[i("Snippet")] : "");
      title = (t || "") + " " + (sender || "");
      sub = c ? `"${String(c).slice(0, 80)}${String(c).length > 80 ? "…" : ""}"` : "";
    } else if (type === "doc") {
      if (i("FileName") >= 0) {
        fname = row[i("FileName")];
        title = fname;
        const act = i("Action") >= 0 ? row[i("Action")] : null;
        const t = i("EventTime") >= 0 ? row[i("EventTime")] : null;
        sub = [t, act].filter(Boolean).join(" · ");
      } else if (i("Title") >= 0) {
        title = row[i("Title")];
        const a = i("Author") >= 0 ? row[i("Author")] : null;
        sub = a || "";
      }
    } else if (type === "evid") {
      const label = i("Label") >= 0 ? row[i("Label")] : "Item";
      const vint  = i("Vintage") >= 0 ? row[i("Vintage")] : null;
      title = label + (vint ? " · " + vint : "");
      sub = i("ShelfLocation") >= 0 ? "Shelf " + row[i("ShelfLocation")] : "";
    } else {
      title = cols.map((c, ci) => `${c}=${row[ci]}`).slice(0, 2).join(" · ");
      sub = cols.length > 2 ? cols.slice(2).map((c, ci) => `${c}=${row[ci+2]}`).slice(0,2).join(" · ") : "";
    }

    return { type, title: String(title), sub, pid, fname, cols, row };
  }

  // Render a clue card DOM in left rail
  function clueDOM(state, clue, idx) {
    const el = document.createElement("div");
    el.className = `clue type-${clue.type} fly-in`;
    el.style.animationDelay = (idx * 70) + "ms";
    el.dataset.key = clue.key;
    if (state.marks && clue.pid && state.marks["person_" + clue.pid]) {
      el.classList.add("mark-" + state.marks["person_" + clue.pid]);
    }

    // Avatar for persons (resolve pid from clue.pid OR known-name map)
    let avatarHtml = `<span class="clue-icon">${TYPE_ICONS[clue.type]}</span>`;
    if (clue.type === "person") {
      const pid = pidForClue(clue);
      if (pid && window.BMM_photoPath) {
        const p = window.BMM_photoPath(pid);
        if (p) avatarHtml = `<img class="clue-avatar" src="${p}" alt=""/>`;
      }
    }

    el.innerHTML = `
      <div class="clue-head">
        ${avatarHtml}
        <span class="clue-title">${escapeHtml(clue.title)}</span>
      </div>
      ${clue.sub ? `<div class="clue-sub">${highlightKeywords(escapeHtml(clue.sub))}</div>` : ""}
    `;
    // Click → open detail. (The drag-to-corkboard mechanic was removed —
    // playtest showed zero use across all player tiers.)
    el.addEventListener("click", () => {
      window.BMM2_workspace?.openClueDetail(clue.key);
    });
    return el;
  }

  function highlightKeywords(html) {
    if (!window.BMM2_KEYWORDS) return html;
    let out = html;
    for (const kw of window.BMM2_KEYWORDS) {
      const re = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})\\b`, "gi");
      out = out.replace(re, '<span class="kw">$1</span>');
    }
    return out;
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  window.BMM2_cards = {
    detectType, rowKey, rowToClue, clueDOM, highlightKeywords, escapeHtml, TYPE_ICONS
  };
})();
