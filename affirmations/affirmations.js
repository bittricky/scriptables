const config = {
  affirmationUrl: "https://www.affirmations.dev",
  refreshInterval: 30, // minutes
  maxRetries: 3,
  timeout: 10000, // 10 seconds
};

const styling = {
  textColor: new Color("#F8F6FF"),
  backgroundColor: new Color("#2D1B3D"),
  accentColor: new Color("#8B7EC8"),
  errorColor: new Color("#FF6B6B"),
  shadowColor: new Color("#1A0F26", 0.4),

  fonts: {
    small: 12,
    medium: 18,
    large: 24,
  },

  padding: 16,
  spacing: 8,
};

function getWidgetSize() {
  const sizes = ["small", "medium", "large"];

  if (config.widgetFamily) {
    return config.widgetFamily;
  }
  if (args.widgetParameter) {
    const paramSize = args.widgetParameter.toLowerCase();
    if (sizes.includes(paramSize)) {
      return paramSize;
    }
  }

  return "medium";
}

async function fetchAffirmation() {
  const cacheKey = "cached_affirmation";
  const cacheTimeKey = "cache_time";
  const fm = FileManager.local();

  try {
    if (fm.fileExists(fm.joinPath(fm.documentsDirectory(), cacheKey))) {
      const cacheTime = fm.readString(
        fm.joinPath(fm.documentsDirectory(), cacheTimeKey)
      );
      const now = new Date().getTime();
      const cacheAge = (now - parseInt(cacheTime)) / (1000 * 60); // minutes

      if (cacheAge < config.refreshInterval) {
        const cachedAffirmation = fm.readString(
          fm.joinPath(fm.documentsDirectory(), cacheKey)
        );
        return cachedAffirmation;
      }
    }

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const request = new Request(config.affirmationUrl);
        request.timeoutInterval = config.timeout;

        const response = await request.loadJSON();

        if (response && response.affirmation) {
          // Cache the new affirmation
          fm.writeString(
            fm.joinPath(fm.documentsDirectory(), cacheKey),
            response.affirmation
          );
          fm.writeString(
            fm.joinPath(fm.documentsDirectory(), cacheTimeKey),
            new Date().getTime().toString()
          );

          return response.affirmation;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === config.maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw new Error("Failed to fetch affirmation after all retries");
  } catch (error) {
    console.error("Error fetching affirmation:", error.message);

    // Try to return cached affirmation if available
    if (fm.fileExists(fm.joinPath(fm.documentsDirectory(), cacheKey))) {
      return fm.readString(fm.joinPath(fm.documentsDirectory(), cacheKey));
    }

    // Fallback affirmations
    const fallbackAffirmations = [
      "You are capable of amazing things.",
      "Today is full of possibilities.",
      "You have the strength to overcome challenges.",
      "Your potential is limitless.",
      "You are worthy of love and respect.",
    ];

    return fallbackAffirmations[
      Math.floor(Math.random() * fallbackAffirmations.length)
    ];
  }
}

async function createWidget(size) {
  const widget = new ListWidget();
  widget.backgroundColor = styling.backgroundColor;
  widget.setPadding(
    styling.padding,
    styling.padding,
    styling.padding,
    styling.padding
  );

  try {
    const affirmation = await fetchAffirmation();

    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    if (size !== "small") {
      mainStack.addSpacer();
    }

    const textElement = mainStack.addText(affirmation);
    textElement.font = Font.boldSystemFont(styling.fonts[size]);
    textElement.textColor = styling.textColor;
    textElement.centerAlignText();

    switch (size) {
      case "small":
        textElement.minimumScaleFactor = 0.7;
        textElement.lineLimit = 4;
        break;
      case "medium":
        textElement.minimumScaleFactor = 0.8;
        textElement.lineLimit = 6;
        break;
      case "large":
        textElement.minimumScaleFactor = 0.9;
        textElement.lineLimit = 8;
        break;
    }

    if (size !== "small") {
      mainStack.addSpacer();
    }
    if (size === "large") {
      mainStack.addSpacer(4);
      const timestamp = mainStack.addText(
        `Updated: ${new Date().toLocaleTimeString()}`
      );
      timestamp.font = Font.systemFont(10);
      timestamp.textColor = new Color("#888888");
      timestamp.centerAlignText();
    }
  } catch (error) {
    console.error("Error creating widget:", error.message);

    const errorStack = widget.addStack();
    errorStack.layoutVertically();
    errorStack.centerAlignContent();

    const errorText = errorStack.addText("Unable to load affirmation");
    errorText.font = Font.systemFont(styling.fonts[size] - 2);
    errorText.textColor = styling.errorColor;
    errorText.centerAlignText();
  }

  return widget;
}

async function main() {
  const size = getWidgetSize();
  console.log(`Creating ${size} widget`);

  const widget = await createWidget(size);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    switch (size) {
      case "small":
        widget.presentSmall();
        break;
      case "medium":
        widget.presentMedium();
        break;
      case "large":
        widget.presentLarge();
        break;
    }
  }

  Script.complete();
}

await main();
