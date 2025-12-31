import inquirer from 'inquirer';
import { getAllPlaces, extractProperties } from '../integrations/notion.js';
import { getPlaceStats } from '../services/places.js';

async function viewPlaces() {
  console.log('📋 View Places\n');

  const filterChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'filter',
      message: 'What would you like to view?',
      choices: [
        { name: 'All places', value: 'all' },
        { name: 'Filter by category', value: 'category' },
        { name: 'Filter by status', value: 'status' },
        { name: 'Filter by source', value: 'source' },
        { name: 'Show statistics', value: 'stats' },
      ],
    },
  ]);

  if (filterChoice.filter === 'stats') {
    await showStats();
    return;
  }

  const allPlaces = await getAllPlaces();
  const places = allPlaces.map(extractProperties);

  let filtered = places;
  let filterDescription = 'All places';

  if (filterChoice.filter === 'category') {
    const categories = [...new Set(places.map(p => p.category).filter(Boolean))];
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select category:',
        choices: categories,
      },
    ]);
    filtered = places.filter(p => p.category === answer.category);
    filterDescription = `Category: ${answer.category}`;
  } else if (filterChoice.filter === 'status') {
    const statuses = [...new Set(places.map(p => p.status).filter(Boolean))];
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'status',
        message: 'Select status:',
        choices: statuses,
      },
    ]);
    filtered = places.filter(p => p.status === answer.status);
    filterDescription = `Status: ${answer.status}`;
  } else if (filterChoice.filter === 'source') {
    const allSources = new Set();
    places.forEach(p => p.sources.forEach(s => allSources.add(s)));
    const sources = [...allSources];

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Select source:',
        choices: sources,
      },
    ]);
    filtered = places.filter(p => p.sources.includes(answer.source));
    filterDescription = `Source: ${answer.source}`;
  }

  console.log(`\n📍 ${filterDescription} (${filtered.length} places)\n`);

  if (filtered.length === 0) {
    console.log('No places found.');
    return;
  }

  filtered.forEach((place, idx) => {
    console.log(`${idx + 1}. ${place.name}`);
    if (place.category) console.log(`   Category: ${place.category}`);
    if (place.status) console.log(`   Status: ${place.status}`);
    if (place.place?.address) console.log(`   Address: ${place.place.address}`);
    if (place.sources.length > 0) console.log(`   Sources: ${place.sources.join(', ')}`);
    if (place.url) console.log(`   URL: ${place.url}`);
    console.log();
  });

  console.log(`Total: ${filtered.length} place(s)`);
}

async function showStats() {
  console.log('\n📊 Database Statistics\n');

  const stats = await getPlaceStats();

  console.log(`Total places: ${stats.total}\n`);

  if (Object.keys(stats.byCategory).length > 0) {
    console.log('By Category:');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
    console.log();
  }

  if (Object.keys(stats.byStatus).length > 0) {
    console.log('By Status:');
    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    console.log();
  }

  if (Object.keys(stats.bySource).length > 0) {
    console.log('By Source:');
    Object.entries(stats.bySource)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    console.log();
  }
}

viewPlaces().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
