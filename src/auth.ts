/**
 * OAuth2 authentication for YouTube Data API
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import type { OAuthTokens } from './types.js';

const CONFIG_DIR = path.join(homedir(), '.youtube-history');
const TOKEN_PATH = path.join(CONFIG_DIR, 'auth.json');
const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'credentials.json');

// YouTube readonly scope
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

export interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

/**
 * Ensure config directory exists
 */
export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create config directory: ${error}`);
  }
}

/**
 * Load OAuth2 credentials from file
 */
export async function loadCredentials(): Promise<ClientCredentials> {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);

    if (!credentials.installed && !credentials.web) {
      throw new Error('Invalid credentials format');
    }

    const creds = credentials.installed || credentials.web;
    return {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      redirect_uris: creds.redirect_uris,
    };
  } catch (error) {
    throw new Error(
      `Failed to load credentials from ${CREDENTIALS_PATH}. ` +
      `Download OAuth credentials from Google Cloud Console and save to this path.`
    );
  }
}

/**
 * Create OAuth2 client
 */
export async function createOAuth2Client(): Promise<OAuth2Client> {
  const credentials = await loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

/**
 * Generate authentication URL for user to authorize
 */
export async function getAuthUrl(): Promise<string> {
  const oauth2Client = await createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<OAuthTokens> {
  const oauth2Client = await createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('Failed to get access token');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    scope: tokens.scope || '',
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Save tokens to file
 */
export async function saveTokens(tokens: OAuthTokens): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

/**
 * Load tokens from file
 */
export async function loadTokens(): Promise<OAuthTokens | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Check if tokens are expired
 */
export function isTokenExpired(tokens: OAuthTokens): boolean {
  return Date.now() >= tokens.expiry_date;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(tokens: OAuthTokens): Promise<OAuthTokens> {
  if (!tokens.refresh_token) {
    throw new Error('No refresh token available');
  }

  const oauth2Client = await createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    access_token: credentials.access_token!,
    refresh_token: tokens.refresh_token, // Keep original refresh token
    scope: credentials.scope || tokens.scope,
    token_type: credentials.token_type || 'Bearer',
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Get valid OAuth2 client (refreshes token if needed)
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  let tokens = await loadTokens();

  if (!tokens) {
    throw new Error('Not authenticated. Run "youtube-history auth" first.');
  }

  // Refresh if expired
  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken(tokens);
    await saveTokens(tokens);
  }

  const oauth2Client = await createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  return oauth2Client;
}
