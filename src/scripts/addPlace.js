import inquirer from 'inquirer';
import { addOrUpdatePlace } from '../services/places.js';
import { parseGoogleMapsUrl, searchPlace, getCategoryFromTypes } from '../integrations/googleMaps.js';
import { enhanceTempleMetadata } from '../utils/templeClassifier.js';
import { extractCity, extractCountry } from '../utils/addressParser.js';

async function addPlace() {
  console.log('📍 Add a New Place\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Place name:',
      validate: (input) => input.trim() !== '' || 'Name is required',
    },
    {
      type: 'list',
      name: 'source',
      message: 'Source:',
      choices: ['Manual', 'Twitter', 'Instapaper', 'Google Maps', 'Notes'],
      default: 'Manual',
    },
    {
      type: 'list',
      name: 'status',
      message: 'Status:',
      choices: ['Want to go', 'Visited', 'Maybe'],
      default: 'Want to go',
    },
    {
      type: 'input',
      name: 'notes',
      message: 'Notes (optional, press enter to skip):',
    },
  ]);

  // Build place data
  const placeData = {
    name: answers.name.trim(),
    sources: [answers.source],
    status: answers.status,
  };

  let placeInfo = null;
  let suggestedCategory = null;

  // Automatically search for the place on Google Maps
  console.log('\n🌍 Looking up place on Google Maps...');

  placeInfo = await searchPlace(placeData.name);

  if (placeInfo) {
    console.log(`✅ Found: ${placeInfo.name}`);
    console.log(`   Address: ${placeInfo.address}`);
    console.log(`   Coordinates: ${placeInfo.lat}, ${placeInfo.lon}`);

    // Suggest category based on Google place types
    suggestedCategory = getCategoryFromTypes(placeInfo.types);

    // Store the Google Maps URL
    placeData.url = placeInfo.url;
    console.log(`   URL: ${placeInfo.url}`);
  } else {
    console.log('ℹ️  Could not find place on Google Maps (add API key to .env for auto-lookup)');
  }

  // Step 3: Ask for category (with suggestion if available)
  const categoryChoices = [
    'Restaurant',
    'Cafe',
    'Bar',
    'Temple',
    'Museum',
    'Park',
    'Hotel',
    'Shop',
    'Other',
  ];

  const categoryAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: suggestedCategory
        ? `Category (suggested: ${suggestedCategory}):`
        : 'Category:',
      choices: categoryChoices,
      default: suggestedCategory || 'Other',
    },
  ]);

  placeData.category = categoryAnswer.category;

  // Step 4: Add place info if we got it
  if (placeInfo && placeInfo.lat && placeInfo.lon) {
    placeData.place = {
      lat: placeInfo.lat,
      lon: placeInfo.lon,
      name: placeInfo.name || placeData.name,
      address: placeInfo.address || '',
    };

    // Extract city and country from address
    if (placeInfo.address) {
      const city = extractCity(placeInfo.address);
      const country = extractCountry(placeInfo.address);

      if (city) {
        placeData.city = city;
        console.log(`   City: ${city}`);
      }
      if (country) {
        placeData.country = country;
        console.log(`   Country: ${country}`);
      }
    }
  }

  if (answers.notes && answers.notes.trim()) {
    placeData.notes = answers.notes.trim();
  }

  // Enhance with temple classification if it's a temple
  if (placeData.category === 'Temple') {
    const enhanced = enhanceTempleMetadata(placeData);
    if (enhanced.templeTypes && enhanced.templeTypes.length > 0) {
      console.log(`\n🏛️  Detected temple types: ${enhanced.templeTypes.join(', ')}`);
      placeData.templeTypes = enhanced.templeTypes;
    }
    if (enhanced.deity) {
      console.log(`   Deity: ${enhanced.deity}`);
    }
  }

  console.log('\n🔍 Checking for duplicates...');

  try {
    const result = await addOrUpdatePlace(placeData, { merge: true });

    console.log();
    if (result.action === 'created') {
      console.log('✅ Place created successfully!');
    } else if (result.action === 'merged') {
      console.log('✅ Merged with existing place!');
      console.log(`   Match score: ${result.duplicate.score.toFixed(0)}%`);
      console.log(`   Reasons: ${result.duplicate.reasons.join(', ')}`);
    }

    console.log(`\n📊 ${result.message}`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

addPlace();
