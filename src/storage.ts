/**
 * Storage layer for daily watch history files
 */

import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import type { DailyHistory } from './types.js';

const DEFAULT_HISTORY_DIR = path.join(homedir(), '.youtube-history', 'history');

/**
 * Ensure history directory exists
 */
export async function ensureHistoryDir(historyDir: string = DEFAULT_HISTORY_DIR): Promise<void> {
  try {
    await fs.mkdir(historyDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create history directory: ${error}`);
  }
}

/**
 * Get file path for a specific date
 */
export function getHistoryFilePath(date: string, historyDir: string = DEFAULT_HISTORY_DIR): string {
  return path.join(historyDir, `${date}.json`);
}

/**
 * Save daily history to file
 */
export async function saveDailyHistory(
  history: DailyHistory,
  historyDir: string = DEFAULT_HISTORY_DIR
): Promise<void> {
  await ensureHistoryDir(historyDir);

  const filePath = getHistoryFilePath(history.date, historyDir);
  const content = JSON.stringify(history, null, 2);

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Load daily history from file
 */
export async function loadDailyHistory(
  date: string,
  historyDir: string = DEFAULT_HISTORY_DIR
): Promise<DailyHistory | null> {
  const filePath = getHistoryFilePath(date, historyDir);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Check if history exists for a date
 */
export async function historyExists(
  date: string,
  historyDir: string = DEFAULT_HISTORY_DIR
): Promise<boolean> {
  const filePath = getHistoryFilePath(date, historyDir);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all available history dates
 */
export async function listHistoryDates(
  historyDir: string = DEFAULT_HISTORY_DIR
): Promise<string[]> {
  try {
    const files = await fs.readdir(historyDir);

    // Filter for JSON files and extract dates
    const dates = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();

    return dates;
  } catch (error) {
    return [];
  }
}

/**
 * Load multiple days of history
 */
export async function loadHistoryRange(
  startDate: string,
  endDate: string,
  historyDir: string = DEFAULT_HISTORY_DIR
): Promise<DailyHistory[]> {
  const dates = await listHistoryDates(historyDir);

  const filtered = dates.filter(
    date => date >= startDate && date <= endDate
  );

  const histories: DailyHistory[] = [];

  for (const date of filtered) {
    const history = await loadDailyHistory(date, historyDir);
    if (history) {
      histories.push(history);
    }
  }

  return histories;
}
