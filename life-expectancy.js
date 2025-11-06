/**
 * Life Calendar (Large) — Scriptable
 * Preview -> Native widget (338x354)
 *
 * Optional widget parameter: "<mode>|<age>|<YYYY-MM-DD>"
 *   Examples:
 *     lifespan|80|1990-01-15
 *     retirement|65|1990-01-15
 */

//////////////////////// THEME ////////////////////////
const UI = {
  // Flat single-surface background (no inner card/border)
  BG: new Color("#1a1b26"),
  OUTER_PAD: 16,

  // Text
  TITLE: new Color("#c0caf5"),
  MUTED: new Color("#565f89"),

  // Progress
  BAR_BG: new Color("#24283b"),
  BAR_FILL: new Color("#7aa2f7"),
  BAR_H: 6,

  // Heatmap
  HM_LIVED: new Color("#7aa2f7"),
  HM_NOW: new Color("#bb9af7"),
  HM_FUTURE: new Color("#24283b"),
};

const SPEC = { w: 338, h: 354 };

//////////////////////// CONFIG ////////////////////////
const CFG = {
  DOB: "", //YYYY-MM-DD
  MODE: "lifespan", // lifespan || retirment
  TARGET_AGE: 80, // lifespan or retirement
};

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

    const S = computeStats(CFG.DOB, CFG.TARGET_AGE);

    // ----- Header -----
    const header = w.addStack();
    header.layoutHorizontally();

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
    const years = right.addText(`${S.yearsLived} years`);
    years.textColor = UI.TITLE;
    years.font = Font.semiboldSystemFont(14);
    const months = right.addText(`${S.monthsLived.toLocaleString()} months`);
    months.textColor = UI.MUTED;
    months.font = Font.mediumSystemFont(10);

    // ----- DOB -----
    w.addSpacer(8);
    const dobRow = w.addStack();
    const born = dobRow.addText("Born: ");
    born.textColor = UI.MUTED;
    born.font = Font.mediumSystemFont(11);
    const dobText = dobRow.addText(formatDOB(CFG.DOB));
    dobText.textColor = UI.TITLE;
    dobText.font = Font.mediumSystemFont(11);

    // ----- Progress -----
    w.addSpacer(8);
    addProgress(w, S.pctLived);

    // ----- Heatmap (fixed 7x11 grid with spacing) -----
    w.addSpacer(10);
    addFixedHeatmap(w, S);

    // ----- Legend -----
    w.addSpacer(8);
    addLegendBelow(w);

    Script.setWidget(w);
    if (config.runsInApp) await w.presentLarge();
  } catch (e) {
    const w = new ListWidget();
    w.backgroundColor = UI.BG;
    const s = w.addStack();
    s.layoutVertically();
    s.setPadding(16, 16, 16, 16);
    const t = s.addText("Life Calendar — Error");
    t.textColor = new Color("#ffb4b4");
    t.font = Font.boldSystemFont(14);
    s.addSpacer(6);
    const m = s.addText(String(e));
    m.textColor = new Color("#ffb4b4");
    m.font = Font.systemFont(11);
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

// Fixed 7x11 grid with 3px spacing
function addFixedHeatmap(parent, S) {
  const rows = 7;
  const cols = 11;
  const GAP = 3;
  const SIZE = 24;
  const RADIUS = 2;

  const canvasW = cols * SIZE + (cols - 1) * GAP;
  const canvasH = rows * SIZE + (rows - 1) * GAP;

  const dc = new DrawContext();
  dc.size = new Size(canvasW, canvasH);
  dc.opaque = false;

  const totalCells = rows * cols;
  const livedYears = Math.min(S.yearsLived, totalCells - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = c * (SIZE + GAP);
      const y = r * (SIZE + GAP);

      let fill = UI.HM_FUTURE;
      if (idx < livedYears) fill = UI.HM_LIVED;
      else if (idx === livedYears) fill = UI.HM_NOW;

      dc.setFillColor(fill);
      round(dc, x, y, SIZE, SIZE, RADIUS, true);
    }
  }

  const st = parent.addStack();
  st.centerAlignContent();
  const iv = st.addImage(dc.getImage());
  iv.imageSize = new Size(canvasW, canvasH);
  iv.centerAlignImage();
}

// Clean centered legend below the grid
function addLegendBelow(parent) {
  const legend = parent.addStack();
  legend.centerAlignContent();
  legend.layoutHorizontally();
  legend.spacing = 12;

  function chip(color, label) {
    const stack = legend.addStack();
    stack.centerAlignContent();
    const box = new DrawContext();
    box.size = new Size(10, 10);
    box.opaque = false;
    box.setFillColor(color);
    round(box, 0, 0, 10, 10, 2, true);
    const boxImg = box.getImage();
    const iv = stack.addImage(boxImg);
    iv.imageSize = new Size(10, 10);
    stack.addSpacer(4);
    const txt = stack.addText(label);
    txt.textColor = UI.MUTED;
    txt.font = Font.mediumSystemFont(9);
  }

  chip(UI.HM_LIVED, "Lived");
  legend.addSpacer(12);
  chip(UI.HM_NOW, "Now");
  legend.addSpacer(12);
  chip(UI.HM_FUTURE, "Future");
}

//////////////////////// HELPERS ////////////////////////
function computeStats(dobISO, targetAge) {
  const dob = new Date(`${dobISO}T00:00:00`);
  const now = new Date();
  const yearsLived = Math.max(
    0,
    Math.floor((now - dob) / (365.2425 * 24 * 3600 * 1000))
  );
  const monthsLived = Math.max(0, Math.floor(yearsLived * 12));
  const pctLived = Math.min(1, yearsLived / Math.max(1, targetAge));
  return { yearsLived, monthsLived, pctLived };
}

function formatDOB(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const m = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function round(dc, x, y, w, h, r, fill) {
  const p = new Path();
  p.addRoundedRect(new Rect(x, y, w, h), r, r);
  dc.addPath(p);
  if (fill) dc.fillPath();
  else dc.strokePath();
}