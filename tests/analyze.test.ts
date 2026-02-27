import { describe, it, expect } from 'vitest';
import {
  determineWatchStatus,
  determineWatchStatusAdvanced,
  categorizeVideo,
} from '../src/analyze.js';

describe('determineWatchStatus', () => {
  it('should mark short videos (< 5 min) as completed', () => {
    expect(determineWatchStatus(60, 'upload')).toBe('completed'); // 1 min
    expect(determineWatchStatus(180, 'upload')).toBe('completed'); // 3 min
    expect(determineWatchStatus(299, 'upload')).toBe('completed'); // 4:59
  });

  it('should mark medium videos (5-15 min) as started', () => {
    expect(determineWatchStatus(300, 'upload')).toBe('started'); // 5 min
    expect(determineWatchStatus(600, 'upload')).toBe('started'); // 10 min
    expect(determineWatchStatus(899, 'upload')).toBe('started'); // 14:59
  });

  it('should mark long videos (> 15 min) as started', () => {
    expect(determineWatchStatus(900, 'upload')).toBe('started'); // 15 min
    expect(determineWatchStatus(1800, 'upload')).toBe('started'); // 30 min
    expect(determineWatchStatus(3600, 'upload')).toBe('started'); // 1 hour
  });

  it('should mark liked long videos as started', () => {
    expect(determineWatchStatus(1800, 'like')).toBe('started'); // 30 min
    expect(determineWatchStatus(3600, 'like')).toBe('started'); // 1 hour
  });

  it('should handle edge cases', () => {
    expect(determineWatchStatus(0, 'upload')).toBe('completed'); // 0 sec
    expect(determineWatchStatus(1, 'upload')).toBe('completed'); // 1 sec
  });
});

describe('determineWatchStatusAdvanced', () => {
  it('should mark videos with >90% watched as completed', () => {
    expect(determineWatchStatusAdvanced(100, 95)).toBe('completed');
    expect(determineWatchStatusAdvanced(600, 550)).toBe('completed'); // 91.6%
    expect(determineWatchStatusAdvanced(1000, 900)).toBe('completed');
  });

  it('should mark videos with 10-90% watched as started', () => {
    expect(determineWatchStatusAdvanced(100, 50)).toBe('started'); // 50%
    expect(determineWatchStatusAdvanced(600, 300)).toBe('started'); // 50%
    expect(determineWatchStatusAdvanced(1000, 100)).toBe('started'); // 10%
    expect(determineWatchStatusAdvanced(1000, 850)).toBe('started'); // 85%
  });

  it('should mark videos with <10% watched as dropped', () => {
    expect(determineWatchStatusAdvanced(100, 5)).toBe('dropped'); // 5%
    expect(determineWatchStatusAdvanced(600, 30)).toBe('dropped'); // 5%
    expect(determineWatchStatusAdvanced(1000, 50)).toBe('dropped'); // 5%
  });

  it('should handle edge cases', () => {
    expect(determineWatchStatusAdvanced(100, 0)).toBe('dropped'); // 0%
    expect(determineWatchStatusAdvanced(100, 100)).toBe('completed'); // 100%
  });

  it('should handle boundary conditions', () => {
    expect(determineWatchStatusAdvanced(100, 10)).toBe('started'); // Exactly 10%
    expect(determineWatchStatusAdvanced(100, 90)).toBe('completed'); // Exactly 90%
  });
});

describe('categorizeVideo', () => {
  it('should categorize tutorial videos', () => {
    expect(categorizeVideo('How to Build a Website', 'Tech Channel')).toContain('tutorial');
    expect(categorizeVideo('Complete Guide to TypeScript', 'Dev Channel')).toContain('tutorial');
    expect(categorizeVideo('JavaScript Tutorial for Beginners', 'Code Academy')).toContain('tutorial');
  });

  it('should categorize podcast videos', () => {
    expect(categorizeVideo('Podcast Episode 42: AI and the Future', 'Tech Talks')).toContain('podcast');
    expect(categorizeVideo('Interview with Naval Ravikant', 'Wisdom Seekers')).toContain('podcast');
  });

  it('should categorize music videos', () => {
    expect(categorizeVideo('Never Gonna Give You Up', 'Rick Astley')).toContain('music');
    expect(categorizeVideo('Official Music Video', 'Artist VEVO')).toContain('music');
    expect(categorizeVideo('Latest Song 2026', 'Music Channel')).toContain('music');
  });

  it('should categorize review videos', () => {
    expect(categorizeVideo('iPhone 15 Review', 'Tech Reviews')).toContain('review');
    expect(categorizeVideo('Unboxing the New MacBook Pro', 'Unbox Therapy')).toContain('review');
  });

  it('should categorize news videos', () => {
    expect(categorizeVideo('Breaking News: Market Crash', 'News Network')).toContain('news');
    expect(categorizeVideo('Today\'s News Summary', 'Daily News')).toContain('news');
  });

  it('should return general for uncategorized videos', () => {
    expect(categorizeVideo('Random Video Title', 'Random Channel')).toEqual(['general']);
    expect(categorizeVideo('Just a normal video', 'Regular Channel')).toEqual(['general']);
  });

  it('should handle multiple categories', () => {
    const categories = categorizeVideo('Tutorial: How to Review Music', 'Tech Music Channel');
    expect(categories.length).toBeGreaterThan(1);
    expect(categories).toContain('tutorial');
  });

  it('should be case insensitive', () => {
    expect(categorizeVideo('TUTORIAL: LEARN PYTHON', 'CODING CHANNEL')).toContain('tutorial');
    expect(categorizeVideo('podcast episode', 'podcast channel')).toContain('podcast');
  });
});
