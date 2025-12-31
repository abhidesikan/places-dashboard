import inquirer from 'inquirer';
import { format } from 'date-fns';
import { getAllPlaces, extractProperties, addVisit } from '../integrations/notion.js';

async function logVisit() {
  console.log('✈️ Log a Visit\n');

  // Get all places
  const allPlaces = await getAllPlaces();
  const places = allPlaces.map((page, idx) => {
    const props = extractProperties(page);
    return {
      name: `${props.name}${props.category ? ` (${props.category})` : ''}`,
      value: page.id,
      short: props.name,
    };
  });

  if (places.length === 0) {
    console.log('No places in database. Add some places first!');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'placeId',
      message: 'Which place did you visit?',
      choices: places,
      pageSize: 15,
    },
    {
      type: 'input',
      name: 'date',
      message: 'Visit date (YYYY-MM-DD, or press enter for today):',
      default: format(new Date(), 'yyyy-MM-dd'),
      validate: (input) => {
        if (!input) return true;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(input) || 'Please use YYYY-MM-DD format';
      },
    },
    {
      type: 'input',
      name: 'cost',
      message: 'Cost (optional, e.g., "$50" or "€30", press enter to skip):',
    },
    {
      type: 'input',
      name: 'notes',
      message: 'Notes about your visit (optional, press enter to skip):',
    },
    {
      type: 'input',
      name: 'photos',
      message: 'Photo URLs (comma-separated, optional, press enter to skip):',
    },
  ]);

  const visitData = {
    date: answers.date,
  };

  if (answers.cost && answers.cost.trim()) {
    visitData.cost = answers.cost.trim();
  }

  if (answers.notes && answers.notes.trim()) {
    visitData.notes = answers.notes.trim();
  }

  if (answers.photos && answers.photos.trim()) {
    visitData.photos = answers.photos
      .split(',')
      .map(url => url.trim())
      .filter(url => url);
  }

  console.log('\n📝 Logging visit...');

  try {
    await addVisit(answers.placeId, visitData);
    console.log('✅ Visit logged successfully!');
    console.log('   Status updated to "Visited"');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

logVisit();
