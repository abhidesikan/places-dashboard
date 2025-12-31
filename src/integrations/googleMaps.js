import axios from 'axios';
import config, { validateConfig } from '../config/index.js';
import { extractCity, extractCountry } from '../utils/addressParser.js';

/**
 * Parse Google Maps URL to extract place information
 * Supports:
 * - https://maps.app.goo.gl/... (short links)
 * - https://www.google.com/maps/place/...
 * - https://goo.gl/maps/...
 */
export async function parseGoogleMapsUrl(url) {
  try {
    // Follow redirects to get the full URL
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const finalUrl = response.request?.res?.responseUrl || url;

    // Extract coordinates from URL
    // Pattern: /@latitude,longitude,zoom or /place/name/@latitude,longitude
    const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);

      // Try to extract place name from URL
      const nameMatch = finalUrl.match(/\/place\/([^/@]+)/);
      let name = null;
      if (nameMatch) {
        name = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
      }

      return {
        lat,
        lon,
        name,
        url: finalUrl,
      };
    }

    // If no coordinates found, try to extract place ID
    const placeIdMatch = finalUrl.match(/place\/([^/@]+)/);
    if (placeIdMatch) {
      const placeId = placeIdMatch[1];
      // We'll need to use Google Places API to get coordinates
      return {
        placeId,
        url: finalUrl,
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error.message);
    return null;
  }
}

/**
 * Search for a place using Google Places API (Text Search)
 * Returns place details including coordinates and address
 */
export async function searchPlace(query) {
  // Check if API key is configured
  if (!config.googleMaps.apiKey) {
    console.warn('Google Maps API key not configured. Skipping geocoding.');
    return null;
  }

  try {
    // Use NEW Places API (Text Search)
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: query,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googleMaps.apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id,places.types,places.googleMapsUri',
        },
      }
    );

    if (response.data.places && response.data.places.length > 0) {
      const place = response.data.places[0];
      const address = place.formattedAddress || '';

      return {
        name: place.displayName?.text || query,
        lat: place.location?.latitude,
        lon: place.location?.longitude,
        address,
        city: extractCity(address),
        country: extractCountry(address),
        placeId: place.id,
        types: place.types || [],
        category: getCategoryFromTypes(place.types),
        url: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      };
    }

    return null;
  } catch (error) {
    if (error.response?.data?.error) {
      console.error('Google Places API error:', error.response.data.error.message);
      console.error('Status:', error.response.data.error.status);
    } else {
      console.error('Error searching place:', error.message);
    }
    return null;
  }
}

/**
 * Get place details by Place ID
 */
export async function getPlaceDetails(placeId) {
  if (!config.googleMaps.apiKey) {
    console.warn('Google Maps API key not configured. Skipping place details.');
    return null;
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,place_id,types,url',
          key: config.googleMaps.apiKey,
        },
      }
    );

    if (response.data.status === 'OK') {
      const place = response.data.result;

      return {
        name: place.name,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        address: place.formatted_address,
        placeId: place.place_id,
        types: place.types,
        url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting place details:', error.message);
    return null;
  }
}

/**
 * Determine category from Google Place types
 */
export function getCategoryFromTypes(types) {
  if (!types || types.length === 0) return null;

  const typeMap = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    bar: 'Bar',
    night_club: 'Bar',
    museum: 'Museum',
    art_gallery: 'Museum',
    park: 'Park',
    tourist_attraction: 'Tourist Attraction',
    place_of_worship: 'Temple',
    hindu_temple: 'Temple',
    church: 'Temple',
    mosque: 'Temple',
    synagogue: 'Temple',
    lodging: 'Hotel',
    shopping_mall: 'Shop',
    store: 'Shop',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return null;
}
