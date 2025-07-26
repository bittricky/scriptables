const config = {
  useRandomApi: true,

  apis: {
    affirmations: {
      url: "https://www.affirmations.dev",
      name: "Affirmations.dev",
    },
    zenquotes: {
      url: "https://zenquotes.io/api/random",
      name: "ZenQuotes.io",
    },
  },

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
  const apiKeys = Object.keys(config.apis);
  const selectedApi = config.useRandomApi
    ? apiKeys[Math.floor(Math.random() * apiKeys.length)]
    : config.apiSource || "affirmations";

  const cacheKey = `cached_affirmation_${selectedApi}`;
  const cacheTimeKey = `cache_time_${selectedApi}`;
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
        return JSON.parse(cachedAffirmation);
      }
    }

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const apiConfig = config.apis[selectedApi];
        const request = new Request(apiConfig.url);
        request.timeoutInterval = config.timeout;

        const response = await request.loadJSON();
        let affirmationData;

        if (selectedApi === "affirmations") {
          if (response && response.affirmation) {
            affirmationData = {
              text: response.affirmation,
              author: null,
              source: apiConfig.name,
            };
          }
        } else if (selectedApi === "zenquotes") {
          if (response && Array.isArray(response) && response.length > 0) {
            const quote = response[0];
            affirmationData = {
              text: quote.q,
              author: quote.a,
              source: apiConfig.name,
            };
          }
        }

        if (affirmationData) {
          fm.writeString(
            fm.joinPath(fm.documentsDirectory(), cacheKey),
            JSON.stringify(affirmationData)
          );
          fm.writeString(
            fm.joinPath(fm.documentsDirectory(), cacheTimeKey),
            new Date().getTime().toString()
          );

          return affirmationData;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === config.maxRetries) {
          throw error;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw new Error("Failed to fetch affirmation after all retries");
  } catch (error) {
    console.error("Error fetching affirmation:", error.message);

    if (fm.fileExists(fm.joinPath(fm.documentsDirectory(), cacheKey))) {
      return JSON.parse(
        fm.readString(fm.joinPath(fm.documentsDirectory(), cacheKey))
      );
    }

    if (config.useRandomApi) {
      const otherApiKeys = apiKeys.filter((key) => key !== selectedApi);
      for (const apiKey of otherApiKeys) {
        const fallbackCacheKey = `cached_affirmation_${apiKey}`;
        if (
          fm.fileExists(fm.joinPath(fm.documentsDirectory(), fallbackCacheKey))
        ) {
          return JSON.parse(
            fm.readString(
              fm.joinPath(fm.documentsDirectory(), fallbackCacheKey)
            )
          );
        }
      }
    }

    const fallbackAffirmations = [
      "You are capable of amazing things.",
      "Today is full of possibilities.",
      "You have the strength to overcome challenges.",
      "Your potential is limitless.",
    ];

    return {
      text: fallbackAffirmations[
        Math.floor(Math.random() * fallbackAffirmations.length)
      ],
      author: null,
      source: "Fallback",
    };
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
    const affirmationData = await fetchAffirmation();

    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    if (size !== "small") {
      mainStack.addSpacer();
    }

    // Main affirmation text
    const textElement = mainStack.addText(affirmationData.text);
    textElement.font = Font.boldSystemFont(styling.fonts[size]);
    textElement.textColor = styling.textColor;
    textElement.centerAlignText();

    switch (size) {
      case "small":
        textElement.minimumScaleFactor = 0.7;
        textElement.lineLimit = 3;
        break;
      case "medium":
        textElement.minimumScaleFactor = 0.8;
        textElement.lineLimit = 5;
        break;
      case "large":
        textElement.minimumScaleFactor = 0.9;
        textElement.lineLimit = 7;
        break;
    }

    if (affirmationData.author && size !== "small") {
      mainStack.addSpacer(styling.spacing);
      const authorElement = mainStack.addText(`— ${affirmationData.author}`);
      authorElement.font = Font.italicSystemFont(styling.fonts[size] - 4);
      authorElement.textColor = styling.accentColor;
      authorElement.centerAlignText();
    }

    if (size !== "small") {
      mainStack.addSpacer();
    }

    if (size === "large") {
      mainStack.addSpacer(4);
      const footerText = `${
        affirmationData.source
      } • Updated: ${new Date().toLocaleTimeString()}`;
      const timestamp = mainStack.addText(footerText);
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
