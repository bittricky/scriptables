// ═══════════════════════════════════════════════════════════════════
// PREVENT DOOM SCROLLING - ALL-IN-ONE
// ═══════════════════════════════════════════════════════════════════
//
// This script combines monitoring, challenges, tracking, and reporting
// into one script.
//
// FEATURES:
// Hourly usage monitoring
// Progressive difficulty challenges (math problems)
// Manual session tracking
// Accountability reporting
// Home screen widget
// Bypass logging with reasons
// Cascading restrictions (1st, 2nd, 3rd bypass)
//
// SETUP:
// 1. Install in Scriptable app
// 2. Configure apps and limits below
// 3. Create hourly automation in Shortcuts app
// 4. Optional: Add widget to home screen
//
// USAGE:
// - Run normally: Main menu with all options
// - Run from automation: Auto-checks usage
// - Run as widget: Shows current status
// - Parameter "track": Start/end session tracking
// - Parameter "report": Show accountability report
// ═══════════════════════════════════════════════════════════════════

// ┌─────────────────────────────────────────────────────────────────┐
// │                         CONFIGURATION                            │
// └─────────────────────────────────────────────────────────────────┘

const CONFIG = {
  // Apps to monitor (exact names from Screen Time)
  targetApps: [
    "Instagram",
    "TikTok",
    "Twitter",
    "X",
    "Reddit",
    "Facebook",
    "YouTube",
    "Snapchat",
    "Bluesky",
    "Mastodon",
  ],

  // Daily time limit in minutes
  dailyLimitMinutes: 30,

  // Extension granted per bypass (in minutes)
  extensionMinutes: 5,

  // Math difficulty: "easy", "medium", "hard"
  mathDifficulty: "medium",

  // Enable notifications
  enableNotifications: true,

  // Reminder interval for manual tracking (minutes)
  trackingReminderMinutes: 10,

  // Widget refresh interval (minutes) - for display only
  widgetRefreshMinutes: 15,
};

// ┌─────────────────────────────────────────────────────────────────┐
// │                        STORAGE KEYS                              │
// └─────────────────────────────────────────────────────────────────┘

const STORAGE = {
  USAGE_TODAY: "usage_today",
  BYPASS_COUNT: "bypass_count",
  LAST_RESET: "last_reset",
  TOTAL_BYPASSES: "total_bypasses",
  EXTENSION_GRANTED_UNTIL: "extension_until",
  SESSION_START: "session_start_time",
  BYPASS_LOG: "bypass_log.json",
  LAST_CHECK: "last_check_time",
};

// ┌─────────────────────────────────────────────────────────────────┐
// │                        MAIN EXECUTION                            │
// └─────────────────────────────────────────────────────────────────┘

