/**
 * Affirmations / Quotes Widget (Scriptable)
 * Sources:
 *  - Affirmations.dev
 *  - ZenQuotes.io
 *  - Quotable (api.quotable.io)
 *  - AffirmationAPI (affirmationapi.com)
 *
 * Features:
 *  - Robust caching per API
 *  - Online fallback to alternate APIs
 *  - Safe defaults
 *  - Uses Scriptable global `config` for widget context (runsInWidget/widgetFamily)
 */

// -------------------------
// Settings (do NOT name this `config`)
// -------------------------
const SETTINGS = {
  useRandomApi: true,
  apiSource: "affirmations", // used only when useRandomApi = false

  apis: {
    affirmations: {
      url: "https://www.affirmations.dev",
      name: "Affirmations.dev",
      parse: (response) => {
        if (response?.affirmation) {
          return { text: response.affirmation, author: null };
        }
        return null;
      },
    },

    zenquotes: {
      url: "https://zenquotes.io/api/random",
      name: "ZenQuotes.io",
      parse: (response) => {
        if (Array.isArray(response) && response.length > 0) {
          const q = response[0];
          if (q?.q) return { text: q.q, author: q?.a ?? null };
        }
        return null;
      },
    },

    // Added: Quotable (high-quality quotes with reliable author field)
    quotable: {
      url: "https://api.quotable.io/quotes/random?limit=1",
      name: "Quotable",
      parse: (response) => {
        // /quotes/random returns an array of quote objects
        if (Array.isArray(response) && response.length > 0) {
          const q = response[0];
          if (q?.content) return { text: q.content, author: q?.author ?? null };
        }
        return null;
      },
    },

    // Added: AffirmationAPI (emotionally supportive affirmations)
    affirmationapi: {
      url: "https://affirmationapi.com/api/random",
      name: "AffirmationAPI",
      parse: (response) => {
        if (response?.affirmation) {
          return { text: response.affirmation, author: null };
        }
        return null;
      },
    },
  },

  refreshIntervalMinutes: 30,
  maxRetries: 3,
  timeoutMs: 10000,

  // Optional: show “Updated” footer only on large widgets
  showFooterOnLarge: true,
};

// -------------------------
// Styling
// -------------------------
const COLORS = {
  // Dynamic colors so it looks good in light/dark mode
  background: Color.dynamic(new Color("#FFFFFF"), new Color("#0B0B0F")),
  text: Color.dynamic(new Color("#8B7EC8"), new Color("#B8AEFF")),
  accent: Color.dynamic(new Color("#2D1B3D"), new Color("#D9D2FF")),
  muted: Color.dynamic(new Color("#7A7A7A"), new Color("#A0A0A0")),
  error: new Color("#FF6B6B"),
};

// Font sizes per widget family
const FONT_SIZES = {
  small: { main: 12, author: 10, footer: 9 },
  medium: { main: 18, author: 12, footer: 10 },
  large: { main: 24, author: 14, footer: 10 },
};

// Line limits per widget family
const LINE_LIMITS = {
  small: 3,
  medium: 5,
  large: 7,
};

// -------------------------
// Helpers
// -------------------------
const fm = FileManager.local();
const DOCS = fm.documentsDirectory();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function withJitter(ms) {
  // Adds up to 20% jitter
  const jitter = ms * (0.8 + Math.random() * 0.4);
  return Math.floor(jitter);
}

function getWidgetSize() {
  const allowed = ["small", "medium", "large"];

  // Scriptable’s global config.widgetFamily is the most reliable
  if (config.widgetFamily && allowed.includes(config.widgetFamily)) return config.widgetFamily;

  // Optional manual param via widget parameter: "small|medium|large"
  if (args.widgetParameter) {
    const p = String(args.widgetParameter).trim().toLowerCase();
    if (allowed.includes(p)) return p;
  }

  return "medium";
}

function cachePath(apiKey) {
  return fm.joinPath(DOCS, `quote_cache_${apiKey}.json`);
}

