/**
 * Fetch and process YouTube watch history
 */

import { startOfDay, endOfDay } from 'date-fns';
import { getAuthenticatedClient } from './auth.js';
import {
  fetchActivities,
  extractVideoIds,
  fetchVideoDetails,
  parseDuration,
} from './api.js';
import { determineWatchStatus } from './analyze.js';
import type {
  DailyHistory,
  DailySummary,
  VideoWatch,
  YouTubeActivity,
  YouTubeVideo,
} from './types.js';

/**
 * Fetch watch history for a specific date
 */
export async function fetchDailyHistory(date: Date): Promise<DailyHistory> {
  // Get authenticated client
  const auth = await getAuthenticatedClient();

  // Define time range (start and end of day)
  const publishedAfter = startOfDay(date);
  const publishedBefore = endOfDay(date);

  // Fetch activities
  const activities = await fetchActivities(
    auth,
    publishedAfter,
    publishedBefore
  );

  // Extract video IDs
  const videoIds = extractVideoIds(activities);

  // Fetch video details
  const videos = await fetchVideoDetails(auth, videoIds);

  // Create lookup map for videos
  const videoMap = new Map<string, YouTubeVideo>();
  for (const video of videos) {
    videoMap.set(video.id, video);
  }

  // Process activities into VideoWatch objects
  const videoWatches: VideoWatch[] = [];

  for (const activity of activities) {
    const videoId = extractVideoIdFromActivity(activity);
    if (!videoId) continue;

    const video = videoMap.get(videoId);
    if (!video) continue;

    const durationSeconds = parseDuration(video.contentDetails.duration);
    const status = determineWatchStatus(
      durationSeconds,
      activity.snippet.type
    );

    videoWatches.push({
      videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      watchedAt: activity.snippet.publishedAt,
      duration: video.contentDetails.duration,
      durationSeconds,
      status,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  // Generate summary
  const summary = generateSummary(videoWatches);

  return {
    date: date.toISOString().split('T')[0], // YYYY-MM-DD
    videos: videoWatches,
    summary,
  };
}

/**
 * Extract video ID from activity (handles different activity types)
 */
function extractVideoIdFromActivity(activity: YouTubeActivity): string | null {
  const { contentDetails } = activity;

  if (contentDetails.upload?.videoId) {
    return contentDetails.upload.videoId;
  }

  if (contentDetails.like?.resourceId?.videoId) {
    return contentDetails.like.resourceId.videoId;
  }

  if (contentDetails.recommendation?.resourceId?.videoId) {
    return contentDetails.recommendation.resourceId.videoId;
  }

  return null;
}

/**
 * Generate daily summary from video watches
 */
function generateSummary(videos: VideoWatch[]): DailySummary {
  const summary: DailySummary = {
    totalVideos: videos.length,
    completed: 0,
    started: 0,
    dropped: 0,
    totalWatchTime: 0,
  };

  for (const video of videos) {
    // Count by status
    if (video.status === 'completed') {
      summary.completed++;
      summary.totalWatchTime += video.durationSeconds;
    } else if (video.status === 'started') {
      summary.started++;
      // Estimate 50% watched for "started" videos
      summary.totalWatchTime += Math.floor(video.durationSeconds * 0.5);
    } else {
      summary.dropped++;
      // Estimate 5% watched for "dropped" videos
      summary.totalWatchTime += Math.floor(video.durationSeconds * 0.05);
    }
  }

  return summary;
}
