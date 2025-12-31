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

  // Remove postal codes first
  let cleaned = formattedAddress.replace(/\d{5,6}/g, '');

  // Split by comma
  const parts = cleaned.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length === 0) return null;

  // Heuristic: City is usually before the state
  // Format: "Street, City, State, Country"
  // or: "Temple Name, City, State, Country"

  if (parts.length >= 3) {
    // Second-to-last or third-to-last is likely the city
    // Last is usually country, second-to-last is state
    const stateIndex = parts.length - 2;
    const cityIndex = stateIndex - 1;

    if (cityIndex >= 0) {
      return parts[cityIndex];
    }
  }

  if (parts.length === 2) {
    // Format: "City, State/Country"
    return parts[0];
  }

  return parts[0];
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
