// Thirsty Thoughts
// How much drinking water does your AI prompt cost?
//
// Source: "Making AI Less Thirsty", ACM 2024
// Energy: 0.004 kWh per ~1300 token request (GPT-3 class)
// WUE: 1.8 L/kWh industry average (EESI 2024)
// PUE: 1.5x datacenter overhead (DOE)
// Tokens: 1.33 per word (BPE average)
// Drinking water baseline: 2 L/day (WHO minimum)
// Note: on-site cooling only. Real total is 2-4x higher.

var KWH_PER_TOKEN = 3.08e-6;
var WUE = 1.8;
var PUE = 1.5;
var TOKENS_PER_WORD = 1.33;
var WHO_L_PER_DAY = 2.0;
var ML_PER_TOKEN = KWH_PER_TOKEN * PUE * WUE * 1000;

function calc(promptText, outputWords) {
  var inputWords = promptText.trim().length === 0 ? 0 : promptText.trim().split(/\s+/).length;
  var tokens = Math.round((inputWords + outputWords) * TOKENS_PER_WORD);
  var ml = tokens * ML_PER_TOKEN;
  var wh = tokens * KWH_PER_TOKEN * PUE * 1000;
  var minutes = (ml / 1000 / WHO_L_PER_DAY) * 24 * 60;
  return { tokens: tokens, ml: ml, wh: wh, minutes: minutes };
}

async function main() {
  var a1 = new Alert();
  a1.title = "Thirsty Thoughts";
  a1.message = "Paste your prompt and expected reply length.";
  a1.addTextField("Your prompt...");
  a1.addTextField("Reply length in words", "200");
  a1.addAction("Calculate");
  a1.addCancelAction("Cancel");

  var choice = await a1.present();
  if (choice === -1) return;

  var prompt = a1.textFieldValue(0);
  var replyWords = parseInt(a1.textFieldValue(1), 10);
  if (isNaN(replyWords) || replyWords < 1) replyWords = 200;

  var r = calc(prompt, replyWords);

  var msg = "";
  msg += "Tokens:  " + r.tokens + "\n";
  msg += "Energy:  " + r.wh.toFixed(4) + " Wh\n";
  msg += "Water:   " + r.ml.toFixed(2) + " mL evaporated\n";
  msg += "         " + (r.ml / 237).toFixed(3) + " US cups\n";
  msg += "\n";
  msg += "= " + r.minutes.toFixed(1) + " min of one person's\n";
  msg += "  daily drinking water (WHO 2L/day)\n";
  msg += "\n";
  msg += "On-site cooling only.\n";
  msg += "Real total is 2-4x higher.";

  var a2 = new Alert();
  a2.title = r.ml.toFixed(2) + " mL";
  a2.message = msg;
  a2.addAction("OK");
  await a2.present();
}

main();
Script.complete();