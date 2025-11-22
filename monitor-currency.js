// =============================
// CONFIGURATION
// =============================

// Default base currency (the one you're “holding”)
const BASE_CURRENCY = "USD";

// Default major currencies used for global trade
const TARGET_CURRENCIES = [
  "EUR", // Euro
  "JPY", // Japanese Yen
  "GBP", // British Pound
  "CHF", // Swiss Franc
  "CAD", // Canadian Dollar
  "AUD", // Australian Dollar
  "NZD", // New Zealand Dollar
  "INR"  // Indian Rupee
];

// Decimal places for percentage change
const PCT_DECIMALS = 2;

// =============================
// MAIN
// =============================

async function run() {
  // Defaults
  let base = BASE_CURRENCY.toUpperCase();
  let targets = TARGET_CURRENCIES.map(c => c.toUpperCase());

  // Widget parameter override:
  // Format: "BASE:CUR1,CUR2,CUR3,..."
  // Example: "EUR:USD,JPY,GBP"
  if (args.widgetParameter) {
    const param = args.widgetParameter.trim();
    const [bPart, tPart] = param.split(":");
    if (bPart) base = bPart.trim().toUpperCase();
    if (tPart) {
      targets = tPart
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
    }
  }

  if (!base || targets.length === 0) {
    throw new Error("Configure BASE_CURRENCY and at least one TARGET_CURRENCIES value.");
  }

  // Remove duplicates, keep up to 8 (we have exactly 8 by default)
  targets = Array.from(new Set(targets)).slice(0, 8);

  try {
    const yesterdayISO = getYesterdayISO();

    const latest = await fetchRates(base, targets, null);
    const previous = await fetchRates(base, targets, yesterdayISO);

    const rows = targets
      .map(symbol => {
        const latestRate = latest.rates[symbol];
        const prevRate = previous.rates[symbol];

        if (latestRate == null || prevRate == null) return null;

        const diff = latestRate - prevRate;
        const pct = (diff / prevRate) * 100;

        let arrow = "■";
        if (diff > 0) arrow = "▲";
        else if (diff < 0) arrow = "▼";

        const isDown = diff < 0;
        const isUp = diff > 0;
        const color = isDown
          ? Color.red()
          : isUp
          ? Color.green()
          : new Color("#FBBF24"); // yellow

        return {
          symbol,
          pct,
          arrow,
          color
        };
      })
      .filter(Boolean);

    const widget = await createWidget(base, latest.date, rows);

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  } catch (e) {
    console.error(e);
    const widget = new ListWidget();
    widget.backgroundColor = new Color("#111827");
    const t1 = widget.addText("FX Widget Error");
    t1.textColor = Color.red();
    t1.font = Font.boldSystemFont(14);
    const msg = widget.addText(String(e));
    msg.font = Font.systemFont(9);
    msg.textColor = Color.white();

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  }

  Script.complete();
}

async function fetchRates(base, targets, dateStr) {
  const baseEnc = encodeURIComponent(base);
  const symbolsEnc = encodeURIComponent(targets.join(","));
  const url = dateStr
    ? `https://api.frankfurter.app/${dateStr}?from=${baseEnc}&to=${symbolsEnc}`
    : `https://api.frankfurter.app/latest?from=${baseEnc}&to=${symbolsEnc}`;

  const req = new Request(url);
  const data = await req.loadJSON();

  console.log(`URL: ${url}`);
  console.log(`Response: ${JSON.stringify(data, null, 2)}`);

  if (!data || !data.rates) {
    throw new Error(`No rates data for ${base}`);
  }

  const rates = {};
  for (const t of targets) {
    if (data.rates[t] != null) {
      rates[t] = Number(data.rates[t]);
    }
  }

  return {
    date: data.date,
    rates
  };
}

function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function createWidget(base, dateStr, rows) {
  const widget = new ListWidget();

  // Background gradient
  const gradient = new LinearGradient();
  gradient.colors = [new Color("#111827"), new Color("#1F2933")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(8, 10, 8, 10);

  // Top: base + date
  const top = widget.addStack();
  top.layoutHorizontally();

  const baseText = top.addText(base);
  baseText.font = Font.semiboldSystemFont(13);
  baseText.textColor = Color.white();

  top.addSpacer();

  const dateText = top.addText(dateStr || "");
  dateText.font = Font.systemFont(9);
  dateText.textColor = new Color("#9CA3AF");

  widget.addSpacer(3);

  // Subtitle
  const sub = widget.addText("Majors vs yesterday");
  sub.font = Font.systemFont(9);
  sub.textColor = new Color("#9CA3AF");

  widget.addSpacer(4);

  // Single-column list of currencies
  // Line: [arrow] [SYM] [pct]
  for (const item of rows) {
    const line = widget.addStack();
    line.layoutHorizontally();
    line.centerAlignContent();

    const arrowText = line.addText(item.arrow);
    arrowText.font = Font.semiboldSystemFont(11);
    arrowText.textColor = item.color;

    line.addSpacer(4);

    const symText = line.addText(item.symbol);
    symText.font = Font.semiboldSystemFont(11);
    symText.textColor = Color.white();

    line.addSpacer();

    const pctSign = item.pct > 0 ? "+" : item.pct < 0 ? "" : "";
    const pctText = line.addText(`${pctSign}${item.pct.toFixed(PCT_DECIMALS)}%`);
    pctText.font = Font.systemFont(10);
    pctText.textColor = item.color;

    widget.addSpacer(1);
  }

  return widget;
}

await run();