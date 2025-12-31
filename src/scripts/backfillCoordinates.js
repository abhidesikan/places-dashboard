import { getAllPlaces, extractProperties, updatePlace } from '../integrations/notion.js';
import { searchPlace } from '../integrations/googleMaps.js';

async function backfillCoordinates() {
  console.log('🔄 Backfilling Missing Coordinates\n');

  const allPlaces = await getAllPlaces();
  const placesWithoutCoords = allPlaces.filter(page => {
    const props = extractProperties(page);
    return !props.place || !props.place.lat || !props.place.lon;
  });

  console.log(`Found ${placesWithoutCoords.length} place(s) without coordinates\n`);

  if (placesWithoutCoords.length === 0) {
    console.log('✅ All places already have coordinates!');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const page of placesWithoutCoords) {
    const props = extractProperties(page);
    console.log(`🔍 Looking up: ${props.name}`);

    try {
      const placeInfo = await searchPlace(props.name);

      if (placeInfo && placeInfo.lat && placeInfo.lon) {
        console.log(`   ✅ Found coordinates: ${placeInfo.lat}, ${placeInfo.lon}`);

        await updatePlace(page.id, {
          place: {
            lat: placeInfo.lat,
            lon: placeInfo.lon,
            name: placeInfo.name || props.name,
            address: placeInfo.address || '',
          },
        });

        // Also update URL if missing
        if (!props.url && placeInfo.url) {
          await updatePlace(page.id, {
            url: placeInfo.url,
          });
        }

        console.log(`   ✅ Updated successfully\n`);
        updated++;
      } else {
        console.log(`   ❌ Could not find on Google Maps\n`);
        failed++;
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\n✨ Done! Check your Notion map view.`);
}

backfillCoordinates().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
