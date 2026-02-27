import { describe, it, expect } from 'vitest';
import { extractVideoIds, parseDuration } from '../src/api.js';
import type { YouTubeActivity } from '../src/types.js';

describe('extractVideoIds', () => {
  it('should extract video ID from upload activity', () => {
    const activities: YouTubeActivity[] = [
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id',
        snippet: {
          publishedAt: '2026-02-26T10:00:00Z',
          channelId: 'channel-123',
          title: 'Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'upload',
        },
        contentDetails: {
          upload: {
            videoId: 'video-123',
          },
        },
      },
    ];

    const result = extractVideoIds(activities);
    expect(result).toEqual(['video-123']);
  });

  it('should extract video ID from like activity', () => {
    const activities: YouTubeActivity[] = [
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id',
        snippet: {
          publishedAt: '2026-02-26T10:00:00Z',
          channelId: 'channel-123',
          title: 'Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'like',
        },
        contentDetails: {
          like: {
            resourceId: {
              videoId: 'video-456',
            },
          },
        },
      },
    ];

    const result = extractVideoIds(activities);
    expect(result).toEqual(['video-456']);
  });

  it('should extract video ID from recommendation activity', () => {
    const activities: YouTubeActivity[] = [
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id',
        snippet: {
          publishedAt: '2026-02-26T10:00:00Z',
          channelId: 'channel-123',
          title: 'Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'recommendation',
        },
        contentDetails: {
          recommendation: {
            resourceId: {
              videoId: 'video-789',
            },
          },
        },
      },
    ];

    const result = extractVideoIds(activities);
    expect(result).toEqual(['video-789']);
  });

  it('should handle multiple activities and remove duplicates', () => {
    const activities: YouTubeActivity[] = [
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id-1',
        snippet: {
          publishedAt: '2026-02-26T10:00:00Z',
          channelId: 'channel-123',
          title: 'Test Video 1',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'upload',
        },
        contentDetails: {
          upload: {
            videoId: 'video-123',
          },
        },
      },
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id-2',
        snippet: {
          publishedAt: '2026-02-26T11:00:00Z',
          channelId: 'channel-123',
          title: 'Test Video 2',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'like',
        },
        contentDetails: {
          like: {
            resourceId: {
              videoId: 'video-123', // Duplicate
            },
          },
        },
      },
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id-3',
        snippet: {
          publishedAt: '2026-02-26T12:00:00Z',
          channelId: 'channel-456',
          title: 'Test Video 3',
          description: 'Test description',
          channelTitle: 'Test Channel 2',
          type: 'upload',
        },
        contentDetails: {
          upload: {
            videoId: 'video-456',
          },
        },
      },
    ];

    const result = extractVideoIds(activities);
    expect(result).toEqual(['video-123', 'video-456']);
  });

  it('should return empty array for activities without video IDs', () => {
    const activities: YouTubeActivity[] = [
      {
        kind: 'youtube#activity',
        etag: 'test',
        id: 'test-id',
        snippet: {
          publishedAt: '2026-02-26T10:00:00Z',
          channelId: 'channel-123',
          title: 'Test Activity',
          description: 'Test description',
          channelTitle: 'Test Channel',
          type: 'subscription',
        },
        contentDetails: {},
      },
    ];

    const result = extractVideoIds(activities);
    expect(result).toEqual([]);
  });
});

describe('parseDuration', () => {
  it('should parse seconds only', () => {
    expect(parseDuration('PT15S')).toBe(15);
    expect(parseDuration('PT45S')).toBe(45);
  });

  it('should parse minutes and seconds', () => {
    expect(parseDuration('PT3M33S')).toBe(213); // 3*60 + 33
    expect(parseDuration('PT10M30S')).toBe(630); // 10*60 + 30
  });

  it('should parse hours, minutes, and seconds', () => {
    expect(parseDuration('PT1H2M10S')).toBe(3730); // 1*3600 + 2*60 + 10
    expect(parseDuration('PT2H30M45S')).toBe(9045); // 2*3600 + 30*60 + 45
  });

  it('should parse minutes only', () => {
    expect(parseDuration('PT5M')).toBe(300); // 5*60
    expect(parseDuration('PT15M')).toBe(900); // 15*60
  });

  it('should parse hours only', () => {
    expect(parseDuration('PT1H')).toBe(3600); // 1*3600
    expect(parseDuration('PT2H')).toBe(7200); // 2*3600
  });

  it('should parse hours and minutes', () => {
    expect(parseDuration('PT1H30M')).toBe(5400); // 1*3600 + 30*60
    expect(parseDuration('PT2H15M')).toBe(8100); // 2*3600 + 15*60
  });

  it('should handle invalid duration format', () => {
    expect(parseDuration('invalid')).toBe(0);
    expect(parseDuration('')).toBe(0);
    expect(parseDuration('PT')).toBe(0);
  });

  it('should parse zero duration', () => {
    expect(parseDuration('PT0S')).toBe(0);
    expect(parseDuration('PT0M0S')).toBe(0);
  });
});
