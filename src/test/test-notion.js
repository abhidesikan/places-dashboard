import { testConnection, getAllPlaces } from '../integrations/notion.js';

async function runTest() {
  console.log('🧪 Testing Notion Connection...\n');

  try {
    // Test 1: Connection
    console.log('1️⃣  Testing database connection...');
    const result = await testConnection();

    if (!result.success) {
      console.error('❌ Connection failed:', result.error);
      console.log('\nPlease check:');
      console.log('  - NOTION_API_KEY is set in .env');
      console.log('  - NOTION_DATABASE_ID is set in .env');
      console.log('  - The integration has access to the database');
      process.exit(1);
    }

    console.log('✅ Connected successfully!');
    console.log(`   Database: "${result.database}"`);
    console.log(`   ID: ${result.id}\n`);

    // Test 2: Query places
    console.log('2️⃣  Fetching existing places...');
    const places = await getAllPlaces();
    console.log(`✅ Found ${places.length} place(s) in database\n`);

    if (places.length > 0) {
      console.log('📍 Sample places:');
      places.slice(0, 5).forEach((place, idx) => {
        const name = place.properties.Name?.title?.[0]?.plain_text || 'Untitled';
        const status = place.properties.Status?.select?.name || 'No status';
        console.log(`   ${idx + 1}. ${name} (${status})`);
      });

      if (places.length > 5) {
        console.log(`   ... and ${places.length - 5} more`);
      }
    }

    console.log('\n✨ All tests passed! Your Notion integration is ready.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

runTest();
