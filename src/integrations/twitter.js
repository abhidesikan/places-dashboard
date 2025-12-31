/**
 * Twitter API integration for fetching bookmarks
 * Uses Twitter API v2
 */

import axios from 'axios';
import config from '../config/index.js';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Fetch user's bookmarks from Twitter
 * Note: Bookmarks endpoint requires OAuth 2.0 User Context
 */
export async function getBookmarks(maxResults = 100) {
  try {
    const response = await axios.get(`${TWITTER_API_BASE}/users/:id/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${config.twitter.bearerToken}`,
      },
      params: {
        'tweet.fields': 'created_at,author_id,entities,geo',
        'expansions': 'author_id,geo.place_id',
        'place.fields': 'full_name,geo,name,place_type',
        'max_results': maxResults,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Twitter authentication failed. Check your bearer token.');
    }
    throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  }
}

/**
 * Check if a tweet is place-related using keyword matching and patterns
 */
export function isPlaceRelated(tweet) {
  const text = tweet.text.toLowerCase();

  // Place-related keywords
  const placeKeywords = [
    // Locations
    'temple', 'church', 'mosque', 'shrine', 'cathedral', 'monastery',
    'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'bistro', 'eatery',
    'museum', 'gallery', 'library', 'theater', 'theatre',
    'park', 'garden', 'beach', 'lake', 'mountain', 'hill',
    'hotel', 'resort', 'hostel', 'lodge',
    'fort', 'palace', 'castle', 'monument', 'memorial',
    'market', 'bazaar', 'mall', 'shop',

    // Actions indicating places
    'visited', 'visit', 'visiting', 'traveled', 'travelling',
    'ate at', 'dinner at', 'lunch at', 'breakfast at',
    'stayed at', 'staying at',
    'must visit', 'must see', 'check out',
    'recommendation', 'recommend',

    // Location indicators
    'in ', 'at ', 'near ', 'around ',
    'location:', 'address:',
    'opens at', 'timings',
  ];

  // Check for place keywords
  const hasPlaceKeyword = placeKeywords.some(keyword => text.includes(keyword));

  // Check for geo-tagged tweets
  const hasGeoTag = tweet.geo && tweet.geo.place_id;

  // Check for URLs that might be Google Maps, Zomato, etc.
  const placeUrls = ['maps.google.com', 'goo.gl/maps', 'zomato.com', 'swiggy.com',
                     'tripadvisor.com', 'yelp.com', 'foursquare.com'];
  const hasPlaceUrl = tweet.entities?.urls?.some(urlObj =>
    placeUrls.some(domain => urlObj.expanded_url?.includes(domain))
  );

  // Check for address-like patterns (Street, City, State or coordinates)
  const hasAddressPattern = /\d+\s+\w+\s+(street|road|rd|st|avenue|ave|lane|ln)/i.test(text) ||
                           /\d+°\s*\d+[′']\s*\d+[″"]?\s*[NS],?\s*\d+°\s*\d+[′']\s*\d+[″"]?\s*[EW]/i.test(text);

  return hasPlaceKeyword || hasGeoTag || hasPlaceUrl || hasAddressPattern;
}

/**
 * Extract place information from a tweet
 */
export function extractPlaceFromTweet(tweet, bookmarksData) {
  const text = tweet.text;

  // Try to extract place name (text before first newline or emoji)
  const firstLine = text.split('\n')[0];

  // Check for quoted or titled places
  const quotedMatch = firstLine.match(/["""']([^"""']+)["""']/);
  const titleMatch = firstLine.match(/^([A-Z][^.!?\n]+)/);

  let name = quotedMatch?.[1] || titleMatch?.[1] || firstLine.substring(0, 100);

  // Clean up common prefixes
  name = name.replace(/^(at|in|visited|check out|must visit)\s+/i, '').trim();

  // Extract location from geo data if available
  let location = null;
  if (tweet.geo?.place_id && bookmarksData?.includes?.places) {
    const place = bookmarksData.includes.places.find(p => p.id === tweet.geo.place_id);
    if (place) {
      location = place.full_name;
    }
  }

  // Extract URLs (especially Google Maps)
  let urls = [];
  if (tweet.entities?.urls) {
    urls = tweet.entities.urls.map(u => u.expanded_url);
  }

  // Find Google Maps URL
  const mapsUrl = urls.find(url =>
    url.includes('maps.google.com') ||
    url.includes('goo.gl/maps') ||
    url.includes('maps.app.goo.gl')
  );

  return {
    name,
    location,
    url: mapsUrl || urls[0],
    tweetUrl: `https://twitter.com/i/web/status/${tweet.id}`,
    tweetText: text,
    createdAt: tweet.created_at,
  };
}

/**
 * Filter bookmarks for place-related tweets
 */
export function filterPlaceBookmarks(bookmarksData) {
  if (!bookmarksData?.data) {
    return [];
  }

  const placeBookmarks = bookmarksData.data
    .filter(tweet => isPlaceRelated(tweet))
    .map(tweet => ({
      ...extractPlaceFromTweet(tweet, bookmarksData),
      tweet,
    }));

  return placeBookmarks;
}
