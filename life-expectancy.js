/**
 * Life Calendar (Large) — Scriptable
 * Preview -> Native widget (338x354)
 *
 * Optional widget parameter: "<mode>|<age>|<YYYY-MM-DD>"
 *   Examples:
 *     lifespan|80|1990-01-15
 *     retirement|65|1990-01-15
 */

//////////////////////// THEME (matches your preview) ////////////////////////
const UI = {
  // Surfaces
  BG: new Color("#0f0f17"),
  CARD: new Color("#1a1b26"),
  CARD_RADIUS: 20,
  OUTER_PAD: 16,  // widget -> card
  CARD_PAD: 16,   // inside card

  // Text
  TITLE: new Color("#c0caf5"),
  MUTED: new Color("#565f89"),

  // Progress
  BAR_BG: new Color("#24283b"),
  BAR_FILL: new Color("#7aa2f7"),
  BAR_H: 6,

  // Heatmap colors (years)
  HM_LIVED: new Color("#7aa2f7"),
  HM_NOW: new Color("#bb9af7"),
  HM_FUTURE: new Color("#24283b"),
  HM_BORDER: new Color("#414868"),
};

//////////////////////// TARGET: Large widget px box ////////////////////////
const SPEC = { w: 338, h: 354 }; // Apple’s large size (portrait column)

//////////////////////// CONFIG ////////////////////////
const CFG = {
  DOB: "", //YYYY-MM-DD
  MODE: "lifespan",      // "lifespan" | "retirement"
  TARGET_AGE: 80,        // lifespan age or retirement age
};

// Allow widget parameter "<mode>|<age>|<YYYY-MM-DD>"
(function parseParam() {
  const raw = (args.widgetParameter || "").trim();
  if (!raw) return;
  const [m, a, d] = raw.split("|").map(s => (s || "").trim());
  if (m === "lifespan" || m === "retirement") CFG.MODE = m;
  const age = parseInt(a, 10);
  if (!isNaN(age)) CFG.TARGET_AGE = age;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) CFG.DOB = d;
})();

//////////////////////// MAIN ////////////////////////
(async () => {
  try {
    const w = new ListWidget();
    w.backgroundColor = UI.BG;
    w.setPadding(UI.OUTER_PAD, UI.OUTER_PAD, UI.OUTER_PAD, UI.OUTER_PAD);

    // Card
    const card = w.addStack();
    card.layoutVertically();
    card.backgroundColor = UI.CARD;
    card.cornerRadius = UI.CARD_RADIUS;
    card.setPadding(UI.CARD_PAD, UI.CARD_PAD, UI.CARD_PAD, UI.CARD_PAD);

    // Stats
    const S = computeStats(CFG.DOB, CFG.TARGET_AGE);

    // ----- Header -----
    const header = card.addStack();
    header.layoutHorizontally();
    header.centerAlignContent();

    const left = header.addStack();
    left.layoutVertically();

    const title = left.addText("Life Calendar");
    title.textColor = UI.TITLE;
    title.font = Font.semiboldSystemFont(18);

    left.addSpacer(2);
    const subtitle = left.addText(
      CFG.MODE === "retirement"
        ? `To Retirement (Age ${CFG.TARGET_AGE})`
        : `Life Expectancy (Age ${CFG.TARGET_AGE})`
    );
    subtitle.textColor = UI.MUTED;
    subtitle.font = Font.mediumSystemFont(11);

    header.addSpacer();

    const right = header.addStack();
    right.layoutVertically();
    right.setPadding(0,0,0,0);

    const years = right.addText(`${S.yearsLived} years`);
    years.textColor = UI.TITLE;
    years.font = Font.semiboldSystemFont(14);

    const months = right.addText(`${S.monthsLived.toLocaleString()} months`);
    months.textColor = UI.MUTED;
    months.font = Font.mediumSystemFont(10);

    // ----- DOB -----
    card.addSpacer(8);
    const dobRow = card.addStack();
    const born = dobRow.addText("Born: ");
    born.textColor = UI.MUTED; born.font = Font.mediumSystemFont(11);
    const dobText = dobRow.addText(formatDOB(CFG.DOB));
    dobText.textColor = UI.TITLE; dobText.font = Font.mediumSystemFont(11);

    // ----- Progress -----
    card.addSpacer(8);
    addProgress(card, S.pctLived);

    // ----- Heatmap (years) -----
    card.addSpacer(10);
    addYearsHeatmap(card, S, SPEC);

    // ----- Legend -----
    card.addSpacer(8);
    addLegend(card);

    Script.setWidget(w);
    if (config.runsInApp) await w.presentLarge();
  } catch (e) {
    const w = new ListWidget();
    w.backgroundColor = UI.BG;
    const s = w.addStack(); s.layoutVertically(); s.setPadding(16,16,16,16);
    const t = s.addText("Life Calendar — Error");
    t.textColor = new Color("#ffb4b4"); t.font = Font.boldSystemFont(14);
    s.addSpacer(6);
    const m = s.addText(String(e)); m.textColor = new Color("#ffb4b4"); m.font = Font.systemFont(11);
    Script.setWidget(w);
    if (config.runsInApp) await w.presentLarge();
  }
})();

//////////////////////// RENDERING ////////////////////////

