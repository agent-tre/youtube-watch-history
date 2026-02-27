/**
 * Core types for YouTube watch history tracking
 */

export type WatchStatus = 'completed' | 'started' | 'dropped';

export interface VideoWatch {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  watchedAt: string;
  duration: string; // ISO 8601 duration (e.g., "PT3M33S")
  durationSeconds: number;
  status: WatchStatus;
  url: string;
}

export interface DailySummary {
  totalVideos: number;
  completed: number;
  started: number;
  dropped: number;
  totalWatchTime: number; // seconds
}

export interface DailyHistory {
  date: string; // YYYY-MM-DD
  videos: VideoWatch[];
  summary: DailySummary;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface YouTubeActivity {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    channelTitle: string;
    type: string;
  };
  contentDetails: {
    upload?: {
      videoId: string;
    };
    like?: {
      resourceId: {
        videoId: string;
      };
    };
    recommendation?: {
      resourceId: {
        videoId: string;
      };
    };
  };
}

export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  contentDetails: {
    duration: string; // ISO 8601 duration
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    channelTitle: string;
  };
}
