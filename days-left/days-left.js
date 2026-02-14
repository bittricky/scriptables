// Scriptable: Days Left in Year (Small Widget)
// icon-color: blue; icon-glyph: magic;
// Semantics: "Days Left" includes today
// Refreshes daily shortly after midnight

// ---------- Helpers ----------
function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365;
}

function dayOfYear(d) {
  const y = d.getFullYear();
  const noon = new Date(y, d.getMonth(), d.getDate(), 12, 0, 0);
  const startNoon = new Date(y, 0, 1, 12, 0, 0);
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((noon - startNoon) / ms) + 1;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function refreshAfterMidnight(minutes = 5) {
  const n = new Date();
  return new Date(
    n.getFullYear(),
    n.getMonth(),
    n.getDate() + 1,
    0,
    minutes,
    0,
  );
}

function dc(lightHex, darkHex) {
  return Color.dynamic(new Color(lightHex), new Color(darkHex));
}

// ---------- Date Math ----------
const now = new Date();
const year = now.getFullYear();
const total = daysInYear(year);
const current = clamp(dayOfYear(now), 1, total);
const remaining = clamp(total - current + 1, 0, total);
const percentLeft = Math.round((remaining / total) * 100);

// ---------- Theme ----------
const THEME = {
  bgTop: dc("FAFAFA", "0D0D0D"),
  bgBottom: dc("F5F5F7", "000000"),
  eyebrow: dc("8E8E93", "98989D"),
  hero: dc("000000", "FFFFFF"),
  secondary: dc("3C3C43", "EBEBF5"),
  tertiary: dc("6E6E73", "AEAEB2"),
  accent: dc("007AFF", "0A84FF"),
};

// ---------- Widget ----------
const w = new ListWidget();
w.setPadding(16, 16, 16, 16);

const grad = new LinearGradient();
grad.colors = [THEME.bgTop, THEME.bgBottom];
grad.locations = [0, 1];
w.backgroundGradient = grad;

// Eyebrow
const eyebrow = w.addText("DAYS REMAINING");
eyebrow.font = Font.boldSystemFont(9);
eyebrow.textColor = THEME.eyebrow;

w.addSpacer(6);

// Hero number
const hero = w.addText(String(remaining));
hero.font = Font.boldRoundedSystemFont(56);
hero.textColor = THEME.hero;
hero.minimumScaleFactor = 0.4;

w.addSpacer(3);

// Footer
const df = new DateFormatter();
df.dateFormat = "EEE, MMM d";

const footer = w.addStack();
footer.layoutHorizontally();
footer.centerAlignContent();

const date = footer.addText(df.string(now).toUpperCase());
date.font = Font.semiboldSystemFont(10);
date.textColor = THEME.secondary;

footer.addSpacer();

const fraction = footer.addText(current + "/" + total);
fraction.font = Font.mediumSystemFont(10);
fraction.textColor = THEME.tertiary;

// Refresh
w.refreshAfterDate = refreshAfterMidnight(5);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentSmall();
}
Script.complete();
