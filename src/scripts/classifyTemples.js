import { getAllPlaces, extractProperties, updatePlace } from '../integrations/notion.js';
import { enhanceTempleMetadata } from '../utils/templeClassifier.js';

async function classifyTemples() {
  console.log('🏛️  Classifying Temples\n');

  const allPlaces = await getAllPlaces();
  const temples = allPlaces.filter(page => {
    const props = extractProperties(page);
    return props.category === 'Temple';
  });

  console.log(`Found ${temples.length} temple(s)\n`);

  if (temples.length === 0) {
    console.log('No temples found in database.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const page of temples) {
    const props = extractProperties(page);
    console.log(`🔍 ${props.name}`);

    const enhanced = enhanceTempleMetadata({
      name: props.name,
      category: 'Temple',
      place: props.place,
    });

    if (enhanced.templeTypes && enhanced.templeTypes.length > 0) {
      console.log(`   ✅ Found: ${enhanced.templeTypes.join(', ')}`);

      // Check if already has these types
      const existingTypes = props.templeTypes || [];
      const newTypes = enhanced.templeTypes.filter(t => !existingTypes.includes(t));

      if (newTypes.length > 0) {
        const allTypes = [...new Set([...existingTypes, ...newTypes])];

        await updatePlace(page.id, {
          templeTypes: allTypes,
        });

        console.log(`   📝 Updated temple types`);
        updated++;
      } else {
        console.log(`   ⏭️  Already has these types`);
        skipped++;
      }
    } else {
      console.log(`   ℹ️  No classification found`);
      skipped++;
    }

    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n✨ Done!`);
}

classifyTemples().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
