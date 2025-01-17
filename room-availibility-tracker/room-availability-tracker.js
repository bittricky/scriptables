//TODO: Replace the config with an API call to a free or open sourced Public API with hotel data; similar to the Hilton API - 01/16/2025
const config = {
  hotelName: "Sample Hotel",
  rooms: [
    { number: "101", isAvailable: true },
    { number: "102", isAvailable: false },
    { number: "201", isAvailable: true },
    { number: "202", isAvailable: true },
    { number: "301", isAvailable: false },
  ],
};

async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#ffffff");

  const headerText = widget.addText(config.hotelName);
  headerText.font = Font.boldSystemFont(16);
  headerText.textColor = new Color("#000000");
  widget.addSpacer(8);

  const availableRooms = config.rooms.filter((room) => room.isAvailable);
  const availableText = widget.addText(
    `Available Rooms: ${availableRooms.length}`
  );
  availableText.font = Font.mediumSystemFont(24);
  availableText.textColor = new Color("#007AFF");

  return widget;
}

if (config.environment === "widget") {
  Script.setWidget(await createWidget());
} else {
  const widget = await createWidget();
  await widget.presentSmall();
}
