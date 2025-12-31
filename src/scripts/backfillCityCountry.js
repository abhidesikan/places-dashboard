import { getAllPlaces, extractProperties, updatePlace } from '../integrations/notion.js';
import { extractCity, extractCountry } from '../utils/addressParser.js';

async function backfillCityCountry() {
  console.log('🌍 Backfilling City & Country Fields\n');

  const allPlaces = await getAllPlaces();
  const placesWithAddress = allPlaces.filter(page => {
    const props = extractProperties(page);
    return props.place?.address && (!props.city || !props.country);
  });

  console.log(`Found ${placesWithAddress.length} place(s) with addresses but missing city/country\n`);

  if (placesWithAddress.length === 0) {
    console.log('✅ All places already have city & country!');
    return;
  }

  let updated = 0;

  for (const page of placesWithAddress) {
    const props = extractProperties(page);
    const address = props.place.address;

    console.log(`📍 ${props.name}`);
    console.log(`   Address: ${address}`);

    const city = extractCity(address);
    const country = extractCountry(address);

    const updates = {};

    if (city && !props.city) {
      updates.city = city;
      console.log(`   ✅ City: ${city}`);
    }

    if (country && !props.country) {
      updates.country = country;
      console.log(`   ✅ Country: ${country}`);
    }

    if (Object.keys(updates).length > 0) {
      await updatePlace(page.id, updates);
      updated++;
    }

    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`\n✨ Done! You can now filter/group by city in Notion.`);
}

backfillCityCountry().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
