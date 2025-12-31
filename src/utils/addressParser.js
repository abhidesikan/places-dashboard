/**
 * Parse address components from Google Maps formatted address
 */

/**
 * Extract city from formatted address
 * Examples:
 * "Shringeri, Karnataka, India" → "Shringeri"
 * "Hampi, Karnataka 583239, India" → "Hampi"
 * "Brihadeeswara Temple, Thanjavur 613001, India" → "Thanjavur"
 */
export function extractCity(formattedAddress) {
  if (!formattedAddress) return null;

  // Split by comma first (preserve original parts)
  const parts = formattedAddress.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length === 0) return null;

  // Heuristic: City is usually before the state
  // Common formats in India:
  // "Temple Name, Neighborhood, City Postal, State, Country"
  // "Plus Code, City, State Postal, Country"
  // "Street, City, State, Country"

  if (parts.length >= 3) {
    // Find the rightmost (closest to country) part that contains a postal code
    // This is likely to be the city (sometimes it's attached to state, but city is more common)
    // Common patterns:
    // "Temple, Neighborhood, City Postal, Country" (no state) → City Postal is second-to-last
    // "Code, City, State Postal, Country" → State Postal is second-to-last, City is before it

    let cityWithPostal = null;
    let cityIndex = -1;

    // Search from right to left (skip the last part which is country)
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      const postalMatch = part.match(/^(.+?)\s*\d{5,6}\s*$/);
      if (postalMatch && !cityWithPostal) {
        // Found the rightmost part with postal code
        cityWithPostal = postalMatch[1].trim();
        cityIndex = i;
        break;
      }
    }

    if (cityWithPostal) {
      // Check if this might be a state (has another city-like part before it)
      // Indian state names are often longer and recognizable
      const commonStates = ['karnataka', 'tamil nadu', 'andhra pradesh', 'madhya pradesh',
                           'uttar pradesh', 'kerala', 'maharashtra', 'rajasthan', 'gujarat'];
      const isLikelyState = commonStates.some(state =>
        cityWithPostal.toLowerCase().includes(state)
      );

      if (isLikelyState && cityIndex > 0) {
        // This is likely a state, use the part before it as city
        return parts[cityIndex - 1].replace(/\d{5,6}/g, '').trim();
      } else {
        // This is likely the city
        return cityWithPostal;
      }
    }

    // No postal code found, use third-to-last as city
    const cityIndex2 = parts.length - 3;
    if (cityIndex2 >= 0) {
      return parts[cityIndex2].replace(/\d{5,6}/g, '').trim();
    }
  }

  if (parts.length === 2) {
    // Format: "City, State/Country"
    // Remove postal codes
    return parts[0].replace(/\d{5,6}/g, '').trim();
  }

  // Single part - just remove postal codes
  return parts[0].replace(/\d{5,6}/g, '').trim();
}

/**
 * Extract state from formatted address
 */
export function extractState(formattedAddress) {
  if (!formattedAddress) return null;

  const parts = formattedAddress.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length >= 2) {
    // Second to last is usually the state (before country)
    return parts[parts.length - 2].replace(/\d{5,6}/g, '').trim();
  }

  return null;
}

/**
 * Extract country from formatted address
 */
export function extractCountry(formattedAddress) {
  if (!formattedAddress) return null;

  const parts = formattedAddress.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length >= 1) {
    // Last part is usually the country
    return parts[parts.length - 1];
  }

  return null;
}
