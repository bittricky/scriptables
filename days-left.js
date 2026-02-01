// Scriptable: Days Left in Year (Small Widget)
// Clean iOS-minimal, bar-free, no shadows/borders
// Adaptive Light/Dark (Color.dynamic)
// Semantics: "Days Left" includes today
// Refreshes daily shortly after midnight

// ---------- Helpers ----------
function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)
}

function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365
}

// DST-safe day-of-year (normalize to local noon)
function dayOfYear(d) {
  const y = d.getFullYear()
  const noon = new Date(y, d.getMonth(), d.getDate(), 12, 0, 0)
  const startNoon = new Date(y, 0, 1, 12, 0, 0)
  const ms = 24 * 60 * 60 * 1000
  return Math.floor((noon - startNoon) / ms) + 1
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function refreshAfterMidnight(minutes = 5) {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, minutes, 0)
}

function dc(lightHex, darkHex) {
  return Color.dynamic(new Color(lightHex), new Color(darkHex))
}

// ---------- Date Math ----------
const now = new Date()
const year = now.getFullYear()
const total = daysInYear(year)
const current = clamp(dayOfYear(now), 1, total)
const remaining = clamp(total - current + 1, 0, total)

// ---------- Theme (calm purple + cool complement) ----------
const THEME = {
  // Background gradient (soft, not “card”)
  bgTop: dc("F6F2FB", "12101A"),
  bgBottom: dc("FFFFFF", "08070C"),

  // Text
  label: dc("70798A", "A7ADBA"),
  primary: dc("3E2A7A", "E9E3FF"),
  secondary: dc("7D8698", "A1A9BA"),

  // Accent (subtle teal-sage)
  accent: dc("7FA7A2", "79B9B1"),

  // Hairline divider
  hairline: dc("E9E5F4", "1E1A2A"),
}

// ---------- Widget ----------
const w = new ListWidget()
w.setPadding(14, 14, 14, 14)

// Background gradient
const grad = new LinearGradient()
grad.colors = [THEME.bgTop, THEME.bgBottom]
grad.locations = [0, 1]
w.backgroundGradient = grad

// ---------- Top row: icon + label ----------
const top = w.addStack()
top.centerAlignContent()

const icon = top.addImage(SFSymbol.named("calendar").image)
icon.imageSize = new Size(13, 13)
icon.tintColor = THEME.label

top.addSpacer(6)

const label = top.addText("Days Left")
label.font = Font.semiboldSystemFont(12)
label.textColor = THEME.label
label.lineLimit = 1

// Right-side tiny accent dot (makes it feel designed, not busy)
top.addSpacer()
const dot = top.addText("•")
dot.font = Font.boldSystemFont(14)
dot.textColor = THEME.accent

w.addSpacer(10)

// ---------- Big number (monospaced digits for stability) ----------
const big = w.addText(String(remaining))
big.font = Font.boldMonospacedSystemFont(48)
big.textColor = THEME.primary
big.minimumScaleFactor = 0.5
big.lineLimit = 1

w.addSpacer(8)

// ---------- Hairline divider ----------
const hr = w.addStack()
hr.size = new Size(0, 1)
hr.backgroundColor = THEME.hairline
w.addSpacer(8)

// ---------- Bottom: date + context (two-line, balanced) ----------
const df = new DateFormatter()
df.dateFormat = "EEE, MMM d"

const dateLine = w.addText(`${df.string(now)} • ${year}`)
dateLine.font = Font.mediumSystemFont(11)
dateLine.textColor = THEME.secondary
dateLine.lineLimit = 1
dateLine.minimumScaleFactor = 0.8

const context = w.addText(`Day ${current} of ${total}`)
context.font = Font.semiboldSystemFont(11)
context.textColor = THEME.accent
context.lineLimit = 1
context.minimumScaleFactor = 0.8

// Refresh daily
w.refreshAfterDate = refreshAfterMidnight(5)

// Present
if (config.runsInWidget) {
  Script.setWidget(w)
} else {
  await w.presentSmall()
}
Script.complete()