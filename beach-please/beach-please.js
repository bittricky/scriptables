// Variables used by Scriptable.
// icon-color: blue; icon-glyph: map-marked-alt;
// Beach Please — Vacation Countdown
// Refreshes daily shortly after midnight
// Widget parameter (optional): "2026-12-20|Bali" — date|label

// ---------- Config ----------
const [paramDate, paramLabel] = (args.widgetParameter || "").split("|");
const VACATION_DATE = new Date(paramDate || "2026-12-20T00:00:00");
const LABEL = paramLabel || "Vacation";
const START_TRACKING = new Date("2026-07-01T00:00:00");

// ---------- Helpers ----------
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function daysBetween(a, b) {
  const noonA = new Date(a.getFullYear(), a.getMonth(), a.getDate(), 12, 0, 0);
  const noonB = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 12, 0, 0);
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((noonB - noonA) / ms);
}

function refreshAfterMidnight(minutes = 5) {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, minutes, 0);
}

function dc(lightHex, darkHex) {
  return Color.dynamic(new Color(lightHex), new Color(darkHex));
}

// ---------- Date Math ----------
const now = new Date();
const remaining = clamp(daysBetween(now, VACATION_DATE) + 1, 0, Infinity);
const totalSpan = Math.max(daysBetween(START_TRACKING, VACATION_DATE), 1);
const elapsed = clamp(daysBetween(START_TRACKING, now), 0, totalSpan);
const progress = clamp(elapsed / totalSpan, 0, 1);

// ---------- Theme ----------
const THEME = {
  bgTop: dc("EAF3FF", "0A1A33"),
  bgBottom: dc("F5FAFF", "000814"),
  eyebrow: dc("5A7CA8", "8AAEDC"),
  counter: dc("0A84FF", "409CFF"),
  secondary: dc("3C3C43", "EBEBF5"),
  tertiary: dc("6E6E73", "AEAEB2"),
  accent: dc("0A84FF", "409CFF"),
  track: dc("0A84FF1F", "FFFFFF26"),
};

// ---------- Widget ----------
const w = new ListWidget();
w.setPadding(16, 16, 16, 16);

const grad = new LinearGradient();
grad.colors = [THEME.bgTop, THEME.bgBottom];
grad.locations = [0, 1];
w.backgroundGradient = grad;

// Eyebrow
const eyebrowRow = w.addStack();
eyebrowRow.centerAlignContent();
const icon = SFSymbol.named("water.waves");
icon.applyFont(Font.boldSystemFont(9));
const iconImg = eyebrowRow.addImage(icon.image);
iconImg.tintColor = THEME.accent;
iconImg.imageSize = new Size(10, 10);
eyebrowRow.addSpacer(4);
const eyebrow = eyebrowRow.addText(LABEL.toUpperCase());
eyebrow.font = Font.boldSystemFont(9);
eyebrow.textColor = THEME.eyebrow;

w.addSpacer(6);

// Number
const counter = w.addText(String(remaining));
counter.font = Font.boldRoundedSystemFont(56);
counter.textColor = THEME.counter;
counter.minimumScaleFactor = 0.4;

const counterLabel = w.addText(remaining === 1 ? "DAY LEFT" : "DAYS LEFT");
counterLabel.font = Font.semiboldSystemFont(10);
counterLabel.textColor = THEME.tertiary;

w.addSpacer(8);

// Progress bar
const barBg = w.addStack();
barBg.backgroundColor = THEME.track;
barBg.cornerRadius = 2;
barBg.size = new Size(0, 4);
const barFg = barBg.addStack();
barFg.backgroundColor = THEME.accent;
barFg.cornerRadius = 2;
barFg.size = new Size(132 * progress, 4);
barBg.addSpacer();

w.addSpacer(6);

// Footer
const df = new DateFormatter();
df.dateFormat = "EEE, MMM d";

const footer = w.addStack();
footer.layoutHorizontally();
footer.centerAlignContent();

const date = footer.addText(df.string(VACATION_DATE).toUpperCase());
date.font = Font.semiboldSystemFont(10);
date.textColor = THEME.secondary;

footer.addSpacer();

const pct = footer.addText(Math.round(progress * 100) + "%");
pct.font = Font.mediumSystemFont(10);
pct.textColor = THEME.tertiary;

// Refresh
w.refreshAfterDate = refreshAfterMidnight(5);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentSmall();
}
Script.complete();
