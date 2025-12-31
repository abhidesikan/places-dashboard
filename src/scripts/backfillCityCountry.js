import { getAllPlaces, extractProperties, updatePlace } from '../integrations/notion.js';
import { extractCity, extractCountry } from '../utils/addressParser.js';

async function backfillCityCountry() {
  console.log('🌍 Backfilling City & Country Fields\n');

  const allPlaces = await getAllPlaces();
  const placesWithAddress = allPlaces.filter(page => {
    const props = extractProperties(page);
    // Include places with addresses that either:
    // 1. Don't have city/country
    // 2. Have city/country but might need updating (we'll check inside the loop)
    return props.place?.address;
  });

  console.log(`Found ${placesWithAddress.length} place(s) with addresses\n`);

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

    // Update city if missing OR if it's different from current value
    if (city && city !== props.city) {
      updates.city = city;
      if (props.city) {
        console.log(`   🔄 City: ${props.city} → ${city}`);
      } else {
        console.log(`   ✅ City: ${city}`);
      }
    }

    // Update country if missing OR if it's different from current value
    if (country && country !== props.country) {
      updates.country = country;
      if (props.country) {
        console.log(`   🔄 Country: ${props.country} → ${country}`);
      } else {
        console.log(`   ✅ Country: ${country}`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await updatePlace(page.id, updates);
      updated++;
    } else {
      console.log(`   ℹ️  Already correct`);
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
