// Distinctive SVG mugshot portraits for the 7 suspects.
// Style: police-sketch line art, monochrome cream on dark paper.
// Each portrait shares a base (head + shoulders) and varies in hair,
// glasses, beard, accessories — so they're glanceable at thumbnail size.

(function () {
  // Common defs reused by every portrait (paper texture clip)
  const FACE_FILL   = "#3d3a32";        // dim sepia mask under hair
  const SKIN_LINE   = "#b89968";        // line color for face/hair
  const HAIR_FILL   = "#1f1c17";        // hair color
  const ACCESSORY   = "#d8b888";        // brighter gold for accessories
  const BG_TINT     = "#1A1F2E";

  // --- Each suspect: returns the inner SVG for a 64x76 viewBox.
  // Conventions: head center ~ (32, 28), shoulders bottom 56-76
  const MUG = {
    // 2 — Vivienne Ashford (52, ex-wife): updo, pearls
    2: () => `
      <!-- shoulders -->
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- pearls -->
      <circle cx="22" cy="56" r="1.4" fill="${ACCESSORY}"/>
      <circle cx="26" cy="58" r="1.4" fill="${ACCESSORY}"/>
      <circle cx="30" cy="59" r="1.4" fill="${ACCESSORY}"/>
      <circle cx="34" cy="59" r="1.4" fill="${ACCESSORY}"/>
      <circle cx="38" cy="58" r="1.4" fill="${ACCESSORY}"/>
      <circle cx="42" cy="56" r="1.4" fill="${ACCESSORY}"/>
      <!-- neck -->
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.6"/>
      <!-- face -->
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- updo (high bun) -->
      <ellipse cx="32" cy="9" rx="9" ry="5" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.6"/>
      <!-- hairline -->
      <path d="M22,18 Q23,13 32,13 Q41,13 42,18" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.6"/>
      <!-- subtle features -->
      <circle cx="28" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <circle cx="36" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <path d="M28,32 Q32,34 36,32" stroke="${SKIN_LINE}" stroke-width="0.7" fill="none"/>
    `,
    // 3 — Sophia Blackwood (32, wife): long flowing hair, younger
    3: () => `
      <path d="M0,76 Q6,52 22,48 L42,48 Q58,52 64,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- hair behind shoulders -->
      <path d="M16,18 Q12,40 14,56 L20,52 Q22,40 22,28 Z" fill="${HAIR_FILL}"/>
      <path d="M48,18 Q52,40 50,56 L44,52 Q42,40 42,28 Z" fill="${HAIR_FILL}"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- hair top -->
      <path d="M21,18 Q22,11 32,10 Q42,11 43,18 L43,22 Q40,16 32,15 Q24,16 21,22 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.6"/>
      <circle cx="28" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <circle cx="36" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <path d="M28,33 Q32,35 36,33" stroke="${SKIN_LINE}" stroke-width="0.7" fill="none"/>
    `,
    // 4 — Marcus Thorne (49, agent, heavy drinker): receding hairline, stubble
    4: () => `
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- receding hair: M-shape on the temples only -->
      <path d="M21,18 Q22,12 26,12 L28,18 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <path d="M43,18 Q42,12 38,12 L36,18 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <!-- side hair -->
      <path d="M21,18 Q19,30 22,38" fill="none" stroke="${HAIR_FILL}" stroke-width="2.5"/>
      <path d="M43,18 Q45,30 42,38" fill="none" stroke="${HAIR_FILL}" stroke-width="2.5"/>
      <!-- stubble along jaw -->
      <path d="M22,34 Q32,42 42,34" stroke="${HAIR_FILL}" stroke-width="1.2" fill="none" stroke-dasharray="0.6 0.6" opacity="0.55"/>
      <circle cx="28" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <circle cx="36" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <path d="M28,33 Q32,32 36,33" stroke="${SKIN_LINE}" stroke-width="0.7" fill="none"/>
    `,
    // 5 — Iris Chen (29, quiet author): straight long hair with blunt bangs
    5: () => `
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- long straight hair behind -->
      <path d="M18,18 L16,58 L22,54 L22,30 Z" fill="${HAIR_FILL}"/>
      <path d="M46,18 L48,58 L42,54 L42,30 Z" fill="${HAIR_FILL}"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- bangs (straight across forehead) -->
      <path d="M22,18 L22,12 Q32,9 42,12 L42,18 L42,22 L22,22 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <circle cx="28" cy="27" r="0.7" fill="${SKIN_LINE}"/>
      <circle cx="36" cy="27" r="0.7" fill="${SKIN_LINE}"/>
      <path d="M29,33 Q32,34 35,33" stroke="${SKIN_LINE}" stroke-width="0.6" fill="none"/>
    `,
    // 6 — Julian Hartley (58, rival): swept-back hair, refined
    6: () => `
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- swept-back hair, somewhat full on top -->
      <path d="M21,18 Q20,10 26,9 Q32,7 38,9 Q44,10 43,18 L43,15 Q34,12 21,15 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.6"/>
      <path d="M21,18 Q19,28 22,34" fill="none" stroke="${HAIR_FILL}" stroke-width="1.5"/>
      <path d="M43,18 Q45,28 42,34" fill="none" stroke="${HAIR_FILL}" stroke-width="1.5"/>
      <!-- moustache hint -->
      <path d="M27,32 Q32,30 37,32" stroke="${HAIR_FILL}" stroke-width="1.2" fill="none"/>
      <circle cx="28" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <circle cx="36" cy="26" r="0.7" fill="${SKIN_LINE}"/>
      <path d="M28,36 Q32,37 36,36" stroke="${SKIN_LINE}" stroke-width="0.6" fill="none"/>
    `,
    // 7 — Eleanor Wright (44, biographer): medium hair tucked back, round glasses
    7: () => `
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- hair sides -->
      <path d="M18,18 Q14,38 20,46 L22,42 L22,24 Z" fill="${HAIR_FILL}"/>
      <path d="M46,18 Q50,38 44,46 L42,42 L42,24 Z" fill="${HAIR_FILL}"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- crown of hair -->
      <path d="M21,18 Q22,12 32,11 Q42,12 43,18 L41,17 Q32,14 23,17 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <!-- round glasses -->
      <circle cx="27" cy="26" r="3.2" fill="none" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <circle cx="37" cy="26" r="3.2" fill="none" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <line x1="30.2" y1="26" x2="33.8" y2="26" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <circle cx="27" cy="26" r="0.6" fill="${SKIN_LINE}"/>
      <circle cx="37" cy="26" r="0.6" fill="${SKIN_LINE}"/>
      <path d="M28,33 Q32,34 36,33" stroke="${SKIN_LINE}" stroke-width="0.6" fill="none"/>
    `,
    // 8 — Henrik Volkov (61, Russian critic): full beard, glasses
    8: () => `
      <path d="M2,76 Q8,52 22,48 L42,48 Q56,52 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <rect x="28" y="42" width="8" height="8" fill="${FACE_FILL}"/>
      <ellipse cx="32" cy="26" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      <!-- short cropped hair -->
      <path d="M21,18 Q22,11 32,10 Q42,11 43,18 L41,16 Q32,14 23,16 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <!-- full beard -->
      <path d="M22,30 Q22,42 32,46 Q42,42 42,30 Q38,34 32,34 Q26,34 22,30 Z" fill="${HAIR_FILL}" stroke="${SKIN_LINE}" stroke-width="0.5"/>
      <!-- moustache (slightly thicker) -->
      <path d="M24,30 Q32,28 40,30" stroke="${HAIR_FILL}" stroke-width="2.2" fill="none"/>
      <!-- glasses (square-ish) -->
      <rect x="23.5" y="22" width="7" height="5" fill="none" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <rect x="33.5" y="22" width="7" height="5" fill="none" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <line x1="30.5" y1="24.5" x2="33.5" y2="24.5" stroke="${ACCESSORY}" stroke-width="0.9"/>
      <circle cx="27" cy="24.5" r="0.6" fill="${SKIN_LINE}"/>
      <circle cx="37" cy="24.5" r="0.6" fill="${SKIN_LINE}"/>
    `
  };

  // Real photographs — when present, these are used instead of the line-art.
  const PHOTO = {
    1: "portraits/Elias.png",
    2: "portraits/Vivienne.png",
    3: "portraits/Sophia.png",
    4: "portraits/Marcus.png",
    5: "portraits/Iris.png",
    6: "portraits/Julian.png",
    7: "portraits/Eleanor.png",
    8: "portraits/Henrik.png",
    9: "portraits/Hodge.png",
    10: "portraits/Pemberton.png",
    11: "portraits/Anton.png",
    12: "portraits/Dubois.png",
    13: "portraits/Sarah.png",
    14: "portraits/Margaret.png"
  };
  // Non-person assets
  window.BMM_ASSETS = {
    manor: "portraits/Manor.png",
    study: "portraits/Study.png",
    bookend: "portraits/Bookend.png",
    manuscript: "portraits/Manuscript.png"
  };
  window.BMM_photoPath = function (pid) { return PHOTO[pid] || null; };

  window.BMM_avatarSvg = function (pid) {
    // If we have a real photograph, return an <img> — much more reliable
    // than <image href> inside an SVG (which fails in html-to-image).
    if (PHOTO[pid]) {
      return `<img src="${PHOTO[pid]}" alt="" loading="lazy" />`;
    }
    const inner = MUG[pid];
    if (!inner) {
      // Fallback generic silhouette
      return `<svg viewBox="0 0 64 76" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="76" fill="${BG_TINT}"/>
        <ellipse cx="32" cy="28" rx="11" ry="13" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
        <path d="M2,76 Q8,54 22,50 L42,50 Q56,54 62,76 Z" fill="${FACE_FILL}" stroke="${SKIN_LINE}" stroke-width="0.8"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 64 76" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="64" height="76" fill="${BG_TINT}"/>
      ${inner()}
      <!-- subtle paper grid -->
      <line x1="0" y1="76" x2="64" y2="76" stroke="${SKIN_LINE}" stroke-opacity="0.15" stroke-width="0.5"/>
    </svg>`;
  };
})();
