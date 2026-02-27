import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTokenExpired } from '../src/auth.js';
import type { OAuthTokens } from '../src/types.js';

describe('isTokenExpired', () => {
  beforeEach(() => {
    // Mock Date.now() to return a consistent timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-26T12:00:00Z'));
  });

  it('should return false for unexpired token', () => {
    const tokens: OAuthTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600 * 1000, // 1 hour from now
    };

    expect(isTokenExpired(tokens)).toBe(false);
  });

  it('should return true for expired token', () => {
    const tokens: OAuthTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
      expiry_date: Date.now() - 1000, // 1 second ago
    };

    expect(isTokenExpired(tokens)).toBe(true);
  });

  it('should return true for token expiring exactly now', () => {
    const tokens: OAuthTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
      expiry_date: Date.now(),
    };

    expect(isTokenExpired(tokens)).toBe(true);
  });

  it('should handle tokens with far future expiry', () => {
    const tokens: OAuthTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
      expiry_date: Date.now() + 365 * 24 * 3600 * 1000, // 1 year from now
    };

    expect(isTokenExpired(tokens)).toBe(false);
  });

  it('should handle tokens with far past expiry', () => {
    const tokens: OAuthTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
      expiry_date: Date.now() - 365 * 24 * 3600 * 1000, // 1 year ago
    };

    expect(isTokenExpired(tokens)).toBe(true);
  });
});
