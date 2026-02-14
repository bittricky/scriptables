# Prototype Document
## What This Script Does

This single script combines **ALL** the features you need to break doom scrolling:

**Hourly usage monitoring** - Automatic background checks  
**Progressive challenges** - Math problems that get harder  
**Manual session tracking** - Accurate time logging  
**Accountability reports** - Weekly stats and trends  
**Home screen widget** - Real-time usage display  
**Bypass logging** - Every attempt recorded with reasons  
**Cascading restrictions** - 3 strikes and you're out  

## Installation (5 Minutes)

### Step 1: Install Scriptable
1. Download **Scriptable** from App Store (free)
2. Open and grant permissions

### Step 2: Add the Script
1. Open Scriptable
2. Tap **+** button
3. Paste the entire script code
4. Tap the title and rename to: **Social Media Manager**
5. Tap **Done**

### Step 3: Configure Your Apps
Edit the top of the script (CONFIG section):

```javascript
targetApps: [
  "Instagram",    // ← Add/remove your apps here
  "TikTok", 
  "Twitter",
  "Reddit",
  "Facebook",
  "YouTube"
],

dailyLimitMinutes: 30,  // ← Your daily limit
```

### Step 4: Set Up iOS Screen Time
1. **Settings** → **Screen Time**
2. Tap **App Limits** → **Add Limit**
3. Select **Social** category (or specific apps)
4. Set limit to **30 minutes** (match your script setting)
5. **Important**: This does the actual blocking!

### Step 5: Create Automation (CRITICAL!)
1. Open **Shortcuts** app
2. Go to **Automation** tab
3. Tap **+** button
4. Select **Time of Day**
5. Set: **Repeat: Hourly** (or every 30 minutes)
6. **IMPORTANT**: Turn OFF "Ask Before Running"
7. Add action: **Run Script**
8. Choose: **Social Media Manager**
9. Save

**Done!** The system is now active.

## How to Use Daily

### Method 1: Manual Tracking (Most Accurate)

**BEFORE opening social media:**
1. Open script
2. Choose **"Start Session"**
3. Use social media
4. Come back and choose **"Start Session"** again (it will end)
5. Your time is logged automatically

### Method 2: Automatic (Set and Forget)

Just let the hourly automation run. It will:
- Check your usage automatically
- Alert you when approaching limit
- Present challenges when exceeded
- No manual tracking needed

### When You Hit Your Limit

The script will present **progressive challenges**:

#### 1st Bypass Attempt
- **Challenge**: Easy math (e.g., 15 + 7)
- **Reward**: 5 more minutes
- **No questions asked**

#### 2nd Bypass Attempt
- **Challenge**: Harder math (e.g., 47 - 23)
- **Required**: Write why you need more time
- **Reward**: 5 more minutes
- **Your reason is logged**

#### 3rd Bypass Attempt
- **Result**: LOCKED OUT until tomorrow
- **No more extensions**
- **Prompted to enable Focus mode**

## Main Menu Options

When you run the script manually, you'll see:

1. **Check Status** - See current usage, remaining time, bypass count
2. **Start Session** - Begin/end manual tracking
3. **View Report** - Weekly accountability report
4. **Settings** - View configuration
5. **Help** - Setup guides and troubleshooting

## Weekly Review

Every Sunday (or whenever), tap **View Report** to see:

- Total bypasses this week
- Average bypasses per day
- Recent bypass history with timestamps
- Your written reasons (for reflection)
- Best/worst days
- 7-day trend graph

You can **share** this report with an accountability partner!

## Widget Setup (Optional)

Add real-time usage to your home screen:

1. Long-press home screen
2. Tap **+** button (top-left)
3. Search **Scriptable**
4. Choose **Small** widget
5. Add to home screen
6. Long-press widget → **Edit Widget**
7. Select **Social Media Manager**
8. Tap outside to save

Now you'll see:
- Current usage / limit
- Progress bar
- Time remaining
- Bypass count
- Updates automatically

## Customization

### Make It Stricter

```javascript
dailyLimitMinutes: 15,        // Shorter limit
extensionMinutes: 3,          // Smaller extensions
mathDifficulty: "hard",       // Harder math from start
```

### Make It More Lenient

```javascript
dailyLimitMinutes: 60,        // Longer limit
extensionMinutes: 10,         // Bigger extensions
mathDifficulty: "easy",       // Easier math
```

### Change Math Difficulty

Options: `"easy"`, `"medium"`, `"hard"`, `"advanced"`, `"expert"`

- **Easy**: Simple addition (e.g., 12 + 8)
- **Medium**: Addition/subtraction with larger numbers (e.g., 47 - 23)
- **Hard**: Multiplication (e.g., 7 × 12)

## Troubleshooting

### Widget Not Updating?
- Remove widget and re-add it
- Or just open the script to refresh

### Automation Not Running?
- Check **"Ask Before Running"** is **OFF**
- Test by running automation manually in Shortcuts
- Check automation is enabled (toggle should be green)

