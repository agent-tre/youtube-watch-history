import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import {
  ensureHistoryDir,
  getHistoryFilePath,
  saveDailyHistory,
  loadDailyHistory,
  historyExists,
  listHistoryDates,
  loadHistoryRange,
} from '../src/storage.js';
import type { DailyHistory } from '../src/types.js';

// Use temp directory for tests
const TEST_HISTORY_DIR = path.join(tmpdir(), 'youtube-history-test');

describe('Storage', () => {
  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore error if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore error if directory doesn't exist
    }
  });

  describe('ensureHistoryDir', () => {
    it('should create directory if it does not exist', async () => {
      await ensureHistoryDir(TEST_HISTORY_DIR);

      const stats = await fs.stat(TEST_HISTORY_DIR);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await ensureHistoryDir(TEST_HISTORY_DIR);
      await ensureHistoryDir(TEST_HISTORY_DIR); // Call again

      const stats = await fs.stat(TEST_HISTORY_DIR);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('getHistoryFilePath', () => {
    it('should return correct file path', () => {
      const filePath = getHistoryFilePath('2026-02-26', TEST_HISTORY_DIR);
      expect(filePath).toBe(path.join(TEST_HISTORY_DIR, '2026-02-26.json'));
    });

    it('should handle different dates', () => {
      expect(getHistoryFilePath('2026-01-01', TEST_HISTORY_DIR))
        .toBe(path.join(TEST_HISTORY_DIR, '2026-01-01.json'));

      expect(getHistoryFilePath('2025-12-31', TEST_HISTORY_DIR))
        .toBe(path.join(TEST_HISTORY_DIR, '2025-12-31.json'));
    });
  });

  describe('saveDailyHistory and loadDailyHistory', () => {
    it('should save and load daily history', async () => {
      const history: DailyHistory = {
        date: '2026-02-26',
        videos: [
          {
            videoId: 'test-123',
            title: 'Test Video',
            channelTitle: 'Test Channel',
            channelId: 'channel-123',
            publishedAt: '2026-02-26T10:00:00Z',
            watchedAt: '2026-02-26T14:00:00Z',
            duration: 'PT3M33S',
            durationSeconds: 213,
            status: 'completed',
            url: 'https://www.youtube.com/watch?v=test-123',
          },
        ],
        summary: {
          totalVideos: 1,
          completed: 1,
          started: 0,
          dropped: 0,
          totalWatchTime: 213,
        },
      };

      await saveDailyHistory(history, TEST_HISTORY_DIR);
      const loaded = await loadDailyHistory('2026-02-26', TEST_HISTORY_DIR);

      expect(loaded).toEqual(history);
    });

    it('should return null for non-existent file', async () => {
      const loaded = await loadDailyHistory('2026-02-26', TEST_HISTORY_DIR);
      expect(loaded).toBeNull();
    });

    it('should preserve data types', async () => {
      const history: DailyHistory = {
        date: '2026-02-26',
        videos: [],
        summary: {
          totalVideos: 0,
          completed: 0,
          started: 0,
          dropped: 0,
          totalWatchTime: 0,
        },
      };

      await saveDailyHistory(history, TEST_HISTORY_DIR);
      const loaded = await loadDailyHistory('2026-02-26', TEST_HISTORY_DIR);

      expect(loaded?.summary.totalVideos).toBe(0);
      expect(typeof loaded?.summary.totalVideos).toBe('number');
    });
  });

  describe('historyExists', () => {
    it('should return true for existing file', async () => {
      const history: DailyHistory = {
        date: '2026-02-26',
        videos: [],
        summary: {
          totalVideos: 0,
          completed: 0,
          started: 0,
          dropped: 0,
          totalWatchTime: 0,
        },
      };

      await saveDailyHistory(history, TEST_HISTORY_DIR);
      const exists = await historyExists('2026-02-26', TEST_HISTORY_DIR);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await historyExists('2026-02-26', TEST_HISTORY_DIR);
      expect(exists).toBe(false);
    });
  });

  describe('listHistoryDates', () => {
    it('should list all history dates in sorted order', async () => {
      const dates = ['2026-02-24', '2026-02-26', '2026-02-25'];

      for (const date of dates) {
        const history: DailyHistory = {
          date,
          videos: [],
          summary: {
            totalVideos: 0,
            completed: 0,
            started: 0,
            dropped: 0,
            totalWatchTime: 0,
          },
        };
        await saveDailyHistory(history, TEST_HISTORY_DIR);
      }

      const listed = await listHistoryDates(TEST_HISTORY_DIR);
      expect(listed).toEqual(['2026-02-24', '2026-02-25', '2026-02-26']); // Sorted
    });

    it('should return empty array for empty directory', async () => {
      await ensureHistoryDir(TEST_HISTORY_DIR);
      const listed = await listHistoryDates(TEST_HISTORY_DIR);
      expect(listed).toEqual([]);
    });

    it('should return empty array for non-existent directory', async () => {
      const listed = await listHistoryDates(TEST_HISTORY_DIR);
      expect(listed).toEqual([]);
    });
  });

  describe('loadHistoryRange', () => {
    beforeEach(async () => {
      // Create test data
      const dates = ['2026-02-20', '2026-02-21', '2026-02-25', '2026-02-26', '2026-03-01'];

      for (const date of dates) {
        const history: DailyHistory = {
          date,
          videos: [],
          summary: {
            totalVideos: 0,
            completed: 0,
            started: 0,
            dropped: 0,
            totalWatchTime: 0,
          },
        };
        await saveDailyHistory(history, TEST_HISTORY_DIR);
      }
    });

    it('should load history within date range', async () => {
      const histories = await loadHistoryRange('2026-02-21', '2026-02-26', TEST_HISTORY_DIR);

      expect(histories.length).toBe(4);
      expect(histories.map(h => h.date)).toEqual([
        '2026-02-21',
        '2026-02-25',
        '2026-02-26',
        // Note: 2026-02-22, 2026-02-23, 2026-02-24 don't exist, so they're not included
      ]);
    });

    it('should load all history when range covers all dates', async () => {
      const histories = await loadHistoryRange('2026-02-01', '2026-03-31', TEST_HISTORY_DIR);

      expect(histories.length).toBe(5);
      expect(histories.map(h => h.date)).toEqual([
        '2026-02-20',
        '2026-02-21',
        '2026-02-25',
        '2026-02-26',
        '2026-03-01',
      ]);
    });

    it('should return empty array when no files in range', async () => {
      const histories = await loadHistoryRange('2026-01-01', '2026-01-31', TEST_HISTORY_DIR);
      expect(histories).toEqual([]);
    });

    it('should handle single day range', async () => {
      const histories = await loadHistoryRange('2026-02-26', '2026-02-26', TEST_HISTORY_DIR);

      expect(histories.length).toBe(1);
      expect(histories[0].date).toBe('2026-02-26');
    });
  });
});
