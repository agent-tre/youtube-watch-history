# Setup Guide

## Prerequisites

1. **Node.js** 18+ installed
2. **Google Cloud Console** account
3. **YouTube account** with watch history enabled

## Step 1: Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Name it "YouTube Watch History Logger"
   - Click "Create"
5. Download the JSON file and save it as `~/.youtube-history/credentials.json`

## Step 2: Install Dependencies

```bash
cd youtube-watch-history
npm install
```

## Step 3: Authenticate

```bash
npm run auth
```

This will:
1. Print an authorization URL
2. Open it in your browser
3. Ask you to grant permissions
4. Redirect to localhost with a code
5. Copy the code and run: `npm run dev auth-callback <code>`

Your tokens will be saved to `~/.youtube-history/auth.json`

## Step 4: Fetch History

```bash
# Fetch yesterday's history
npm run fetch

# Fetch specific date
npm run fetch -- --date 2026-02-25

# Fetch date range
npm run fetch -- --from 2026-02-20 --to 2026-02-26
```

History files will be saved to `~/.youtube-history/history/YYYY-MM-DD.json`

## Step 5: View Summary

```bash
# This week
npm run dev summary --week

# This month
npm run dev summary --month

# Custom range
npm run dev summary --from 2026-02-01 --to 2026-02-26
```

## Step 6: Run Tests

```bash
npm test
```

## Step 7: Build for Production

```bash
npm run build
npm link
```

Now you can use `youtube-history` command globally:

```bash
youtube-history fetch
youtube-history summary --week
```

## Scheduling Daily Fetches

### Option 1: NanoClaw Scheduled Task

Add to your NanoClaw group:

```javascript
schedule_task({
  prompt: "Fetch yesterday's YouTube watch history using youtube-history CLI",
  schedule_type: "cron",
  schedule_value: "0 1 * * *" // 1 AM daily
});
```

### Option 2: cron (macOS/Linux)

```bash
crontab -e
```

Add:
```
0 1 * * * cd ~/youtube-watch-history && npm run fetch
```

### Option 3: launchd (macOS)

Create `~/Library/LaunchAgents/com.user.youtube-history.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.youtube-history</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/youtube-history/dist/cli.js</string>
        <string>fetch</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>1</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.user.youtube-history.plist
```

## Troubleshooting

### "Not authenticated" error

Run `youtube-history auth` again to re-authenticate.

### "Quota exceeded" error

You've hit the daily API quota (10,000 units). Wait until tomorrow.

### "Invalid credentials" error

Check that `~/.youtube-history/credentials.json` exists and is valid.

### No videos found

Check that:
1. YouTube watch history is enabled in your account settings
2. You watched videos on the date you're fetching
3. The date range is correct

## File Locations

- **Credentials:** `~/.youtube-history/credentials.json` (from Google Cloud Console)
- **Auth tokens:** `~/.youtube-history/auth.json` (generated during authentication)
- **History data:** `~/.youtube-history/history/YYYY-MM-DD.json`

## API Quotas

YouTube Data API v3 has a default quota of 10,000 units per day.

Each operation costs:
- `activities.list`: 1 unit
- `videos.list`: 1 unit

Typical daily usage: 2-5 units (well within limits)