### Math Problems Too Hard?
Edit script and change:
```javascript
mathDifficulty: "easy",
```

### Want More Accurate Usage?
Use **manual tracking** instead of automatic:
- Disable the hourly automation
- Always use "Start Session" before opening apps
- More work, but perfectly accurate

### Reset Everything?
1. Run script
2. Choose **View Report**
3. Select **Clear History**
4. Confirms deletion
5. Fresh start!

## Pro Tips

### For Maximum Success:

1. **Be honest** - Don't disable automation on weak days
2. **Put widget on home screen** - Constant awareness
3. **Review weekly** - Run report every Sunday
4. **Share your stats** - Tell a friend your bypass count
5. **Celebrate wins** - Zero bypass days deserve recognition
6. **Start realistic** - Begin at 60 min, lower gradually
7. **Use Focus mode** - Block apps during work/study

### Common Pitfalls to Avoid:

1. **Setting unrealistic limits** - You'll just bypass constantly
2. **Disabling on "bad days"** - Defeats the purpose
3. **Deleting when frustrated** - Stick with it for 2 weeks
4. **Ignoring the reports** - Data shows your patterns
5. **Not using widget** - Out of sight, out of mind

## Understanding Your Data

### What Gets Tracked

- **Daily usage**: Total minutes on social media
- **Bypass attempts**: How many times you extended
- **Bypass reasons**: What you wrote (2nd bypass)
- **Timestamps**: When each bypass occurred
- **Trends**: Daily patterns over time

### What Doesn't Get Tracked

- Exact app opens/closes
- Which specific app you used
- What you viewed or posted
- Screen recordings
- Any identifying content

**Privacy-first design** - only duration and bypass stats.

## The Psychology

### Why This Works

1. **Friction, not walls** - Challenges create pause moments
2. **Limited damage** - 5 minute extensions prevent binging
3. **Escalating difficulty** - Gets harder each time
4. **Accountability** - Logged reasons create self-awareness
5. **Fresh starts** - Daily reset prevents giving up
6. **Social pressure** - Shareable reports add stakes

### Why Traditional App Limits Fail

- Too easy to bypass (one tap)
- No psychological friction
- No accountability or reflection
- Binary (blocked or unlimited)
- No data on your patterns

### This System Is Different

- Progressive difficulty (not binary)
- Creates conscious choice moments
- Tracks and exposes patterns
- Builds self-awareness over time
- Balances restriction with agency

## The Full Loop

```
1. Use social media normally
         ↓
2. Hit daily limit (30 min)
         ↓
3. Presented with 1st challenge
         ↓
4. Solve easy math → Get 5 minutes
         ↓
5. Use 5 more minutes
         ↓
6. Hit limit again
         ↓
7. Presented with 2nd challenge
         ↓
8. Solve harder math + write reason → Get 5 minutes
         ↓
9. Use 5 more minutes
         ↓
10. Hit limit again
         ↓
11. Locked out until tomorrow
         ↓
12. Manually enable Focus mode
         ↓
13. Review your day in weekly report
         ↓
14. Reflect on bypass reasons
         ↓
15. Next day: Fresh start (reset to 0)
```

## Quick Reference

| Want to... | Do this... |
|------------|------------|
| Check usage | Run script → Check Status |
| Log a session | Run script → Start Session (twice) |
| View stats | Run script → View Report |
| Get extension | Wait for limit alert or run script |
| Reset history | View Report → Clear History |
| Change settings | Edit CONFIG section in script |
| Test math | Settings → Test Math Challenge |
| Add widget | Long-press home → + → Scriptable |

## Important Limitations

### This System CAN Be Bypassed

You can always:
- Delete the script
- Disable the automation  
- Turn off Screen Time
- Uninstall Scriptable

**This is intentional.** The goal isn't an unbreakable prison - it's creating enough friction that you make **conscious choices** instead of **mindless scrolling**.

### iOS Restrictions

Taking a sandbox approach; scriptable can't do direct app modifications or has a system-level scrolling API

The script **cannot** automatically:
- Block other apps (use Screen Time for this)
- Access real-time Screen Time data (use manual tracking)
- Enable Focus mode (you must do manually)



## Success Stories

**Week 1**: You'll bypass 2-3 times per day. That's normal.

**Week 2**: You'll start bypassing less as awareness builds.

**Week 3**: You'll have your first zero-bypass day. Celebrate it!

**Week 4**: New habits forming. Social media feels less magnetic.

**Month 2**: You're in control. You use social media intentionally, not compulsively.

## Next Steps

1. Install Scriptable
2. Add the script  
3. Configure your apps
4. Set up iOS Screen Time
5. Create hourly automation
6. Add widget to home screen
7. Use for one full week
8. Review your first weekly report
9. Adjust settings as needed
10. Share progress with a friend

---

**Remember**: Progress over perfection. You'll have bad days. The key is the overall trend moving downward over time.

Good luck! You've got this.