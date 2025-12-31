/**
 * Import places from a plain text file
 * Supports flexible formats:
 * - Simple place names (one per line)
 * - Place names with locations (comma-separated)
 * - Google Maps URLs
 * - Mixed formats
 */

import fs from 'fs/promises';
import { validateConfig } from '../config/index.js';
import { searchPlace } from '../integrations/googleMaps.js';
import { addOrUpdatePlace } from '../services/places.js';
import inquirer from 'inquirer';

async function importFromText(filePath) {
  console.log('📄 Importing places from text file\n');

  // Validate required config
  try {
    validateConfig(['notion.apiKey', 'notion.databaseId']);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  try {
    // Read file
    console.log(`📖 Reading file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse lines - split by newline, filter empty lines and comments
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

    console.log(`Found ${lines.length} entries\n`);

    if (lines.length === 0) {
      console.log('No places found in file.');
      return;
    }

    // Parse each line
    const places = lines.map(line => parseLine(line)).filter(p => p !== null);

    console.log(`Parsed ${places.length} valid places\n`);

    // Show preview
    console.log('Preview (first 10):');
    places.slice(0, 10).forEach((place, i) => {
      console.log(`${i + 1}. ${place.name}`);
      if (place.location) console.log(`   📍 ${place.location}`);
      if (place.url) console.log(`   🔗 ${place.url}`);
    });

    if (places.length > 10) {
      console.log(`... and ${places.length - 10} more\n`);
    }

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Import these ${places.length} places to Notion?`,
        default: true,
      },
    ]);

    if (!proceed) {
      console.log('Cancelled.');
      return;
    }

    // Process each place
    let added = 0;
    let skipped = 0;
    let errors = 0;

    console.log('\n📝 Processing places...\n');

    for (const place of places) {
      try {
        console.log(`Processing: ${place.name}`);

        // Try to get details from Google Maps
        let placeDetails = null;
        const searchQuery = place.location || place.name;

        try {
          placeDetails = await searchPlace(searchQuery);
          if (placeDetails) {
            console.log(`  ✅ Found on Google Maps: ${placeDetails.address}`);
          }
        } catch (error) {
          console.log(`  ⚠️  Not found on Google Maps, using text data`);
        }

        // Prepare place data
        const placeData = {
          name: place.name,
          category: placeDetails?.category || 'Other',
          url: place.url || placeDetails?.url,
          sources: ['Text Import'],
          status: 'Want to Visit',
          notes: place.notes || `Imported from ${filePath}`,
        };

        // Add location data if available
        if (placeDetails) {
          placeData.place = {
            lat: placeDetails.lat,
            lon: placeDetails.lon,
            name: placeDetails.name,
            address: placeDetails.address,
          };
          placeData.city = placeDetails.city;
          placeData.country = placeDetails.country;
        }

        // Add to Notion with deduplication
        const result = await addOrUpdatePlace(placeData, {
          merge: true,
        });

        if (result.action === 'created') {
          console.log(`  ✅ Added to Notion`);
          added++;
        } else if (result.action === 'merged') {
          console.log(`  🔄 Merged with existing place`);
          added++;
        } else {
          console.log(`  ⏭️  Skipped (duplicate)`);
          skipped++;
        }

        console.log();

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errors++;
        console.log();
      }
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✨ Done! Your places have been imported to Notion.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Parse a single line from the text file
 * Supports various formats:
 * - "Temple Name"
 * - "Temple Name, City"
 * - "Temple Name - City, State"
 * - "https://maps.google.com/..."
 * - "Temple Name https://maps.google.com/..."
 */
function parseLine(line) {
  // Check if line contains a URL
  const urlRegex = /https?:\/\/[^\s]+/;
  const urlMatch = line.match(urlRegex);

  let url = null;
  let text = line;

  if (urlMatch) {
    url = urlMatch[0];
    // Remove URL from text
    text = line.replace(urlRegex, '').trim();
  }

  // If line is only a URL, extract place name from it
  if (!text && url) {
    const nameMatch = url.match(/\/place\/([^/@]+)/);
    if (nameMatch) {
      text = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
    }
  }

  if (!text) {
    return null;
  }

  // Try to extract location info
  // Format: "Name, Location" or "Name - Location"
  let name = text;
  let location = null;
  let notes = null;

  // Check for " - " separator
  if (text.includes(' - ')) {
    const parts = text.split(' - ');
    name = parts[0].trim();
    location = parts.slice(1).join(' - ').trim();
  }
  // Check for "," separator (but not if it looks like a complete address)
  else if (text.includes(',') && text.split(',').length === 2) {
    const parts = text.split(',');
    name = parts[0].trim();
    location = parts[1].trim();
  }

  // Clean up name
  name = name.replace(/^[-•*]\s*/, '').trim(); // Remove bullet points
  name = name.replace(/^\d+\.\s*/, '').trim(); // Remove numbering

  return {
    name,
    location,
    url,
    notes: notes,
  };
}

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npm run import:text <file-path>');
  console.error('Example: npm run import:text places.txt');
  process.exit(1);
}

importFromText(filePath).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
