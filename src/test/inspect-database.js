import { getAllPlaces, extractProperties } from '../integrations/notion.js';

async function inspect() {
  try {
    const places = await getAllPlaces();
    console.log('📊 Database Inspection\n');
    console.log(`Total places: ${places.length}\n`);

    if (places.length > 0) {
      console.log('=== First Place - Full Structure ===\n');
      console.log(JSON.stringify(places[0], null, 2));

      console.log('\n\n=== Extracted Properties ===\n');
      const extracted = extractProperties(places[0]);
      console.log(JSON.stringify(extracted, null, 2));

      console.log('\n\n=== All Properties in Database ===\n');
      const propertyNames = Object.keys(places[0].properties);
      propertyNames.forEach(name => {
        const prop = places[0].properties[name];
        console.log(`- ${name} (${prop.type})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspect();
