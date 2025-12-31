import { getAllPlaces, createPlace, updatePlace, extractProperties } from '../integrations/notion.js';

/**
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0;

  // Levenshtein distance
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);

  return 1 - distance / maxLen;
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Find potential duplicate places
 * Returns array of matches with similarity scores
 */
export async function findDuplicates(newPlace) {
  const allPlaces = await getAllPlaces();
  const matches = [];

  for (const existingPage of allPlaces) {
    const existing = extractProperties(existingPage);
    let score = 0;
    let reasons = [];

    // Compare names (high weight)
    const nameSimilarity = stringSimilarity(newPlace.name, existing.name);
    if (nameSimilarity > 0.7) {
      score += nameSimilarity * 50;
      reasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(0)}%`);
    }

    // Compare URLs (exact match is very strong signal)
    if (newPlace.url && existing.url && newPlace.url === existing.url) {
      score += 40;
      reasons.push('Exact URL match');
    }

    // Compare locations (if both have coordinates)
    if (newPlace.place?.lat && newPlace.place?.lon &&
        existing.place?.lat && existing.place?.lon) {
      const distance = getDistance(
        newPlace.place.lat, newPlace.place.lon,
        existing.place.lat, existing.place.lon
      );

      if (distance < 0.1) { // Within 100 meters
        score += 30;
        reasons.push(`Same location (${distance.toFixed(0)}m apart)`);
      } else if (distance < 1) { // Within 1 km
        score += 15;
        reasons.push(`Nearby (${distance.toFixed(1)}km apart)`);
      }
    }

    // Compare addresses
    if (newPlace.place?.address && existing.place?.address) {
      const addressSimilarity = stringSimilarity(
        newPlace.place.address,
        existing.place.address
      );
      if (addressSimilarity > 0.7) {
        score += addressSimilarity * 20;
        reasons.push(`Address similarity: ${(addressSimilarity * 100).toFixed(0)}%`);
      }
    }

    // If score is above threshold, add to matches
    if (score >= 50) {
      matches.push({
        page: existingPage,
        properties: existing,
        score: Math.min(score, 100),
        reasons,
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Add or update a place, handling deduplication
 * Options:
 * - force: Skip duplicate check and create new place
 * - merge: Merge with existing place if duplicate found
 * - skip: Skip if duplicate found
 */
export async function addOrUpdatePlace(placeData, options = {}) {
  const { force = false, merge = true, skip = false } = options;

  // Skip duplicate check if force is true
  if (force) {
    const newPlace = await createPlace(placeData);
    return {
      action: 'created',
      place: newPlace,
      message: 'Created new place (forced)',
    };
  }

  // Find potential duplicates
  const duplicates = await findDuplicates(placeData);

  if (duplicates.length === 0) {
    // No duplicates, create new place
    const newPlace = await createPlace(placeData);
    return {
      action: 'created',
      place: newPlace,
      message: 'Created new place',
    };
  }

  // Found potential duplicate(s)
  const bestMatch = duplicates[0];

  if (skip) {
    return {
      action: 'skipped',
      duplicate: bestMatch,
      message: `Skipped - duplicate found (${bestMatch.score.toFixed(0)}% match)`,
    };
  }

  if (merge) {
    // Merge sources
    const existingSources = bestMatch.properties.sources || [];
    const newSources = placeData.sources || [];
    const mergedSources = [...new Set([...existingSources, ...newSources])];

    // Prepare updates
    const updates = {
      sources: mergedSources,
    };

    // Update URL if not present
    if (placeData.url && !bestMatch.properties.url) {
      updates.url = placeData.url;
    }

    // Update location if not present
    if (placeData.place && !bestMatch.properties.place) {
      updates.place = placeData.place;
    }

    // Update category if not present
    if (placeData.category && !bestMatch.properties.category) {
      updates.category = placeData.category;
    }

    // Update the existing place
    const updatedPlace = await updatePlace(bestMatch.page.id, updates);

    return {
      action: 'merged',
      place: updatedPlace,
      duplicate: bestMatch,
      message: `Merged with existing place (${bestMatch.score.toFixed(0)}% match)`,
    };
  }

  // Default: return duplicate info for manual decision
  return {
    action: 'duplicate_found',
    duplicates,
    message: `Found ${duplicates.length} potential duplicate(s)`,
  };
}

/**
 * Batch import places with deduplication
 */
export async function batchImportPlaces(places, options = {}) {
  const results = {
    created: [],
    merged: [],
    skipped: [],
    errors: [],
  };

  for (const placeData of places) {
    try {
      const result = await addOrUpdatePlace(placeData, options);

      if (result.action === 'created') {
        results.created.push(result);
      } else if (result.action === 'merged') {
        results.merged.push(result);
      } else if (result.action === 'skipped') {
        results.skipped.push(result);
      }
    } catch (error) {
      results.errors.push({
        place: placeData,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get summary statistics
 */
export async function getPlaceStats() {
  const allPlaces = await getAllPlaces();
  const stats = {
    total: allPlaces.length,
    byCategory: {},
    byStatus: {},
    bySource: {},
  };

  for (const page of allPlaces) {
    const props = extractProperties(page);

    // Count by category
    if (props.category) {
      stats.byCategory[props.category] = (stats.byCategory[props.category] || 0) + 1;
    }

    // Count by status
    if (props.status) {
      stats.byStatus[props.status] = (stats.byStatus[props.status] || 0) + 1;
    }

    // Count by sources
    for (const source of props.sources || []) {
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    }
  }

  return stats;
}
