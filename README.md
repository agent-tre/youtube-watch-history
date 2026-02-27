# YouTube Watch History Logger

**Created:** 2026-02-26
**Goal:** Log YouTube watch history outside of YouTube for personal reflection

## Problem Statement

YouTube's watch history is locked inside their platform. For personal reflection and analysis, we need:
- Daily JSON logs of what was watched
- Video completion status (completed vs started vs dropped)
- Data stored locally, outside Google's control

## Solution Architecture

### Technology Stack
- **Language:** TypeScript (excellent OAuth support, type safety, CLI tooling)
- **OAuth Library:** `googleapis` (official Google client)
- **CLI Framework:** `commander` (standard Node.js CLI tool)
- **Storage:** Daily JSON files (e.g., `2026-02-26.json`)
- **Testing:** `vitest` (fast, modern, TypeScript-first)

### Data Flow

```
1. OAuth Authentication (one-time setup)
   └─> Store refresh token in ~/.youtube-history/auth.json

2. Daily Fetch (scheduled or manual)
   └─> YouTube Data API v3: activities.list
   └─> Filter for video watches in last 24h
   └─> Enrich with video details (duration, etc.)
   └─> Calculate completion status
   └─> Write to daily JSON file

3. Reflection
   └─> Read JSON files
   └─> Analyze patterns (channels, topics, completion rates)
```

### Watch Status Logic

**Completed:**
- Video duration < 5 minutes AND watched
- OR watched percentage > 90%

**Started:**
- Watched percentage between 10% and 90%

**Dropped:**
- Watched percentage < 10% (may not be detectable via API)

**Note:** YouTube Data API may not provide exact watch percentages. We'll work with available data (activity type, timestamps).

## API Endpoints

### YouTube Data API v3

**Authentication:**
```
Scope: https://www.googleapis.com/auth/youtube.readonly
```

**Fetch Watch History:**
```
GET https://www.googleapis.com/youtube/v3/activities
?part=snippet,contentDetails
&mine=true
&maxResults=50
&publishedAfter=2026-02-25T00:00:00Z
&publishedBefore=2026-02-26T00:00:00Z
```

**Fetch Video Details:**
```
GET https://www.googleapis.com/youtube/v3/videos
?part=contentDetails,statistics
&id=VIDEO_ID_1,VIDEO_ID_2
```

## File Structure

```
youtube-watch-history/
├── src/
│   ├── auth.ts           # OAuth flow, token management
│   ├── api.ts            # YouTube API client
│   ├── fetch.ts          # Fetch daily watch history
│   ├── analyze.ts        # Determine completion status
│   ├── storage.ts        # Write daily JSON files
│   ├── cli.ts            # CLI commands
│   └── types.ts          # TypeScript types
├── tests/
│   ├── auth.test.ts
│   ├── api.test.ts
│   ├── fetch.test.ts
│   ├── analyze.test.ts
│   └── storage.test.ts
├── history/              # Daily JSON files
│   ├── 2026-02-26.json
│   └── 2026-02-25.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Daily JSON Format

```json
{
  "date": "2026-02-26",
  "videos": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "channelTitle": "Rick Astley",
      "publishedAt": "2009-10-25T06:57:33Z",
      "watchedAt": "2026-02-26T08:30:00Z",
      "duration": "PT3M33S",
      "durationSeconds": 213,
      "status": "completed",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      "videoId": "jNQXAC9IVRw",
      "title": "Me at the zoo",
      "channelTitle": "jawed",
      "publishedAt": "2005-04-23T23:31:52Z",
      "watchedAt": "2026-02-26T14:15:00Z",
      "duration": "PT19S",
      "durationSeconds": 19,
      "status": "completed",
      "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"
    }
  ],
  "summary": {
    "totalVideos": 2,
    "completed": 2,
    "started": 0,
    "dropped": 0,
    "totalWatchTime": 232
  }
}
```

## CLI Commands

```bash
# One-time authentication
youtube-history auth

# Fetch yesterday's history
youtube-history fetch

# Fetch specific date
youtube-history fetch --date 2026-02-25

# Fetch date range
youtube-history fetch --from 2026-02-20 --to 2026-02-26

# Show summary for current week
youtube-history summary --week

# Show summary for current month
youtube-history summary --month
```

## Implementation Plan

### Phase 1: Core Functionality
- [x] Project setup
- [ ] OAuth authentication flow
- [ ] YouTube API client
- [ ] Fetch watch history
- [ ] Parse and structure data
- [ ] Write daily JSON files
- [ ] Unit tests (>80% coverage)

### Phase 2: Analysis
- [ ] Determine completion status
- [ ] Generate daily summaries
- [ ] Weekly/monthly aggregation

### Phase 3: Integration
- [ ] NanoClaw scheduled task (daily at midnight)
- [ ] Reflection reports
- [ ] Channel/topic analysis

## Testing Strategy

**Unit Tests:**
- Mock YouTube API responses
- Test OAuth token refresh
- Test JSON parsing and validation
- Test completion status logic
- Test file writing

**Integration Tests:**
- Test full fetch flow (with mocked API)
- Test CLI commands

**Manual Testing:**
- Real OAuth flow
- Real API calls (against test account)

## API Limitations

**YouTube Data API Quotas:**
- 10,000 units per day (default)
- activities.list = 1 unit per request
- videos.list = 1 unit per request
- Typical daily usage: 2-5 units (well within limits)

**Watch History Limitations:**
- May not include exact watch percentage
- May not include partial views
- Respects user's privacy settings

## Dependencies

```json
{
  "dependencies": {
    "googleapis": "^131.0.0",
    "commander": "^12.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.2.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0"
  }
}
```

## Future Enhancements

- Channel categorization (tech, entertainment, education)
- Topic extraction from titles
- Watch pattern analysis (time of day, day of week)
- Integration with zettelkasten (create notes for watched videos)
- Browser extension for more accurate watch time tracking

---

**Status:** Prototyping
**Next Step:** Implement OAuth authentication and API client
