/************ CONFIG ************/
const ACCENT_OUTER = "#8B5CF6"; // vivid purple (year)
const ACCENT_INNER = "#FACC15"; // vibrant yellow (quarter)
const ACCENT_TEXT = "#3B82F6"; // blue for side text

// Base ring colors
const BASE_RING_DARK = "#433366"; // deep contemplative purple
const BASE_RING_LIGHT = "#E5DEFF"; // soft lavender

// Backgrounds tuned to complement rings
const BG_GRAD_TOP = "#2A1A5E";
const BG_GRAD_BOTTOM = "#3B1D82";
const LIGHT_BG_TOP = "#FAF7FF";
const LIGHT_BG_BOTTOM = "#E0DBFF";

const USE_SYSTEM_FONT = true;
const SHOW_FOOTER_DATE = true;

// Ring geometry
const DIAMETER = 76; // overall size (px)
const OUTER_STROKE = 8; // thicker for visibility
const INNER_STROKE = 8; // thicker for visibility
const RING_GAP = 6; // gap between rings
const ARC_STEPS = 160; // smoothness
/********************************/

// ---------- Date & Quarter helpers ----------
function getQuarterInfo(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const q = Math.ceil(m / 3);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;

  const qStart = new Date(y, startMonth - 1, 1, 0, 0, 0, 0);
  const qEnd = new Date(y, endMonth, 0, 23, 59, 59, 999);

  const nextQuarter = q === 4 ? 1 : q + 1;
  const nextYear = q === 4 ? y + 1 : y;
  const nextStart = new Date(nextYear, (nextQuarter - 1) * 3, 1, 0, 0, 0, 0);

  const yearStart = new Date(y, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(y, 11, 31, 23, 59, 59, 999);

  const daysToNext = Math.max(0, Math.ceil((nextStart - d) / 86400000));
  const yearPct = Math.min(
    100,
    Math.max(0, ((d - yearStart) / (yearEnd - yearStart)) * 100)
  );
  const qPct = Math.min(
    100,
    Math.max(0, ((d - qStart) / (qEnd - qStart)) * 100)
  );

  return {
    year: y,
    quarter: q,
    nextQuarter,
    nextYear,
    nextStart,
    daysToNext,
    yearPct,
    qPct,
  };
}

const qLabel = (y, q) => `Q${q} ${y}`;
const dynamicColor = (dark, light) =>
  Color.dynamic(new Color(light), new Color(dark));
const fmtPct = (n) => `${n.toFixed(1)}%`;

// ---------- UI helpers ----------
function gradientBackground(widget) {
  const g = new LinearGradient();
  g.colors = [
    dynamicColor(BG_GRAD_TOP, LIGHT_BG_TOP),
    dynamicColor(BG_GRAD_BOTTOM, LIGHT_BG_BOTTOM),
  ];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(0, 1);
  widget.backgroundGradient = g;
}

/**
 * Draws an arc as a polyline from startAngle to endAngle (radians).
 * pct: 0..1
 */
function addArcPolyline(path, cx, cy, radius, pct, startAngle, steps) {
  const clamped = Math.max(0, Math.min(1, pct));
  const endAngle = startAngle + 2 * Math.PI * clamped;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + (endAngle - startAngle) * t;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) path.move(new Point(x, y));
    else path.addLine(new Point(x, y));
  }
}

/**
 * Produces a dual-ring image:
 * - Outer ring shows year progress
 * - Inner ring shows quarter progress
 */
