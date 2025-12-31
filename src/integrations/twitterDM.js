/**
 * Twitter Direct Messages integration for place recommendations
 * Parse DMs for place information and sync to Notion
 */

import axios from 'axios';
import config from '../config/index.js';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Get authenticated user's ID
 */
export async function getAuthenticatedUser() {
  try {
    const response = await axios.get(`${TWITTER_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${config.twitter.bearerToken}`,
      },
    });

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Twitter authentication failed. Check your bearer token.');
    }
    throw new Error(`Failed to get user info: ${error.message}`);
  }
}

/**
 * Fetch Direct Messages
 * Note: This endpoint requires OAuth 1.0a User Context, not just Bearer Token
 */
export async function getDirectMessages(maxResults = 100) {
  try {
    const response = await axios.get(`${TWITTER_API_BASE}/dm_events`, {
      headers: {
        'Authorization': `Bearer ${config.twitter.bearerToken}`,
      },
      params: {
        'max_results': maxResults,
        'dm_event.fields': 'created_at,text,sender_id',
        'expansions': 'sender_id',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Twitter authentication failed. DMs require OAuth 1.0a authentication.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access to DMs requires elevated Twitter API access.');
    }
    throw new Error(`Failed to fetch DMs: ${error.message}`);
  }
}

/**
 * Check if a DM contains place information
 */
export function isPlaceMessage(text) {
  if (!text) return false;

  const textLower = text.toLowerCase();

  // Check for place-related keywords
  const placeKeywords = [
    'temple', 'church', 'mosque', 'shrine',
    'restaurant', 'cafe', 'coffee', 'bar', 'eatery',
    'museum', 'gallery', 'park', 'beach',
    'hotel', 'resort',
    'visit', 'check out', 'go to', 'try',
    'recommend', 'recommendation',
  ];

  const hasKeyword = placeKeywords.some(keyword => textLower.includes(keyword));

  // Check for URLs (Google Maps, etc.)
  const hasUrl = /https?:\/\/[^\s]+/.test(text);

  // Check for address-like patterns
  const hasAddress = /\d+\s+\w+\s+(street|road|rd|st|avenue|ave|lane|ln)/i.test(text);

  return hasKeyword || hasUrl || hasAddress;
}

/**
 * Extract place information from DM text
 */
export function extractPlaceFromDM(dmText) {
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = dmText.match(urlRegex) || [];

  // Find Google Maps URL
  const mapsUrl = urls.find(url =>
    url.includes('maps.google.com') ||
    url.includes('goo.gl/maps') ||
    url.includes('maps.app.goo.gl')
  );

  // Extract place name (first line or before URL)
  let name = dmText.split('\n')[0];
  if (urls.length > 0) {
    // Text before first URL might be the place name
    const beforeUrl = dmText.split(urls[0])[0].trim();
    if (beforeUrl && beforeUrl.length > 0 && beforeUrl.length < 100) {
      name = beforeUrl;
    }
  }

  // Clean up name
  name = name
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/^(check out|visit|go to|try|recommendation:?)\s*/i, '')
    .trim();

  // If name is still too long or empty, use first 100 chars
  if (!name || name.length > 150) {
    name = dmText.substring(0, 100).replace(/https?:\/\/[^\s]+/g, '').trim();
  }

  return {
    name,
    url: mapsUrl || urls[0],
    rawText: dmText,
  };
}

/**
 * Filter DMs for place-related messages
 */
export function filterPlaceDMs(dmsData, userId) {
  if (!dmsData?.data) {
    return [];
  }

  // Filter for messages sent TO you (not by you) or self-DMs
  const placeDMs = dmsData.data
    .filter(dm => {
      // Check if message is place-related
      return isPlaceMessage(dm.text);
    })
    .map(dm => ({
      ...extractPlaceFromDM(dm.text),
      dmId: dm.id,
      senderId: dm.sender_id,
      createdAt: dm.created_at,
      isSelfDM: dm.sender_id === userId,
    }));

  return placeDMs;
}
