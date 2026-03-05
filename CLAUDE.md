# YouTube Watch History Logger - Project Context

## What This Is

A TypeScript CLI tool to log YouTube watch history outside YouTube for personal reflection.

## Status

**Phase 1 in progress** — source files written, not yet tested end-to-end.

## Quick Start

```bash
npm install          # Dependencies installed, node_modules present
npm run dev          # Run CLI via tsx (no build needed)
npm test             # Run tests via vitest
```

**Note:** `npm run build` (tsc) runs slowly in constrained containers — use `npm run dev` with `tsx` for local development instead.

## Project Structure

```
src/
  types.ts      # Core TypeScript types (VideoWatch, DailyHistory, OAuthTokens)
  auth.ts       # OAuth2 flow, token management (~/.youtube-history/auth.json)
  api.ts        # YouTube Data API v3 client
  fetch.ts      # Fetch and process daily watch history
  analyze.ts    # Determine completion status (completed/started/dropped)
  storage.ts    # Write daily JSON files to history/ directory
  cli.ts        # CLI commands via commander
tests/
  auth.test.ts, api.test.ts, analyze.test.ts, storage.test.ts
```

## Key Design Decisions

- **Auth:** OAuth2 with offline access. Credentials file at `~/.youtube-history/credentials.json` (downloaded from Google Cloud Console). Tokens at `~/.youtube-history/auth.json`.
- **Storage:** Daily JSON files in `history/YYYY-MM-DD.json`
- **Watch status:** Completed (>90% or <5min), Started (10-90%), Dropped (<10%). Note: YouTube API may not provide exact percentages.
- **Scopes:** `youtube.readonly` only

## Known Issues

- Minor TypeScript strict-mode issue in `auth.ts` line 101: `tokens.refresh_token` from Google's API is `string | null | undefined`, but `OAuthTokens.refresh_token` is typed as `string | undefined`. Fixed with `?? undefined`.
- `tsc` compiler may be slow/killed in resource-constrained containers — use `tsx` for dev.

## CLI Commands

```bash
youtube-history auth                    # OAuth flow (one-time)
youtube-history fetch                   # Fetch yesterday's history
youtube-history fetch --date 2026-02-25 # Fetch specific date
youtube-history summary --week          # Weekly summary
```

## Setup Required (One-Time)

1. Create Google Cloud project, enable YouTube Data API v3
2. Create OAuth 2.0 credentials (Desktop app type)
3. Download credentials JSON to `~/.youtube-history/credentials.json`
4. Run `youtube-history auth` to complete OAuth flow

## Implementation Progress

- [x] Types defined (types.ts)
- [x] OAuth auth flow (auth.ts)
- [x] YouTube API client (api.ts)
- [x] Fetch logic (fetch.ts)
- [x] Watch status analysis (analyze.ts)
- [x] File storage (storage.ts)
- [x] CLI interface (cli.ts)
- [ ] Tests passing (not yet run end-to-end)
- [ ] Real OAuth flow tested
- [ ] NanoClaw scheduled task integration

## Future Integration

Phase 3: NanoClaw scheduled task runs `youtube-history fetch` daily at midnight and sends reflection reports.