async function main() {
  // Check for script parameters
  const param = args.scriptParameter;

  if (config.runsInWidget) {
    // Running as home screen widget
    await displayWidget();
  } else if (param === "track") {
    // Manual tracking mode
    await trackSession();
  } else if (param === "report") {
    // Show accountability report
    await generateReport();
  } else if (param === "auto") {
    // Automated hourly check
    await automaticCheck();
  } else {
    // Show main menu
    await showMainMenu();
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                          MAIN MENU                               │
// └─────────────────────────────────────────────────────────────────┘

async function showMainMenu() {
  await checkAndResetDaily();

  const usage = getData(STORAGE.USAGE_TODAY) || 0;
  const limit = CONFIG.dailyLimitMinutes;
  const bypasses = getData(STORAGE.BYPASS_COUNT) || 0;
  const remaining = Math.max(0, limit - usage);

  const menu = new Alert();
  menu.title = "📱 Social Media Manager";
  menu.message = `Today: ${usage}/${limit} min\nRemaining: ${remaining} min\nBypasses: ${bypasses}`;

  menu.addAction("📊 Check Status");
  menu.addAction("▶️ Start Session");
  menu.addAction("📈 View Report");
  menu.addAction("⚙️ Settings");
  menu.addAction("❓ Help");
  menu.addCancelAction("Close");

  const choice = await menu.presentAlert();

  switch (choice) {
    case 0:
      await checkStatus();
      break;
    case 1:
      await trackSession();
      break;
    case 2:
      await generateReport();
      break;
    case 3:
      await showSettings();
      break;
    case 4:
      await showHelp();
      break;
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      AUTOMATIC CHECK                             │
// └─────────────────────────────────────────────────────────────────┘

async function automaticCheck() {
  await checkAndResetDaily();

  const usage = getData(STORAGE.USAGE_TODAY) || 0;
  const limit = CONFIG.dailyLimitMinutes;
  const extensionUntil = getExtensionTime();
  const effectiveLimit =
    extensionUntil > Date.now() ? limit + CONFIG.extensionMinutes : limit;

  // Update last check time
  saveData(STORAGE.LAST_CHECK, Date.now());

  if (usage >= effectiveLimit) {
    await handleLimitExceeded(usage);
  } else {
    // Check if approaching limit
    const remaining = effectiveLimit - usage;
    if (remaining <= 5 && remaining > 0 && CONFIG.enableNotifications) {
      const notification = new Notification();
      notification.title = "⚠️ Almost at Limit";
      notification.body = `Only ${remaining} minutes remaining today.`;
      notification.sound = "default";
      await notification.schedule();
    }
  }

  Script.complete();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      DAILY RESET LOGIC                           │
// └─────────────────────────────────────────────────────────────────┘

async function checkAndResetDaily() {
  const lastReset = getData(STORAGE.LAST_RESET);
  const today = new Date().toDateString();

  if (lastReset !== today) {
    // New day - reset counters
    saveData(STORAGE.USAGE_TODAY, 0);
    saveData(STORAGE.BYPASS_COUNT, 0);
    saveData(STORAGE.LAST_RESET, today);
    saveData(STORAGE.EXTENSION_GRANTED_UNTIL, 0);

    if (CONFIG.enableNotifications) {
      const notification = new Notification();
      notification.title = "🌅 New Day, Fresh Start";
      notification.body = `Your ${CONFIG.dailyLimitMinutes} minute limit has been reset.`;
      notification.sound = "default";
      await notification.schedule();
    }

    console.log("✓ Daily counters reset");
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      CHECK STATUS                                │
// └─────────────────────────────────────────────────────────────────┘

async function checkStatus() {
  await checkAndResetDaily();

  const usage = getData(STORAGE.USAGE_TODAY) || 0;
  const limit = CONFIG.dailyLimitMinutes;
  const bypasses = getData(STORAGE.BYPASS_COUNT) || 0;
  const totalBypasses = getData(STORAGE.TOTAL_BYPASSES) || 0;
  const remaining = Math.max(0, limit - usage);
  const percentage = Math.min(100, (usage / limit) * 100);
  const extensionUntil = getExtensionTime();

  let statusMessage = `═══════════════════════════\n`;
  statusMessage += `📊 TODAY'S USAGE\n`;
  statusMessage += `═══════════════════════════\n\n`;
  statusMessage += `Time Used: ${usage} minutes\n`;
  statusMessage += `Daily Limit: ${limit} minutes\n`;
  statusMessage += `Remaining: ${remaining} minutes\n`;
  statusMessage += `Progress: ${percentage.toFixed(0)}%\n\n`;

  // Progress bar
  const barLength = 20;
  const filled = Math.round((usage / limit) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(Math.max(0, barLength - filled));
  statusMessage += `[${bar}]\n\n`;

  statusMessage += `═══════════════════════════\n`;
  statusMessage += `📈 STATISTICS\n`;
  statusMessage += `═══════════════════════════\n\n`;
  statusMessage += `Bypasses Today: ${bypasses}\n`;
  statusMessage += `Total Bypasses: ${totalBypasses}\n`;

  if (extensionUntil > Date.now()) {
    const minsLeft = Math.ceil((extensionUntil - Date.now()) / 60000);
    statusMessage += `\n⏱️ Extension Active: ${minsLeft} min left\n`;
  }

  if (usage >= limit) {
    statusMessage += `\n⚠️ LIMIT EXCEEDED\n`;
  } else if (remaining <= 5) {
    statusMessage += `\n⚠️ APPROACHING LIMIT\n`;
  } else {
    statusMessage += `\n✅ On Track\n`;
  }

  const alert = new Alert();
  alert.title = "📊 Status Report";
  alert.message = statusMessage;
  alert.addAction("OK");
  await alert.presentAlert();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                   MANUAL SESSION TRACKING                        │
// └─────────────────────────────────────────────────────────────────┘

async function trackSession() {
  const fm = FileManager.iCloud();
  const sessionStart = getData(STORAGE.SESSION_START);

  if (sessionStart) {
    // End session
    await endSession(sessionStart);
  } else {
    // Start session
    await startSession();
  }
}

async function startSession() {
  const now = Date.now();
  saveData(STORAGE.SESSION_START, now);

  const alert = new Alert();
  alert.title = "▶️ Session Started";
  alert.message =
    "Timer is running. Open this script again when you're done to log your time.";
  alert.addAction("OK");
  await alert.presentAlert();

  // Schedule reminder
  if (CONFIG.enableNotifications) {
    const notification = new Notification();
    notification.title = "⏰ Still Scrolling?";
    notification.body =
      "Don't forget to end your session in the Social Media Manager.";
    notification.sound = "default";

    const reminderDate = new Date(
      now + CONFIG.trackingReminderMinutes * 60 * 1000,
    );
    notification.setTriggerDate(reminderDate);
    await notification.schedule();
  }
}

async function endSession(sessionStart) {
  const now = Date.now();
  const durationMs = now - sessionStart;
  const durationMinutes = Math.round(durationMs / 60000);

  // Update usage
  let totalUsage = getData(STORAGE.USAGE_TODAY) || 0;
  totalUsage += durationMinutes;
  saveData(STORAGE.USAGE_TODAY, totalUsage);

  // Clear session marker
  saveData(STORAGE.SESSION_START, null);

  // Show summary
  const limit = CONFIG.dailyLimitMinutes;
  const remaining = Math.max(0, limit - totalUsage);
  const percentage = Math.min(100, (totalUsage / limit) * 100);

  const alert = new Alert();
  alert.title = "⏹️ Session Ended";

  let message = `Session: ${durationMinutes} min\n\n`;
  message += `Today's Total: ${totalUsage} min\n`;
  message += `Daily Limit: ${limit} min\n`;
  message += `Remaining: ${remaining} min\n`;
  message += `Usage: ${percentage.toFixed(0)}%\n`;

  if (totalUsage >= limit) {
    message += `\n⚠️ You've reached your limit!`;
    alert.addAction("Request Extension");
    alert.addAction("Lock Me Out");
  } else if (remaining <= 5) {
    message += `\n⚠️ Almost at limit!`;
    alert.addAction("OK");
  } else {
    message += `\n✅ Still on track`;
    alert.addAction("OK");
  }

  alert.message = message;

  const choice = await alert.presentAlert();

  if (totalUsage >= limit && choice === 0) {
    await handleLimitExceeded(totalUsage);
  } else if (totalUsage >= limit && choice === 1) {
    await lockOut();
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                   LIMIT EXCEEDED HANDLER                         │
// └─────────────────────────────────────────────────────────────────┘

async function handleLimitExceeded(currentUsage) {
  const bypassCount = getData(STORAGE.BYPASS_COUNT) || 0;

  const alert = new Alert();
  alert.title = "⏰ Time Limit Exceeded";

  let message = `You've used ${currentUsage} minutes today.\n`;
  message += `Limit: ${CONFIG.dailyLimitMinutes} minutes\n\n`;
  message += `Bypass attempts today: ${bypassCount}`;

  alert.message = message;

  if (bypassCount === 0) {
    // FIRST BYPASS: Easy math problem
    alert.addAction("🧮 Solve for 5 Minutes");
    alert.addCancelAction("Lock Me Out");

    const choice = await alert.presentAlert();

    if (choice === 0) {
      const solved = await showMathChallenge("easy");
      if (solved) {
        await grantExtension(bypassCount, null);
      } else {
        await showFailMessage();
      }
    } else {
      await lockOut();
    }
  } else if (bypassCount === 1) {
    // SECOND BYPASS: Harder math + reason required
    alert.addAction("🧮 Complete Challenge");
    alert.addCancelAction("Lock Me Out");

    const choice = await alert.presentAlert();

    if (choice === 0) {
      const solved = await showMathChallenge(CONFIG.mathDifficulty);
      if (solved) {
        const reason = await askForReason();
        if (reason) {
          await grantExtension(bypassCount, reason);
        } else {
          await showFailMessage();
        }
      } else {
        await showFailMessage();
      }
    } else {
      await lockOut();
    }
  } else {
    // THIRD+ BYPASS: Lockout
    alert.message = `You've bypassed ${bypassCount} times.\n\n`;
    alert.message += `🔒 No more extensions.\n\n`;
    alert.message += `See you tomorrow! 🌙`;
    alert.addAction("OK");
    await alert.presentAlert();
    await lockOut();
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      MATH CHALLENGE                              │
// └─────────────────────────────────────────────────────────────────┘

async function showMathChallenge(difficulty) {
  let num1, num2, operator, correctAnswer;

  switch (difficulty) {
    case "easy":
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      operator = "+";
      correctAnswer = num1 + num2;
      break;

    case "medium":
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 50) + 10;
      operator = Math.random() > 0.5 ? "+" : "-";
      correctAnswer = operator === "+" ? num1 + num2 : num1 - num2;
      break;

    case "hard":
      num1 = Math.floor(Math.random() * 20) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      operator = "×";
      correctAnswer = num1 * num2;
      break;
  }

  const alert = new Alert();
  alert.title = "🧮 Math Challenge";
  alert.message = `Solve this to continue:\n\n${num1} ${operator} ${num2} = ?`;
  alert.addTextField("Your answer");
  alert.addAction("Submit");
  alert.addCancelAction("Give Up");

  const response = await alert.presentAlert();

  if (response === -1) return false;

  const userAnswer = parseInt(alert.textFieldValue(0));

  if (userAnswer === correctAnswer) {
    const success = new Alert();
    success.title = "✅ Correct!";
    success.message = "Well done! Challenge completed.";
    success.addAction("Continue");
    await success.presentAlert();
    return true;
  } else {
    const fail = new Alert();
    fail.title = "❌ Incorrect";
    fail.message = `The correct answer was ${correctAnswer}.\n\nChallenge failed.`;
    fail.addAction("OK");
    await fail.presentAlert();
    return false;
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      REASON REQUEST                              │
// └─────────────────────────────────────────────────────────────────┘

async function askForReason() {
  const alert = new Alert();
  alert.title = "✍️ Why More Time?";
  alert.message =
    "Explain why you need more time.\n\nThis will be logged for accountability.";
  alert.addTextField("Your reason", "e.g., Responding to important message");
  alert.addAction("Submit");
  alert.addCancelAction("Cancel");

  const response = await alert.presentAlert();

  if (response === -1) return null;

  const reason = alert.textFieldValue(0);

  if (reason && reason.trim().length >= 10) {
    return reason.trim();
  } else {
    const retry = new Alert();
    retry.title = "Too Short";
    retry.message =
      "Please provide a meaningful reason (minimum 10 characters).";
    retry.addAction("Try Again");
    retry.addCancelAction("Cancel");

    const retryChoice = await retry.presentAlert();
    if (retryChoice === 0) {
      return await askForReason();
    }
    return null;
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      GRANT EXTENSION                             │
// └─────────────────────────────────────────────────────────────────┘

async function grantExtension(bypassCount, reason) {
  // Increment bypass counter
  const newCount = bypassCount + 1;
  saveData(STORAGE.BYPASS_COUNT, newCount);

  // Increment total bypasses
  const totalBypasses = (getData(STORAGE.TOTAL_BYPASSES) || 0) + 1;
  saveData(STORAGE.TOTAL_BYPASSES, totalBypasses);

  // Grant extension
  const extensionUntil = Date.now() + CONFIG.extensionMinutes * 60 * 1000;
  saveData(STORAGE.EXTENSION_GRANTED_UNTIL, extensionUntil);

  // Log the bypass
  await logBypass(newCount, reason);

  // Show success message
  const alert = new Alert();
  alert.title = "✅ Extension Granted";

  let message = `You have ${CONFIG.extensionMinutes} more minutes.\n\n`;
  message += `This is bypass #${newCount} today.\n`;

  if (newCount === 1) {
    message += `\n⚠️ Next bypass requires harder challenge + reason.`;
  } else if (newCount === 2) {
    message += `\n🚨 FINAL WARNING: One more bypass locks you out until tomorrow.`;
  }

  alert.message = message;
  alert.addAction("OK");
  await alert.presentAlert();

  // Send notification
  if (CONFIG.enableNotifications) {
    const notification = new Notification();
    notification.title = "⏱️ Extension Active";
    notification.body = `${CONFIG.extensionMinutes} minutes granted. Use wisely!`;
    notification.sound = "default";
    await notification.schedule();
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                         LOCKOUT                                  │
// └─────────────────────────────────────────────────────────────────┘

async function lockOut() {
  const alert = new Alert();
  alert.title = "🔒 Locked Out";
  alert.message = `Apps are locked until tomorrow.\n\nTime to:\n✓ Enable Focus mode\n✓ Go for a walk\n✓ Read a book\n✓ Call a friend\n\nSee you tomorrow! 🌙`;
  alert.addAction("Enable Focus Mode");
  alert.addCancelAction("OK");

  const choice = await alert.presentAlert();

  if (choice === 0) {
    const instructions = new Alert();
    instructions.title = "Enable Focus Mode";
    instructions.message = `Go to:\n\nSettings → Focus → Do Not Disturb\n\nOR\n\nControl Center → Focus\n\nThen block all social media apps until tomorrow.`;
    instructions.addAction("I've Enabled It");
    await instructions.presentAlert();
  }

  if (CONFIG.enableNotifications) {
    const notification = new Notification();
    notification.title = "🔒 Apps Locked";
    notification.body = "Social media locked until tomorrow. Take a break!";
    notification.sound = "default";
    await notification.schedule();
  }
}

async function showFailMessage() {
  const alert = new Alert();
  alert.title = "Challenge Failed";
  alert.message =
    "Extension denied. Try again or lock yourself out until tomorrow.";
  alert.addAction("OK");
  await alert.presentAlert();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      BYPASS LOGGING                              │
// └─────────────────────────────────────────────────────────────────┘

async function logBypass(count, reason) {
  const fm = FileManager.iCloud();
  const logPath = fm.joinPath(fm.documentsDirectory(), STORAGE.BYPASS_LOG);

  let logs = [];
  if (fm.fileExists(logPath)) {
    try {
      const logData = fm.readString(logPath);
      logs = JSON.parse(logData);
    } catch (e) {
      logs = [];
    }
  }

  logs.push({
    date: new Date().toISOString(),
    dateString: new Date().toLocaleString(),
    bypassNumber: count,
    reason: reason,
    day: new Date().toDateString(),
    usage: getData(STORAGE.USAGE_TODAY) || 0,
    limit: CONFIG.dailyLimitMinutes,
  });

  fm.writeString(logPath, JSON.stringify(logs, null, 2));
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                   ACCOUNTABILITY REPORT                          │
// └─────────────────────────────────────────────────────────────────┘

async function generateReport() {
  const fm = FileManager.iCloud();
  const logPath = fm.joinPath(fm.documentsDirectory(), STORAGE.BYPASS_LOG);

  if (!fm.fileExists(logPath)) {
    const alert = new Alert();
    alert.title = "📊 No Data Yet";
    alert.message =
      "You haven't bypassed any limits yet.\n\nGood job! Keep it up! 🎉";
    alert.addAction("OK");
    await alert.presentAlert();
    return;
  }

  let logs = [];
  try {
    const logData = fm.readString(logPath);
    logs = JSON.parse(logData);
  } catch (e) {
    const alert = new Alert();
    alert.title = "Error";
    alert.message = "Could not read bypass log.";
    alert.addAction("OK");
    await alert.presentAlert();
    return;
  }

  // Calculate statistics
  const totalBypasses = logs.length;

  const last7Days = logs.filter((log) => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const last30Days = logs.filter((log) => {
    const logDate = new Date(log.date);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return logDate >= monthAgo;
  });

  const bypassesByDay = {};
  logs.forEach((log) => {
    if (!bypassesByDay[log.day]) {
      bypassesByDay[log.day] = 0;
    }
    bypassesByDay[log.day]++;
  });

  const daysTracked = Object.keys(bypassesByDay).length;
  const avgBypassesPerDay = daysTracked > 0 ? totalBypasses / daysTracked : 0;

  // Generate report
  let report = "═══════════════════════════════════\n";
  report += "📊 ACCOUNTABILITY REPORT\n";
  report += "═══════════════════════════════════\n\n";

  report += "📈 OVERALL STATISTICS\n";
  report += "─────────────────────────────────\n";
  report += `Total Bypasses: ${totalBypasses}\n`;
  report += `Days Tracked: ${daysTracked}\n`;
  report += `Average/Day: ${avgBypassesPerDay.toFixed(1)}\n`;
  report += `Last 7 Days: ${last7Days.length}\n`;
  report += `Last 30 Days: ${last30Days.length}\n\n`;

  // Recent bypasses
  report += "📋 RECENT BYPASSES\n";
  report += "─────────────────────────────────\n";

  const recent = logs.slice(-15).reverse();
  recent.forEach((log) => {
    const date = new Date(log.date);
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    report += `\n${dateStr} ${timeStr}\n`;
    report += `Bypass #${log.bypassNumber} | ${log.usage}/${log.limit} min\n`;

    if (log.reason) {
      report += `Reason: "${log.reason}"\n`;
    }
  });

  // Show report menu
  const alert = new Alert();
  alert.title = "📊 Your Report";
  alert.message = report;
  alert.addAction("Share Report");
  alert.addAction("View Trends");
  alert.addAction("Clear History");
  alert.addCancelAction("Close");

  const choice = await alert.presentAlert();

  if (choice === 0) {
    await shareReport(report);
  } else if (choice === 1) {
    await showTrends(logs, bypassesByDay);
  } else if (choice === 2) {
    await clearHistory(fm, logPath);
  }
}

async function showTrends(logs, bypassesByDay) {
  let trends = "═══════════════════════════════════\n";
  trends += "📈 USAGE TRENDS\n";
  trends += "═══════════════════════════════════\n\n";

  // Get last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toDateString());
  }

  trends += "LAST 7 DAYS:\n";
  trends += "─────────────────────────────────\n";

  last7Days.forEach((day) => {
    const count = bypassesByDay[day] || 0;
    const date = new Date(day);
    const dayStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const bar = "█".repeat(count) + "░".repeat(Math.max(0, 5 - count));
    trends += `${dayStr}: ${bar} ${count}\n`;
  });

  // Find best and worst days
  const sortedDays = Object.entries(bypassesByDay).sort((a, b) => a[1] - b[1]);

  if (sortedDays.length > 0) {
    trends += `\n🏆 BEST DAY:\n`;
    const bestDay = new Date(sortedDays[0][0]);
    trends += `${bestDay.toLocaleDateString()} - ${sortedDays[0][1]} bypass(es)\n`;

    trends += `\n⚠️ WORST DAY:\n`;
    const worstDay = new Date(sortedDays[sortedDays.length - 1][0]);
    trends += `${worstDay.toLocaleDateString()} - ${sortedDays[sortedDays.length - 1][1]} bypass(es)\n`;
  }

  const alert = new Alert();
  alert.title = "📈 Trends";
  alert.message = trends;
  alert.addAction("OK");
  await alert.presentAlert();
}

async function shareReport(report) {
  const fm = FileManager.iCloud();
  const reportPath = fm.joinPath(
    fm.documentsDirectory(),
    "accountability_report.txt",
  );

  const fullReport = report + "\n\n" + "─────────────────────────────────\n";
  fullReport += "Generated by Social Media Doom Scroll Preventer\n";
  fullReport += new Date().toLocaleString() + "\n";

  fm.writeString(reportPath, report);

  const alert = new Alert();
  alert.title = "📤 Share Report";
  alert.message =
    "Report saved to:\n\nScriptable/accountability_report.txt\n\nYou can share it from the Files app or view it now.";
  alert.addAction("View File");
  alert.addCancelAction("OK");

  const choice = await alert.presentAlert();

  if (choice === 0) {
    QuickLook.present(reportPath);
  }
}

async function clearHistory(fm, logPath) {
  const confirm = new Alert();
  confirm.title = "⚠️ Clear All History?";
  confirm.message =
    "This will permanently delete all bypass logs.\n\nThis cannot be undone!";
  confirm.addDestructiveAction("Delete Everything");
  confirm.addCancelAction("Keep History");

  const choice = await confirm.presentAlert();

  if (choice === 0) {
    fm.remove(logPath);

    // Also reset total bypasses
    saveData(STORAGE.TOTAL_BYPASSES, 0);

    const success = new Alert();
    success.title = "✅ History Cleared";
    success.message =
      "All bypass logs have been deleted.\n\nYou're starting fresh!";
    success.addAction("OK");
    await success.presentAlert();
  }
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                       SETTINGS MENU                              │
// └─────────────────────────────────────────────────────────────────┘

async function showSettings() {
  const settings = new Alert();
  settings.title = "⚙️ Settings";

  let message = "CURRENT CONFIGURATION:\n\n";
  message += `Daily Limit: ${CONFIG.dailyLimitMinutes} min\n`;
  message += `Extension: ${CONFIG.extensionMinutes} min\n`;
  message += `Math Difficulty: ${CONFIG.mathDifficulty}\n`;
  message += `Notifications: ${CONFIG.enableNotifications ? "ON" : "OFF"}\n`;
  message += `Tracking Apps: ${CONFIG.targetApps.length}\n\n`;
  message += `To change settings, edit the CONFIG section in the script.`;

  settings.message = message;
  settings.addAction("View App List");
  settings.addAction("Test Math Challenge");
  settings.addCancelAction("Back");

  const choice = await settings.presentAlert();

  if (choice === 0) {
    await showAppList();
  } else if (choice === 1) {
    await showMathChallenge(CONFIG.mathDifficulty);
  }
}

async function showAppList() {
  const alert = new Alert();
  alert.title = "📱 Monitored Apps";
  alert.message = CONFIG.targetApps.join("\n");
  alert.addAction("OK");
  await alert.presentAlert();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                         HELP MENU                                │
// └─────────────────────────────────────────────────────────────────┘

async function showHelp() {
  const help = new Alert();
  help.title = "❓ Help";

  let message = "HOW TO USE:\n\n";
  message += "1️⃣ START SESSION\n";
  message +=
    "Before opening social media, tap 'Start Session'. When done, run again to log time.\n\n";
  message += "2️⃣ AUTOMATIC CHECKS\n";
  message +=
    "Set up hourly automation in Shortcuts app to auto-monitor usage.\n\n";
  message += "3️⃣ BYPASS SYSTEM\n";
  message += "• 1st bypass: Easy math → 5 min\n";
  message += "• 2nd bypass: Hard math + reason → 5 min\n";
  message += "• 3rd bypass: Locked out until tomorrow\n\n";
  message += "4️⃣ VIEW REPORTS\n";
  message += "Check your accountability report weekly to track progress.\n\n";
  message += "5️⃣ WIDGET\n";
  message += "Add to home screen for quick status view.";

  help.message = message;
  help.addAction("Setup Guide");
  help.addAction("Troubleshooting");
  help.addCancelAction("Back");

  const choice = await help.presentAlert();

  if (choice === 0) {
    await showSetupGuide();
  } else if (choice === 1) {
    await showTroubleshooting();
  }
}

async function showSetupGuide() {
  const guide = new Alert();
  guide.title = "🚀 Setup Guide";

  let message = "AUTOMATION SETUP:\n\n";
  message += "1. Open Shortcuts app\n";
  message += "2. Go to Automation tab\n";
  message += "3. Tap + button\n";
  message += "4. Select 'Time of Day'\n";
  message += "5. Set to run hourly\n";
  message += "6. Disable 'Ask Before Running'\n";
  message += "7. Add 'Run Script' action\n";
  message += "8. Select this script\n";
  message += "9. Save automation\n\n";
  message += "WIDGET SETUP:\n\n";
  message += "1. Long-press home screen\n";
  message += "2. Tap + button\n";
  message += "3. Search 'Scriptable'\n";
  message += "4. Choose widget size\n";
  message += "5. Edit widget settings\n";
  message += "6. Select this script\n";

  guide.message = message;
  guide.addAction("OK");
  await guide.presentAlert();
}

async function showTroubleshooting() {
  const trouble = new Alert();
  trouble.title = "🔧 Troubleshooting";

  let message = "COMMON ISSUES:\n\n";
  message += "❌ Widget not updating?\n";
  message += "→ Remove and re-add widget\n\n";
  message += "❌ Automation not running?\n";
  message += "→ Check 'Ask Before Running' is OFF\n\n";
  message += "❌ Math too hard?\n";
  message += "→ Change mathDifficulty to 'easy'\n\n";
  message += "❌ Usage not accurate?\n";
  message += "→ Use manual session tracking\n\n";
  message += "❌ Want to reset?\n";
  message += "→ View Report → Clear History";

  trouble.message = message;
  trouble.addAction("OK");
  await trouble.presentAlert();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      HOME SCREEN WIDGET                          │
// └─────────────────────────────────────────────────────────────────┘

async function displayWidget() {
  await checkAndResetDaily();

  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1a1a2e");

  const usage = getData(STORAGE.USAGE_TODAY) || 0;
  const limit = CONFIG.dailyLimitMinutes;
  const bypasses = getData(STORAGE.BYPASS_COUNT) || 0;
  const remaining = Math.max(0, limit - usage);
  const percentage = Math.min(100, (usage / limit) * 100);

  // Header
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const icon = header.addText("📱");
  icon.font = Font.systemFont(16);

  header.addSpacer(4);

  const title = header.addText("Social Media");
  title.textColor = Color.white();
  title.font = Font.boldSystemFont(13);

  widget.addSpacer(8);

  // Usage stats
  const usageStack = widget.addStack();
  usageStack.layoutVertically();

  const usageText = usageStack.addText(`${usage}/${limit} min`);
  usageText.textColor = Color.white();
  usageText.font = Font.boldSystemFont(18);

  widget.addSpacer(4);

  // Progress bar
  const progressStack = widget.addStack();
  progressStack.layoutHorizontally();
  progressStack.centerAlignContent();

  const barWidth = 150;
  const filledWidth = (percentage / 100) * barWidth;

  const filledBar = progressStack.addStack();
  filledBar.size = new Size(filledWidth, 6);
  filledBar.backgroundColor =
    percentage >= 100
      ? Color.red()
      : percentage >= 80
        ? Color.orange()
        : Color.green();
  filledBar.cornerRadius = 3;

  const emptyBar = progressStack.addStack();
  emptyBar.size = new Size(barWidth - filledWidth, 6);
  emptyBar.backgroundColor = new Color("#ffffff", 0.2);
  emptyBar.cornerRadius = 3;

  widget.addSpacer(6);

  // Remaining time
  const remainingText = widget.addText(`⏱️ ${remaining} min left`);
  remainingText.textColor =
    remaining > 10
      ? Color.green()
      : remaining > 0
        ? Color.orange()
        : Color.red();
  remainingText.font = Font.systemFont(11);

  widget.addSpacer(4);

  // Bypass count
  if (bypasses > 0) {
    const bypassText = widget.addText(
      `⚠️ ${bypasses} bypass${bypasses > 1 ? "es" : ""} today`,
    );
    bypassText.textColor = Color.red();
    bypassText.font = Font.boldSystemFont(10);
  } else {
    const statusText = widget.addText(`✅ On track`);
    statusText.textColor = Color.green();
    statusText.font = Font.systemFont(10);
  }

  // Last updated
  widget.addSpacer(4);
  const updateText = widget.addText(
    `Updated: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
  );
  updateText.textColor = new Color("#ffffff", 0.5);
  updateText.font = Font.systemFont(8);

  Script.setWidget(widget);
  Script.complete();
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                      STORAGE HELPERS                             │
// └─────────────────────────────────────────────────────────────────┘

function saveData(key, value) {
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), `${key}.json`);
  fm.writeString(path, JSON.stringify(value));
}

function getData(key) {
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), `${key}.json`);

  if (fm.fileExists(path)) {
    try {
      const data = fm.readString(path);
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  return null;
}

function getExtensionTime() {
  return getData(STORAGE.EXTENSION_GRANTED_UNTIL) || 0;
}

// ┌─────────────────────────────────────────────────────────────────┐
// │                         RUN SCRIPT                               │
// └─────────────────────────────────────────────────────────────────┘

await main();
Script.complete();
