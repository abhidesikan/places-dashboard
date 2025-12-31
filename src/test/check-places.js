import { getAllPlaces, extractProperties } from '../integrations/notion.js';

async function checkPlaces() {
  const places = await getAllPlaces();
  console.log(`📍 Found ${places.length} place(s) in Notion\n`);

  places.forEach((page, idx) => {
    const props = extractProperties(page);
    console.log(`${idx + 1}. ${props.name}`);
    console.log(`   Category: ${props.category || 'N/A'}`);
    console.log(`   Status: ${props.status || 'N/A'}`);

    if (props.place) {
      console.log(`   ✅ Place field populated:`);
      console.log(`      Coordinates: ${props.place.lat}, ${props.place.lon}`);
      console.log(`      Address: ${props.place.address || 'N/A'}`);
    } else {
      console.log(`   ❌ Place field NOT populated (no coordinates)`);
    }

    if (props.url) {
      console.log(`   URL: ${props.url}`);
    }

    if (props.sources.length > 0) {
      console.log(`   Sources: ${props.sources.join(', ')}`);
    }

    if (props.templeTypes && props.templeTypes.length > 0) {
      console.log(`   🏛️  Temple Types: ${props.templeTypes.join(', ')}`);
    }

    console.log();
  });
}

checkPlaces();
