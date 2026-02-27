#!/usr/bin/env node

/**
 * CLI interface for YouTube watch history logger
 */

import { Command } from 'commander';
import { subDays, format } from 'date-fns';
import {
  getAuthUrl,
  getTokensFromCode,
  saveTokens,
  loadTokens,
} from './auth.js';
import { fetchDailyHistory } from './fetch.js';
import { saveDailyHistory, loadHistoryRange, listHistoryDates } from './storage.js';

const program = new Command();

program
  .name('youtube-history')
  .description('Log YouTube watch history for personal reflection')
  .version('0.1.0');

/**
 * Authentication command
 */
program
  .command('auth')
  .description('Authenticate with YouTube (one-time setup)')
  .action(async () => {
    try {
      console.log('Starting OAuth authentication...\n');

      // Check if already authenticated
      const existingTokens = await loadTokens();
      if (existingTokens) {
        console.log('✓ Already authenticated!');
        console.log('  Access token expires:', new Date(existingTokens.expiry_date).toLocaleString());
        console.log('\nTo re-authenticate, delete ~/.youtube-history/auth.json and run this command again.');
        return;
      }

      // Get authorization URL
      const authUrl = await getAuthUrl();

      console.log('Please visit this URL to authorize:\n');
      console.log(authUrl);
      console.log('\nAfter authorizing, copy the code from the redirect URL and paste it below.');
      console.log('(The code will be in the URL after "code=")');
      console.log();

      // In a real CLI, we'd use readline to get input
      // For now, just show instructions
      console.log('Run the following after getting your code:');
      console.log('  youtube-history auth-callback <code>');

    } catch (error) {
      console.error('Authentication failed:', error);
      process.exit(1);
    }
  });

/**
 * Auth callback command (hidden, for receiving code)
 */
program
  .command('auth-callback <code>')
  .description('Complete OAuth flow with authorization code')
  .action(async (code: string) => {
    try {
      console.log('Exchanging code for tokens...');

      const tokens = await getTokensFromCode(code);
      await saveTokens(tokens);

      console.log('✓ Authentication successful!');
      console.log('  Tokens saved to ~/.youtube-history/auth.json');
      console.log('\nYou can now fetch your watch history:');
      console.log('  youtube-history fetch');
    } catch (error) {
      console.error('Failed to complete authentication:', error);
      process.exit(1);
    }
  });

/**
 * Fetch command
 */
program
  .command('fetch')
  .description('Fetch watch history')
  .option('-d, --date <date>', 'Date to fetch (YYYY-MM-DD), defaults to yesterday')
  .option('--from <date>', 'Start date for range (YYYY-MM-DD)')
  .option('--to <date>', 'End date for range (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      // Determine date range
      let dates: Date[];

      if (options.from && options.to) {
        // Date range
        const from = new Date(options.from);
        const to = new Date(options.to);
        dates = [];

        let current = from;
        while (current <= to) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + 24 * 3600 * 1000);
        }
      } else if (options.date) {
        // Single date
        dates = [new Date(options.date)];
      } else {
        // Default: yesterday
        dates = [subDays(new Date(), 1)];
      }

      console.log(`Fetching watch history for ${dates.length} day(s)...\n`);

      // Fetch each date
      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');

        try {
          console.log(`Fetching ${dateStr}...`);

          const history = await fetchDailyHistory(date);
          await saveDailyHistory(history);

          console.log(`✓ ${dateStr}: ${history.videos.length} videos`);
          console.log(`  Completed: ${history.summary.completed}`);
          console.log(`  Started: ${history.summary.started}`);
          console.log(`  Dropped: ${history.summary.dropped}`);
          console.log(`  Total watch time: ${Math.floor(history.summary.totalWatchTime / 60)} minutes\n`);
        } catch (error) {
          console.error(`✗ ${dateStr}: Failed -`, error);
        }
      }

      console.log('Done!');
    } catch (error) {
      console.error('Fetch failed:', error);
      process.exit(1);
    }
  });

/**
 * Summary command
 */
program
  .command('summary')
  .description('Show summary of watch history')
  .option('-w, --week', 'Show this week\'s summary')
  .option('-m, --month', 'Show this month\'s summary')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      let from: string;
      let to: string;

      const today = new Date();

      if (options.week) {
        // This week (last 7 days)
        from = format(subDays(today, 7), 'yyyy-MM-dd');
        to = format(today, 'yyyy-MM-dd');
      } else if (options.month) {
        // This month (last 30 days)
        from = format(subDays(today, 30), 'yyyy-MM-dd');
        to = format(today, 'yyyy-MM-dd');
      } else if (options.from && options.to) {
        from = options.from;
        to = options.to;
      } else {
        console.error('Please specify --week, --month, or --from/--to');
        process.exit(1);
      }

      console.log(`Summary from ${from} to ${to}\n`);

      const histories = await loadHistoryRange(from, to);

      if (histories.length === 0) {
        console.log('No watch history found for this period.');
        return;
      }

      // Aggregate statistics
      let totalVideos = 0;
      let totalCompleted = 0;
      let totalStarted = 0;
      let totalDropped = 0;
      let totalWatchTime = 0;

      for (const history of histories) {
        totalVideos += history.summary.totalVideos;
        totalCompleted += history.summary.completed;
        totalStarted += history.summary.started;
        totalDropped += history.summary.dropped;
        totalWatchTime += history.summary.totalWatchTime;
      }

      console.log(`Days with data: ${histories.length}`);
      console.log(`Total videos: ${totalVideos}`);
      console.log(`  Completed: ${totalCompleted} (${Math.round(totalCompleted / totalVideos * 100)}%)`);
      console.log(`  Started: ${totalStarted} (${Math.round(totalStarted / totalVideos * 100)}%)`);
      console.log(`  Dropped: ${totalDropped} (${Math.round(totalDropped / totalVideos * 100)}%)`);
      console.log(`Total watch time: ${Math.floor(totalWatchTime / 3600)} hours ${Math.floor((totalWatchTime % 3600) / 60)} minutes`);
      console.log(`Average per day: ${Math.round(totalVideos / histories.length)} videos, ${Math.floor(totalWatchTime / histories.length / 60)} minutes`);
    } catch (error) {
      console.error('Summary failed:', error);
      process.exit(1);
    }
  });

/**
 * List command
 */
program
  .command('list')
  .description('List all available history dates')
  .action(async () => {
    try {
      const dates = await listHistoryDates();

      if (dates.length === 0) {
        console.log('No watch history found.');
        console.log('Run "youtube-history fetch" to download your history.');
        return;
      }

      console.log(`Found ${dates.length} days of watch history:\n`);

      for (const date of dates) {
        console.log(`  ${date}`);
      }

      console.log(`\nFirst: ${dates[0]}`);
      console.log(`Last: ${dates[dates.length - 1]}`);
    } catch (error) {
      console.error('List failed:', error);
      process.exit(1);
    }
  });

program.parse();
