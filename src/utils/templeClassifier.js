/**
 * Temple classification and tagging system
 * Automatically detects temple types based on name and metadata
 */

// Known temple classifications
const TEMPLE_CLASSIFICATIONS = {
  divyaDesam: {
    tag: 'Divya Desam',
    keywords: ['sri rangam', 'tirupati', 'tirumala', 'badrinath', 'dwarka', 'puri jagannath', 'kanchipuram', 'ayodhya'],
    temples: [
      'Srirangam', 'Tirupati', 'Tirumala', 'Badrinath', 'Dwarka', 'Puri',
      'Kanchipuram Varadaraja', 'Ayodhya', 'Thiruvananthapuram',
    ],
  },
  jyotirlinga: {
    tag: 'Jyotirlinga',
    exactMatch: true, // Require more precise matching
    temples: [
      'Somnath', 'Mallikarjuna', 'Mahakaleshwar', 'Omkareshwar', 'Kedarnath',
      'Bhimashankar', 'Kashi Vishwanath', 'Trimbakeshwar', 'Vaidyanath',
      'Nageshwar', 'Rameswaram', 'Rameshwar', 'Grishneshwar',
    ],
  },
  panchaBhoota: {
    tag: 'Pancha Bhoota',
    exactMatch: true,
    temples: [
      'Chidambaram Nataraja', // Akasha (Space)
      'Thiruvanaikaval', 'Jambukeswarar', // Appu (Water)
      'Tiruvannamalai', 'Annamalaiyar', // Agni (Fire)
      'Ekambareswarar', 'Ekambaranathar', // Prithvi (Earth)
      'Kalahasti', 'Srikalahasti', // Vayu (Air)
    ],
  },
  shaktiPeetham: {
    tag: 'Shakti Peetham',
    temples: [
      'Kamakhya', 'Kalighat', 'Vindhyavasini', 'Ambaji', 'Chamundeshwari',
      'Mookambika', 'Kanchi Kamakshi', 'Meenakshi',
    ],
  },
  abhimanaSthalam: {
    tag: 'Abhimana Sthalam',
    keywords: ['brihadeeswarar', 'brihadeeswara', 'thanjavur', 'gangaikonda'],
    temples: [
      'Brihadeeswarar', 'Brihadeeswara', 'Gangaikonda Cholapuram', 'Airavatesvara',
    ],
  },
  charDham: {
    tag: 'Char Dham',
    temples: ['Badrinath', 'Dwarka', 'Puri', 'Rameshwar', 'Rameswaram'],
  },
};

/**
 * Classify a temple and return applicable tags
 */
export function classifyTemple(templeName, address = '') {
  const tags = [];
  const nameLower = templeName.toLowerCase();
  const addressLower = address.toLowerCase();
  const combined = `${nameLower} ${addressLower}`;

  for (const [type, config] of Object.entries(TEMPLE_CLASSIFICATIONS)) {
    let matched = false;

    // Check against known temple names
    if (config.temples) {
      for (const temple of config.temples) {
        const templeLower = temple.toLowerCase();

        if (config.exactMatch) {
          // For exact match, temple name should contain the full keyword
          // But allow some flexibility (e.g., "Somnath Temple" matches "Somnath")
          const words = nameLower.split(/\s+/);
          if (words.some(word => word === templeLower || templeLower.includes(word) && word.length > 4)) {
            matched = true;
            break;
          }
        } else {
          // Regular substring matching
          if (nameLower.includes(templeLower)) {
            matched = true;
            break;
          }
        }
      }
    }

    // Check against keywords
    if (!matched && config.keywords) {
      for (const keyword of config.keywords) {
        if (combined.includes(keyword.toLowerCase())) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      tags.push(config.tag);
    }
  }

  return tags;
}

/**
 * Get deity information from temple name
 */
export function getDeity(templeName) {
  const nameLower = templeName.toLowerCase();

  const deityMap = {
    'Vishnu': ['rangam', 'venkatesh', 'tirupati', 'badrinath', 'jagannath', 'varadaraja'],
    'Shiva': ['shwar', 'ishwar', 'nataraja', 'kailash', 'somnath', 'mahakal', 'kedarnath'],
    'Devi': ['kamakshi', 'meenakshi', 'kamakhya', 'ambika', 'chamundi', 'durga', 'kali'],
    'Hanuman': ['hanuman', 'anjaneya'],
    'Ganesha': ['ganesha', 'ganapati', 'vinayaka'],
  };

  for (const [deity, keywords] of Object.entries(deityMap)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return deity;
      }
    }
  }

  return null;
}

/**
 * Enhance temple metadata with classifications
 */
export function enhanceTempleMetadata(placeData) {
  if (placeData.category !== 'Temple') {
    return placeData;
  }

  const templeTypes = classifyTemple(
    placeData.name,
    placeData.place?.address || ''
  );

  const deity = getDeity(placeData.name);

  return {
    ...placeData,
    templeTypes: templeTypes.length > 0 ? templeTypes : undefined,
    deity: deity || undefined,
  };
}
