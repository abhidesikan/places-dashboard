import inquirer from 'inquirer';
import { addOrUpdatePlace } from '../services/places.js';

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
      name: 'category',
      message: 'Category:',
      choices: [
        'Restaurant',
        'Cafe',
        'Bar',
        'Temple',
        'Museum',
        'Park',
        'Hotel',
        'Shop',
        'Other',
      ],
    },
    {
      type: 'input',
      name: 'url',
      message: 'URL (optional, press enter to skip):',
    },
    {
      type: 'input',
      name: 'address',
      message: 'Address (optional, press enter to skip):',
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
    category: answers.category,
    sources: [answers.source],
    status: answers.status,
  };

  if (answers.url && answers.url.trim()) {
    placeData.url = answers.url.trim();
  }

  if (answers.address && answers.address.trim()) {
    // For now, just store address without coordinates
    // Later we can add geocoding to get lat/lon
    placeData.place = {
      address: answers.address.trim(),
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
