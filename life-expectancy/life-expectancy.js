// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-clock;
/**
 * Life Expectancy (Large) — Scriptable
 * Preview -> Native widget (338x354)
 *
 * Optional widget parameter: "<mode>|<age>|<YYYY-MM-DD>"
 *   Examples:
 *     lifespan|80|1990-01-15
 *     retirement|65|1990-01-15
 */

//////////////////////// THEME ////////////////////////
const UI = {
  BG: new Color("#05050d"),
  OUTER_PAD: 16,

  TITLE: new Color("#e8e6ff"),
  MUTED: new Color("#8b82a8"),

  BAR_BG: new Color("#14121f"),
  BAR_FILL: new Color("#7b9cff"),
  BAR_H: 6,
  BAR_RADIUS: 4,

  HM_LIVED: new Color("#5b4b8a"),
  HM_NOW: new Color("#b794f6"),
  HM_FUTURE: new Color("#1e1b2e"),
  HM_BORDER: new Color("#3b4fa3"),
};

const SPEC = { w: 338, h: 354 };

//////////////////////// CONFIG ////////////////////////
const CFG = {
  DOB: "", // YYYY-MM-DD
  MODE: "lifespan", // lifespan | retirement
  TARGET_AGE: 80,
};

(function parseParam() {
  const raw = (args.widgetParameter || "").trim();
  if (!raw) return;
  const [m, a, d] = raw.split("|").map((s) => (s || "").trim());
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

    const title = left.addText("Now");
    title.textColor = UI.TITLE;
    title.font = Font.semiboldSystemFont(18);

    left.addSpacer(2);
    const subtitle = left.addText(
      CFG.MODE === "retirement"
        ? `To Retirement (Age ${CFG.TARGET_AGE})`
        : `Mileage (Age ${CFG.TARGET_AGE})`
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

    // ----- Web-style progress bar + % -----
    w.addSpacer(10);
    addWebStyleProgress(w, S.pctLived);

    // ----- Heatmap (6x12 grid) -----
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
    const t = s.addText("Heat Map — Error");
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
function addWebStyleProgress(parent, pct) {
  const container = parent.addStack();
  container.layoutVertically();

  // Progress bar container
  const barStack = container.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();

  const barWidth = 260;
  const dc = new DrawContext();
  dc.size = new Size(barWidth, UI.BAR_H);
  dc.opaque = false;

  // Base track
  dc.setFillColor(UI.BAR_BG);
  round(dc, 0, 0, barWidth, UI.BAR_H, UI.BAR_RADIUS, true);

  // Fill
  const fillW = Math.max(2, Math.floor(barWidth * pct));
  dc.setFillColor(UI.BAR_FILL);
  round(dc, 0, 0, fillW, UI.BAR_H, UI.BAR_RADIUS, true);

  const img = dc.getImage();
  const barImg = barStack.addImage(img);
  barImg.imageSize = new Size(barWidth, UI.BAR_H);
  barImg.leftAlignImage();

  // Progress text
  container.addSpacer(4);
  const pctText = container.addText(`${(pct * 100).toFixed(1)}% lived`);
  pctText.textColor = UI.BAR_FILL;
  pctText.font = Font.mediumSystemFont(10);
}

// 6x12 grid with blue borders
function addFixedHeatmap(parent, S) {
  const rows = 6;
  const cols = 12;
  const GAP = 3;
  const SIZE = 23;
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

      // Draw filled cell
      dc.setFillColor(fill);
      round(dc, x, y, SIZE, SIZE, RADIUS, true);

      // Draw border
      dc.setStrokeColor(UI.HM_BORDER);
      dc.setLineWidth(0.8);
      round(dc, x, y, SIZE, SIZE, RADIUS, false);
    }
  }

  const st = parent.addStack();
  st.centerAlignContent();
  const iv = st.addImage(dc.getImage());
  iv.imageSize = new Size(canvasW, canvasH);
  iv.centerAlignImage();
}

// Legend below grid
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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