function addProgress(parent, pct) {
  const wrap = parent.addStack();
  wrap.layoutVertically();

  const W = 1000, H = UI.BAR_H * 6;
  const dc = new DrawContext();
  dc.size = new Size(W, H);
  dc.opaque = false;

  dc.setFillColor(UI.BAR_BG);
  round(dc, 0, 0, W, H, 4, true);

  dc.setFillColor(UI.BAR_FILL);
  round(dc, 0, 0, Math.max(2, Math.floor(W * pct)), H, 4, true);

  const img = dc.getImage();
  const iv = wrap.addImage(img);
  iv.imageSize = new Size(0, UI.BAR_H);

  const lbl = parent.addText(`${(pct * 100).toFixed(1)}% lived`);
  lbl.textColor = UI.MUTED;
  lbl.font = Font.mediumSystemFont(10);
}

function addYearsHeatmap(parent, S, spec) {
  // Compute remaining vertical area exactly for Large: 338x354
  const contentW = spec.w - 2*UI.OUTER_PAD - 2*UI.CARD_PAD;
  const contentH = spec.h - 2*UI.OUTER_PAD - 2*UI.CARD_PAD;

  // Estimate occupied vertical space above grid
  const takenTop =
    22  + // title+subtitle block approx
    16  + // DOB row + spacing
    14  + // progress bar+label
    10;   // spacer before grid
  const takenBottom = 20; // legend + spacer

  const gridH = Math.max(120, contentH - takenTop - takenBottom);
  const gridW = contentW;

  // Layout strategy: choose yearsPerRow based on target age (like your HTML)
  const yearsPerRow = chooseYearsPerRow(CFG.TARGET_AGE);
  const rows = Math.ceil(CFG.TARGET_AGE / yearsPerRow);

  // Shrink-to-fit cell size with 3px gaps and 0.5px border
  const GAP = 3;
  const cellSizeX = Math.floor((gridW - (yearsPerRow - 1) * GAP) / yearsPerRow);
  const cellSizeY = Math.floor((gridH - (rows - 1) * GAP) / rows);
  const SIZE = Math.max(6, Math.min(cellSizeX, cellSizeY));
  const RADIUS = 2;

  const canvasW = yearsPerRow * SIZE + (yearsPerRow - 1) * GAP;
  const canvasH = rows * SIZE + (rows - 1) * GAP;

  const dc = new DrawContext();
  dc.size = new Size(canvasW, canvasH);
  dc.opaque = false;

  const livedYears = S.yearsLived;
  // Draw cells row-major
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < yearsPerRow; c++) {
      const yIndex = r * yearsPerRow + c; // 0-based year
      if (yIndex >= CFG.TARGET_AGE) break;
      const x = c * (SIZE + GAP);
      const y = r * (SIZE + GAP);

      // fill color
      let fill = UI.HM_FUTURE;
      if (yIndex < livedYears) fill = UI.HM_LIVED;
      else if (yIndex === livedYears) fill = UI.HM_NOW;

      dc.setFillColor(fill);
      round(dc, x, y, SIZE, SIZE, RADIUS, true);

      // border
      dc.setStrokeColor(UI.HM_BORDER);
      dc.setLineWidth(0.5);
      round(dc, x, y, SIZE, SIZE, RADIUS, false);
    }
  }

  const st = parent.addStack();
  const iv = st.addImage(dc.getImage());
  iv.imageSize = new Size(canvasW, canvasH);
  iv.centerAlignImage();
}

function addLegend(parent) {
  const row = parent.addStack();
  row.centerAlignContent();
  function chip(color, label) {
    const s = row.addStack();
    s.centerAlignContent();
    const dc = new DrawContext();
    dc.size = new Size(18, 12);
    dc.opaque = false;
    dc.setFillColor(color);
    round(dc, 0, 0, 10, 10, 2, true);
    const img = dc.getImage();
    const iv = s.addImage(img);
    iv.imageSize = new Size(10,10);
    s.addSpacer(4);
    const t = s.addText(label);
    t.textColor = UI.MUTED;
    t.font = Font.mediumSystemFont(9);
  }
  chip(UI.HM_LIVED, "Lived"); row.addSpacer(12);
  chip(UI.HM_NOW, "Now");     row.addSpacer(12);
  chip(UI.HM_FUTURE, "Future");
}

//////////////////////// CALCS + HELPERS ////////////////////////
function computeStats(dobISO, targetAge) {
  const dob = new Date(`${dobISO}T00:00:00`);
  if (isNaN(dob.getTime())) throw new Error(`Invalid DOB: ${dobISO}`);

  const now = new Date();
  // years lived (approx, same spirit as preview)
  const yearsLived = Math.max(0, Math.floor((now - dob) / (365.2425 * 24 * 3600 * 1000)));
  const monthsLived = Math.max(0, Math.floor(yearsLived * 12));
  const pctLived = Math.min(1, yearsLived / Math.max(1, targetAge));

  return { yearsLived, monthsLived, pctLived };
}

function chooseYearsPerRow(targetAge) {
  if (targetAge <= 40) return 10;
  if (targetAge <= 60) return 12;
  if (targetAge <= 80) return 10;
  return 12;
}

function formatDOB(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function round(dc, x, y, w, h, r, fill) {
  const p = new Path();
  p.addRoundedRect(new Rect(x, y, w, h), r, r);
  dc.addPath(p);
  if (fill) dc.fillPath(); else dc.strokePath();
}