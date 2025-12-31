import inquirer from 'inquirer';
import { addOrUpdatePlace } from '../services/places.js';
import { parseGoogleMapsUrl, searchPlace, getCategoryFromTypes } from '../integrations/googleMaps.js';

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
      type: 'input',
      name: 'url',
      message: 'Google Maps URL (optional, press enter to skip):',
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

  // Step 1: If URL provided, parse it to get coordinates
  if (answers.url && answers.url.trim()) {
    const url = answers.url.trim();
    console.log('\n🔍 Parsing Google Maps URL...');

    placeInfo = await parseGoogleMapsUrl(url);

    if (placeInfo) {
      console.log(`✅ Found: ${placeInfo.name || 'Location'}`);
      if (placeInfo.lat && placeInfo.lon) {
        console.log(`   Coordinates: ${placeInfo.lat}, ${placeInfo.lon}`);
      }
      placeData.url = url;
    } else {
      console.log('⚠️  Could not parse URL, storing as-is');
      placeData.url = url;
    }
  }

  // Step 2: If no coordinates yet, search Google Places API
  if (!placeInfo || !placeInfo.lat) {
    console.log('\n🌍 Looking up place on Google Maps...');

    placeInfo = await searchPlace(placeData.name);

    if (placeInfo) {
      console.log(`✅ Found: ${placeInfo.name}`);
      console.log(`   Address: ${placeInfo.address}`);
      console.log(`   Coordinates: ${placeInfo.lat}, ${placeInfo.lon}`);

      // Suggest category based on Google place types
      suggestedCategory = getCategoryFromTypes(placeInfo.types);

      if (!placeData.url) {
        placeData.url = placeInfo.url;
        console.log(`   URL: ${placeInfo.url}`);
      }
    } else {
      console.log('ℹ️  Could not find place on Google Maps (no API key or not found)');
    }
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
  }

  if (answers.notes && answers.notes.trim()) {
    placeData.notes = answers.notes.trim();
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
