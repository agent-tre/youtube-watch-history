/**
 * YouTube Data API v3 client
 */

import { google, youtube_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { YouTubeActivity, YouTubeVideo } from './types.js';

/**
 * Create YouTube API client
 */
export function createYouTubeClient(auth: OAuth2Client): youtube_v3.Youtube {
  return google.youtube({ version: 'v3', auth });
}

/**
 * Fetch user's YouTube activities (watch history)
 */
export async function fetchActivities(
  auth: OAuth2Client,
  publishedAfter: Date,
  publishedBefore: Date,
  maxResults: number = 50
): Promise<YouTubeActivity[]> {
  const youtube = createYouTubeClient(auth);

  const response = await youtube.activities.list({
    part: ['snippet', 'contentDetails'],
    mine: true,
    maxResults,
    publishedAfter: publishedAfter.toISOString(),
    publishedBefore: publishedBefore.toISOString(),
  });

  return (response.data.items || []) as YouTubeActivity[];
}

/**
 * Extract video IDs from activities
 */
export function extractVideoIds(activities: YouTubeActivity[]): string[] {
  const videoIds: string[] = [];

  for (const activity of activities) {
    const { contentDetails } = activity;

    // Different activity types store video ID in different places
    if (contentDetails.upload?.videoId) {
      videoIds.push(contentDetails.upload.videoId);
    } else if (contentDetails.like?.resourceId?.videoId) {
      videoIds.push(contentDetails.like.resourceId.videoId);
    } else if (contentDetails.recommendation?.resourceId?.videoId) {
      videoIds.push(contentDetails.recommendation.resourceId.videoId);
    }
  }

  return [...new Set(videoIds)]; // Remove duplicates
}

/**
 * Fetch video details by IDs
 */
export async function fetchVideoDetails(
  auth: OAuth2Client,
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) {
    return [];
  }

  const youtube = createYouTubeClient(auth);

  // YouTube API allows up to 50 video IDs per request
  const batchSize = 50;
  const batches: string[][] = [];

  for (let i = 0; i < videoIds.length; i += batchSize) {
    batches.push(videoIds.slice(i, i + batchSize));
  }

  const allVideos: YouTubeVideo[] = [];

  for (const batch of batches) {
    const response = await youtube.videos.list({
      part: ['contentDetails', 'snippet'],
      id: batch,
    });

    allVideos.push(...((response.data.items || []) as YouTubeVideo[]));
  }

  return allVideos;
}

/**
 * Parse ISO 8601 duration to seconds
 * Examples: PT3M33S -> 213, PT1H2M10S -> 3730, PT15S -> 15
 */
export function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) {
    return 0;
  }

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
