import { searchPlace } from '../integrations/googleMaps.js';
import config from '../config/index.js';

async function testAPIKey() {
  console.log('🔑 Testing Google Maps API Key\n');

  if (!config.googleMaps.apiKey) {
    console.log('❌ No API key found in .env');
    console.log('   Add GOOGLE_MAPS_API_KEY to your .env file');
    return;
  }

  console.log('✅ API key found:', config.googleMaps.apiKey.substring(0, 10) + '...');
  console.log('\n🔍 Testing search for "Brihadeeshwarar Temple"...\n');

  const result = await searchPlace('Brihadeeshwarar Temple');

  if (result) {
    console.log('✅ Success!');
    console.log('   Name:', result.name);
    console.log('   Address:', result.address);
    console.log('   Coordinates:', result.lat, result.lon);
    console.log('   Types:', result.types?.join(', '));
    console.log('   URL:', result.url);
  } else {
    console.log('❌ Search failed');
    console.log('\nPossible issues:');
    console.log('1. Places API not enabled in Google Cloud Console');
    console.log('2. API key restrictions preventing access');
    console.log('3. Billing not enabled on the project');
    console.log('4. Place not found with that exact name');
    console.log('\nTry searching for something more common like "Eiffel Tower"...\n');

    const result2 = await searchPlace('Eiffel Tower');
    if (result2) {
      console.log('✅ Found Eiffel Tower!');
      console.log('   Your API key works, but might need a more specific search term');
    } else {
      console.log('❌ Still failed - check API key setup');
    }
  }
}

testAPIKey().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
