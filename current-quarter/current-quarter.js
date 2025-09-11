const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const currentQuarter = Math.ceil(month / 3);

const qStarts = [
  new Date(year, 0, 1), // Q1
  new Date(year, 3, 1), // Q2
  new Date(year, 6, 1), // Q3
  new Date(year, 9, 1), // Q4
];

const idx = currentQuarter - 1;
const nextIdx = (idx + 1) % 4;
const nextQuarter = nextIdx + 1;
const nextQuarterYear = nextIdx === 0 ? year + 1 : year;
const nextStart = nextIdx === 0 ? new Date(year + 1, 0, 1) : qStarts[nextIdx];

// Helper: midnight for clean day math
const atMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const msPerDay = 86400000;

const daysLeft = Math.max(
  0,
  Math.ceil((atMidnight(nextStart) - atMidnight(now)) / msPerDay)
);

const current = `Q${currentQuarter} ${year}`;
const abbrev_current = `Q${currentQuarter}`;
const next = `Q${nextQuarter} ${nextQuarterYear}`;
const abbrev_next = `Q${nextQuarter}`;

const yearStart = new Date(year, 0, 1);
const nextYearStart = new Date(year + 1, 0, 1);
const elapsed = atMidnight(now) - atMidnight(yearStart);
const total = atMidnight(nextYearStart) - atMidnight(yearStart);
const year_progress = Math.floor((elapsed / total) * 1000) / 10; // 1 decimal

let display = `${current} (${abbrev_current}) • ${daysLeft} d → ${next} (${abbrev_next})\n`;
display += `---\n`;
display += `Current quarter: ${current} (${abbrev_current})\n`;
display += `Next quarter: ${next} (${abbrev_next})\n`;
display += `Days remaining to next quarter: ${daysLeft} d\n`;
display += `Year Progress: ${year_progress}%`;

console.log(display);
QuickLook.present(display);
Script.setShortcutOutput(display);
