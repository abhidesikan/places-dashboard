import { findDuplicates, addOrUpdatePlace, getPlaceStats } from '../services/places.js';

async function testDeduplication() {
  console.log('🧪 Testing Deduplication Service\n');

  // Test 1: Find duplicates for a test place
  console.log('1️⃣  Testing duplicate detection...\n');

  const testPlace = {
    name: 'Brihadeeshwarar Temple',
    category: 'Temple',
    place: {
      lat: 10.78354,
      lon: 79.13361,
      name: 'Brihadeeswara Temple',
      address: 'Brihadeeswara Temple, Thanjavur, India',
    },
    url: 'https://maps.app.goo.gl/test',
    sources: ['Google Maps'],
  };

  const duplicates = await findDuplicates(testPlace);

  if (duplicates.length > 0) {
    console.log(`✅ Found ${duplicates.length} potential duplicate(s):\n`);
    duplicates.forEach((dup, idx) => {
      console.log(`   Match ${idx + 1}:`);
      console.log(`   - Name: ${dup.properties.name}`);
      console.log(`   - Score: ${dup.score.toFixed(0)}%`);
      console.log(`   - Reasons: ${dup.reasons.join(', ')}`);
      console.log();
    });
  } else {
    console.log('✅ No duplicates found\n');
  }

  // Test 2: Show stats
  console.log('2️⃣  Database statistics...\n');
  const stats = await getPlaceStats();

  console.log(`   Total places: ${stats.total}`);
  console.log();

  if (Object.keys(stats.byCategory).length > 0) {
    console.log('   By Category:');
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count}`);
    });
    console.log();
  }

  if (Object.keys(stats.byStatus).length > 0) {
    console.log('   By Status:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log();
  }

  if (Object.keys(stats.bySource).length > 0) {
    console.log('   By Source:');
    Object.entries(stats.bySource).forEach(([source, count]) => {
      console.log(`   - ${source}: ${count}`);
    });
    console.log();
  }

  // Test 3: Add or update (dry run - merge mode)
  console.log('3️⃣  Testing add/merge logic...\n');

  const newPlace = {
    name: 'Brihadeeshwarar Temple',
    category: 'Temple',
    sources: ['Twitter'],
    url: 'https://maps.app.goo.gl/yH19nhfRL2gxTNs28',
  };

  console.log('   Attempting to add place with merge=true...');
  console.log(`   Place: ${newPlace.name}`);
  console.log(`   Source: ${newPlace.sources.join(', ')}`);
  console.log();

  const result = await addOrUpdatePlace(newPlace, { merge: true });

  console.log(`   ✅ Result: ${result.action}`);
  console.log(`   Message: ${result.message}`);

  if (result.action === 'merged') {
    const merged = result.place.properties.Source.multi_select.map(s => s.name);
    console.log(`   Updated sources: ${merged.join(', ')}`);
  }

  console.log('\n✨ All tests completed!');
}

testDeduplication().catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error(error);
  process.exit(1);
});
