import { parseGoogleMapsUrl, searchPlace, getCategoryFromTypes } from '../integrations/googleMaps.js';

async function testGoogleMaps() {
  console.log('🧪 Testing Google Maps Integration\n');

  // Test 1: Parse existing Google Maps URL
  console.log('1️⃣  Testing URL parsing...\n');

  const testUrl = 'https://maps.app.goo.gl/yH19nhfRL2gxTNs28';
  console.log(`   URL: ${testUrl}`);

  const parsed = await parseGoogleMapsUrl(testUrl);

  if (parsed) {
    console.log('   ✅ Parsed successfully:');
    console.log(`      Name: ${parsed.name || 'N/A'}`);
    console.log(`      Lat: ${parsed.lat || 'N/A'}`);
    console.log(`      Lon: ${parsed.lon || 'N/A'}`);
    console.log(`      Final URL: ${parsed.url?.substring(0, 60)}...`);
  } else {
    console.log('   ❌ Could not parse URL');
  }

  // Test 2: Search for a place
  console.log('\n2️⃣  Testing place search...\n');

  const placeName = 'Brihadeeshwarar Temple';
  console.log(`   Searching for: "${placeName}"`);

  const place = await searchPlace(placeName);

  if (place) {
    console.log('   ✅ Found place:');
    console.log(`      Name: ${place.name}`);
    console.log(`      Address: ${place.address}`);
    console.log(`      Coordinates: ${place.lat}, ${place.lon}`);
    console.log(`      Types: ${place.types?.join(', ')}`);

    const category = getCategoryFromTypes(place.types);
    console.log(`      Suggested category: ${category || 'N/A'}`);
    console.log(`      URL: ${place.url}`);
  } else {
    console.log('   ℹ️  Place not found (may need API key)');
  }

  console.log('\n✨ Tests completed!');
}

testGoogleMaps().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