function dualRingImage(diameter, yearPct, quarterPct) {
  const dc = new DrawContext();
  dc.opaque = false;
  dc.size = new Size(diameter, diameter);

  const cx = diameter / 2;
  const cy = diameter / 2;

  // Radii
  const outerRadius = (diameter - OUTER_STROKE) / 2;
  const innerRadius =
    outerRadius - (OUTER_STROKE / 2 + RING_GAP + INNER_STROKE / 2);

  // Base ring color
  const baseRingColor = Color.dynamic(
    new Color(BASE_RING_LIGHT),
    new Color(BASE_RING_DARK)
  );
  dc.setStrokeColor(baseRingColor);

  // Outer base
  dc.setLineWidth(OUTER_STROKE);
  dc.strokeEllipse(
    new Rect(
      cx - outerRadius,
      cy - outerRadius,
      outerRadius * 2,
      outerRadius * 2
    )
  );

  // Inner base
  dc.setLineWidth(INNER_STROKE);
  dc.strokeEllipse(
    new Rect(
      cx - innerRadius,
      cy - innerRadius,
      innerRadius * 2,
      innerRadius * 2
    )
  );

  // Progress arcs (12 o’clock start, clockwise)
  const start = -Math.PI / 2;

  // Outer: year
  if (yearPct > 0) {
    const p1 = new Path();
    addArcPolyline(
      p1,
      cx,
      cy,
      outerRadius,
      Math.max(0, Math.min(1, yearPct / 100)),
      start,
      ARC_STEPS
    );
    dc.setStrokeColor(new Color(ACCENT_OUTER));
    dc.setLineWidth(OUTER_STROKE);
    dc.addPath(p1);
    dc.strokePath();
  }

  // Inner: quarter
  if (quarterPct > 0) {
    const p2 = new Path();
    addArcPolyline(
      p2,
      cx,
      cy,
      innerRadius,
      Math.max(0, Math.min(1, quarterPct / 100)),
      start,
      ARC_STEPS
    );
    dc.setStrokeColor(new Color(ACCENT_INNER));
    dc.setLineWidth(INNER_STROKE);
    dc.addPath(p2);
    dc.strokePath();
  }

  const r = 7; // radius (px)
  dc.setStrokeColor(new Color("#EF4444")); // crimson
  dc.setLineWidth(1);
  dc.strokeEllipse(new Rect(cx - r, cy - r, r * 2, r * 2));
  
  return dc.getImage();
}

// ---------- Build widget ----------
async function createWidget() {
  const info = getQuarterInfo(new Date());

  const w = new ListWidget();
  gradientBackground(w);
  w.setPadding(12, 14, 12, 14);

  // Header
  const header = w.addStack();
  header.centerAlignContent();

  const cal = header.addImage(SFSymbol.named("calendar").image);
  cal.imageSize = new Size(16, 16);
  cal.tintColor = dynamicColor("#D8CCFF", "#5C4DD6");
  header.addSpacer(6);

  const title = header.addText(
    `${qLabel(info.year, info.quarter)}  •  ${info.daysToNext} d →  ${qLabel(
      info.nextYear,
      info.nextQuarter
    )}`
  );

  title.textColor = dynamicColor("#ECEAFF", "#1B2040");
  title.font = USE_SYSTEM_FONT
    ? Font.boldSystemFont(14)
    : new Font("Menlo-Bold", 12);

  w.addSpacer(8);

  // Main layout: dual ring + labels
  const main = w.addStack();
  main.layoutHorizontally();
  main.centerAlignContent();
  main.spacing = 10;

  const ringImg = dualRingImage(DIAMETER, info.yearPct, info.qPct);
  const ring = main.addImage(ringImg);
  ring.imageSize = new Size(DIAMETER, DIAMETER);

  const right = main.addStack();
  right.layoutVertically();
  right.spacing = 3;

  const l1 = right.addText(`Year:   ${fmtPct(info.yearPct)}`);
  l1.font = Font.mediumSystemFont(13);
  l1.textColor = new Color(ACCENT_OUTER);

  const l2 = right.addText(`Quarter: ${fmtPct(info.qPct)}`);
  l2.font = Font.mediumSystemFont(13);
  l2.textColor = new Color(ACCENT_INNER);

  const l3 = right.addText(
    `→ ${info.daysToNext} days to ${qLabel(info.nextYear, info.nextQuarter)}`
  );
  l3.font = Font.semiboldSystemFont(12);
  l3.textColor = new Color(ACCENT_TEXT);

  if (SHOW_FOOTER_DATE) {
    w.addSpacer();
    const foot = w.addStack();
    const clock = foot.addImage(SFSymbol.named("clock").image);
    clock.imageSize = new Size(14, 14);
    clock.tintColor = dynamicColor("#AEBBD3", "#52617B");
    foot.addSpacer(5);
    const fTxt = foot.addText(
      `Next quarter starts: ${info.nextStart.toDateString()}`
    );
    fTxt.font = Font.regularSystemFont(11);
    fTxt.textColor = dynamicColor("#AEBBD3", "#52617B");
  }

  return w;
}

// ---------- Run ----------
const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