function readCache(apiKey) {
  const path = cachePath(apiKey);
  if (!fm.fileExists(path)) return null;

  try {
    const raw = fm.readString(path);
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.data?.text) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(apiKey, data) {
  const path = cachePath(apiKey);
  const payload = { savedAt: Date.now(), data };
  fm.writeString(path, JSON.stringify(payload));
}

function isCacheFresh(cacheObj) {
  if (!cacheObj?.savedAt) return false;
  const ageMinutes = (Date.now() - cacheObj.savedAt) / (1000 * 60);
  return ageMinutes < SETTINGS.refreshIntervalMinutes;
}

function pickApiKey() {
  const keys = Object.keys(SETTINGS.apis);
  if (!SETTINGS.useRandomApi) return SETTINGS.apiSource in SETTINGS.apis ? SETTINGS.apiSource : keys[0];
  return keys[Math.floor(Math.random() * keys.length)];
}

async function fetchJsonWithRetries(url) {
  let lastErr = null;

  for (let attempt = 1; attempt <= SETTINGS.maxRetries; attempt++) {
    try {
      const req = new Request(url);
      req.timeoutInterval = Math.floor(SETTINGS.timeoutMs / 1000); // Scriptable expects seconds
      req.headers = {
        Accept: "application/json",
        "User-Agent": "ScriptableWidget/1.0",
      };

      const json = await req.loadJSON();
      return json;
    } catch (e) {
      lastErr = e;
      // Exponential backoff: 1s, 2s, 4s (with jitter)
      if (attempt < SETTINGS.maxRetries) {
        const backoff = withJitter(Math.pow(2, attempt - 1) * 1000);
        await sleep(backoff);
      }
    }
  }

  throw lastErr ?? new Error("Request failed");
}

/**
 * Attempts:
 * 1) Return fresh cache for selected API (if present)
 * 2) Fetch selected API online
 * 3) Fetch other APIs online
 * 4) Return any cache available (selected first, then other)
 * 5) Final hardcoded fallback
 */
async function getAffirmationData() {
  const apiKeys = Object.keys(SETTINGS.apis);
  const selectedApiKey = pickApiKey();
  const otherApiKeys = apiKeys.filter((k) => k !== selectedApiKey);

  // 1) Fresh cache for selected
  const selectedCache = readCache(selectedApiKey);
  if (selectedCache && isCacheFresh(selectedCache)) {
    return { ...selectedCache.data, source: SETTINGS.apis[selectedApiKey].name, fromCache: true };
  }

  // 2) Try selected online
  const selectedOnline = await tryFetchFromApi(selectedApiKey);
  if (selectedOnline) return selectedOnline;

  // 3) Try other APIs online
  for (const k of otherApiKeys) {
    const otherOnline = await tryFetchFromApi(k);
    if (otherOnline) return otherOnline;
  }

  // 4) Any cache available
  if (selectedCache?.data?.text) {
    return { ...selectedCache.data, source: SETTINGS.apis[selectedApiKey].name, fromCache: true };
  }
  for (const k of otherApiKeys) {
    const c = readCache(k);
    if (c?.data?.text) return { ...c.data, source: SETTINGS.apis[k].name, fromCache: true };
  }

  // 5) Hardcoded fallback
  const fallback = [
    "You are capable of amazing things.",
    "Today is full of possibilities.",
    "You have the strength to overcome challenges.",
    "Your potential is limitless.",
    "You do You",
    "D&D it's dynomite",
    "Just Breathe",
    "Your trauma doesn't have to define you",
    "It’s okay to take things one step at a time.",
    "Small progress is still progress",
    "Don't lose yourself to comparisons",
    "Believe in your own efforts, even when it feels invisible.",
    "Misunderstanding does not equal wrongdoing.",
    "History informs, but it does not have to define.",
    "You are more than your mistakes.",
    "Being human includes imperfection.",
    "Strength does not always look loud and glamorous.",
    "Rest is also progress.",
    "Struggle does not erase worth.",
    "You are worthy of kindness, especially from yourself.",
    "Healing is not linear.",
    "Money measures exchange, it does not always have to define the value of a human being.",
    "Outcomes can hide unseen costs.",
    "Social comparison alters self-evaluation, not ability.",
    "Comparison bends the mirror.",
    "What is shown may not be the whole.",
    "Status and wealth can measure position, but not substance."
  ];
  return {
    text: fallback[Math.floor(Math.random() * fallback.length)],
    author: null,
    source: "Fallback",
    fromCache: false,
  };
}

async function tryFetchFromApi(apiKey) {
  const api = SETTINGS.apis[apiKey];
  try {
    const response = await fetchJsonWithRetries(api.url);
    const parsed = api.parse(response);
    if (!parsed?.text) return null;

    const data = { text: parsed.text, author: parsed.author, source: api.name, fromCache: false };
    writeCache(apiKey, { text: data.text, author: data.author }); // cache only core fields
    return data;
  } catch (e) {
    console.log(`API ${apiKey} failed: ${e?.message ?? e}`);
    return null;
  }
}

function formatTime(ts = Date.now()) {
  // Short time like “2:41 PM”
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// -------------------------
// Widget UI
// -------------------------
async function createWidget(size) {
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(16, 16, 16, 16);

  try {
    const data = await getAffirmationData();
    const fonts = FONT_SIZES[size] ?? FONT_SIZES.medium;

    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();

    if (size !== "small") mainStack.addSpacer();

    // Main text
    const main = mainStack.addText(data.text);
    main.font = Font.boldSystemFont(fonts.main);
    main.textColor = COLORS.text;
    main.centerAlignText();

    main.lineLimit = LINE_LIMITS[size] ?? 5;
    main.minimumScaleFactor = size === "small" ? 0.75 : size === "medium" ? 0.82 : 0.9;

    // Author
    if (data.author && size !== "small") {
      mainStack.addSpacer(8);
      const author = mainStack.addText(`— ${data.author}`);
      author.font = Font.italicSystemFont(fonts.author);
      author.textColor = COLORS.accent;
      author.centerAlignText();
      author.lineLimit = 1;
      author.minimumScaleFactor = 0.85;
    }

    if (size !== "small") mainStack.addSpacer();

    // Footer (large only)
    if (size === "large" && SETTINGS.showFooterOnLarge) {
      mainStack.addSpacer(6);
      const footer = `${data.source}${data.fromCache ? " • Cached" : ""} • Updated: ${formatTime()}`;
      const foot = mainStack.addText(footer);
      foot.font = Font.systemFont(fonts.footer);
      foot.textColor = COLORS.muted;
      foot.centerAlignText();
      foot.lineLimit = 1;
      foot.minimumScaleFactor = 0.8;
    }
  } catch (e) {
    const err = widget.addText("Unable to load affirmation");
    err.font = Font.systemFont((FONT_SIZES[size]?.main ?? 16) - 2);
    err.textColor = COLORS.error;
    err.centerAlignText();
  }

  return widget;
}

// -------------------------
// Main
// -------------------------
async function main() {
  const size = getWidgetSize();
  const widget = await createWidget(size);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    if (size === "small") await widget.presentSmall();
    else if (size === "large") await widget.presentLarge();
    else await widget.presentMedium();
  }

  Script.complete();
}

await main();
