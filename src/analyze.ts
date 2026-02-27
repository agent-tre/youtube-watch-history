/**
 * Analyze watch history and determine completion status
 */

import type { WatchStatus } from './types.js';

/**
 * Determine watch status based on video duration
 *
 * Note: YouTube Data API doesn't provide exact watch percentage,
 * so we use heuristics based on video length and activity type.
 *
 * Rules:
 * - Videos < 5 minutes: assumed completed if in watch history
 * - Videos 5-15 minutes: assumed started (may not complete)
 * - Videos > 15 minutes: assumed started (rarely complete)
 */
export function determineWatchStatus(
  durationSeconds: number,
  activityType: string
): WatchStatus {
  // Short videos (< 5 min) are usually watched completely
  if (durationSeconds < 300) {
    return 'completed';
  }

  // Medium videos (5-15 min) are often started but not completed
  if (durationSeconds < 900) {
    return 'started';
  }

  // Long videos (> 15 min) are usually not completed
  // But if it's a "like" activity, user probably watched enough to like it
  if (activityType === 'like') {
    return 'started'; // At least watched enough to form an opinion
  }

  return 'started';
}

/**
 * More sophisticated status determination (for future enhancement)
 *
 * If we had watch percentage data, we could use:
 * - > 90%: completed
 * - 10-90%: started
 * - < 10%: dropped
 *
 * This function is a placeholder for when/if that data becomes available.
 */
export function determineWatchStatusAdvanced(
  durationSeconds: number,
  watchedSeconds: number
): WatchStatus {
  const percentage = (watchedSeconds / durationSeconds) * 100;

  if (percentage >= 90) {
    return 'completed';
  }

  if (percentage >= 10) {
    return 'started';
  }

  return 'dropped';
}

/**
 * Categorize video by type based on title and channel
 * (for future enhancement - not used yet)
 */
export function categorizeVideo(
  title: string,
  channelTitle: string
): string[] {
  const categories: string[] = [];

  // Simple keyword matching (can be improved with ML)
  const titleLower = title.toLowerCase();
  const channelLower = channelTitle.toLowerCase();

  if (
    titleLower.includes('tutorial') ||
    titleLower.includes('how to') ||
    titleLower.includes('guide')
  ) {
    categories.push('tutorial');
  }

  if (
    titleLower.includes('podcast') ||
    titleLower.includes('interview')
  ) {
    categories.push('podcast');
  }

  if (
    titleLower.includes('music') ||
    titleLower.includes('song') ||
    channelLower.includes('vevo')
  ) {
    categories.push('music');
  }

  if (
    titleLower.includes('review') ||
    titleLower.includes('unbox')
  ) {
    categories.push('review');
  }

  if (
    titleLower.includes('news') ||
    titleLower.includes('breaking')
  ) {
    categories.push('news');
  }

  return categories.length > 0 ? categories : ['general'];
}
