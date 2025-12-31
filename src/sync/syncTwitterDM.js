/**
 * Sync places from Twitter Direct Messages to Notion
 * Useful for saving place recommendations sent by friends or self-DMs
 */

import { validateConfig } from '../config/index.js';
import { getAuthenticatedUser, getDirectMessages, filterPlaceDMs } from '../integrations/twitterDM.js';
import { searchPlace } from '../integrations/googleMaps.js';
import { addOrUpdatePlace } from '../services/places.js';
import { getSyncState, updateSyncState } from '../utils/syncState.js';
import inquirer from 'inquirer';

async function syncTwitterDMs() {
  console.log('💬 Syncing Twitter Direct Messages\n');

  // Validate required config
  try {
    validateConfig(['notion.apiKey', 'notion.databaseId', 'twitter.bearerToken']);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  try {
    // Get authenticated user info
    console.log('🔍 Getting your Twitter user info...');
    const user = await getAuthenticatedUser();
    console.log(`✅ Authenticated as @${user.username} (${user.name})\n`);

    // Get sync state
    const syncState = getSyncState('twitter-dm');
    const lastSync = syncState.lastSync ? new Date(syncState.lastSync) : null;

    if (lastSync) {
      console.log(`Last synced: ${lastSync.toLocaleString()}\n`);
    }

    // Fetch DMs
    console.log('📥 Fetching direct messages...');
    const dmsData = await getDirectMessages(100);

    if (!dmsData?.data || dmsData.data.length === 0) {
      console.log('No direct messages found.');
      return;
    }

    console.log(`Found ${dmsData.data.length} total messages\n`);

    // Filter for place-related DMs
    console.log('🔍 Filtering for place-related messages...');
    const placeDMs = filterPlaceDMs(dmsData, user.id);

    console.log(`Found ${placeDMs.length} place-related messages\n`);

    if (placeDMs.length === 0) {
      console.log('✅ No place-related messages to sync.');
      return;
    }

    // Show preview
    console.log('Preview of places found:');
    placeDMs.slice(0, 5).forEach((dm, i) => {
      console.log(`${i + 1}. ${dm.name}`);
      if (dm.url) console.log(`   🔗 ${dm.url}`);
      if (dm.isSelfDM) console.log(`   📝 Self-DM`);
    });

    if (placeDMs.length > 5) {
      console.log(`... and ${placeDMs.length - 5} more\n`);
    }

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Add these ${placeDMs.length} places to Notion?`,
        default: true,
      },
    ]);

    if (!proceed) {
      console.log('Cancelled.');
      return;
    }

    // Process each DM
    let added = 0;
    let skipped = 0;
    let errors = 0;

    console.log('\n📝 Processing messages...\n');

    for (const dm of placeDMs) {
      try {
        console.log(`Processing: ${dm.name}`);

        // Try to get more details from Google Maps
        let placeDetails = null;
        const searchQuery = dm.name;

        try {
          placeDetails = await searchPlace(searchQuery);
          console.log(`  ✅ Found on Google Maps: ${placeDetails.address}`);
        } catch (error) {
          console.log(`  ⚠️  Not found on Google Maps, using DM data`);
        }

        // Prepare place data
        const placeData = {
          name: dm.name,
          category: placeDetails?.category || 'Other',
          url: dm.url || placeDetails?.url,
          sources: ['Twitter DM'],
          status: 'Want to Visit',
          notes: `From Twitter DM:\n${dm.rawText}`,
        };

        // Add location data if available
        if (placeDetails) {
          placeData.place = {
            lat: placeDetails.lat,
            lon: placeDetails.lon,
            name: placeDetails.name,
            address: placeDetails.address,
          };
          placeData.city = placeDetails.city;
          placeData.country = placeDetails.country;
        }

        // Add to Notion with deduplication
        const result = await addOrUpdatePlace(placeData, {
          merge: true,
        });

        if (result.action === 'created') {
          console.log(`  ✅ Added to Notion`);
          added++;
        } else if (result.action === 'merged') {
          console.log(`  🔄 Merged with existing place`);
          added++;
        } else {
          console.log(`  ⏭️  Skipped (duplicate)`);
          skipped++;
        }

        console.log();

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errors++;
        console.log();
      }
    }

    // Update sync state
    updateSyncState('twitter-dm', {
      lastSync: new Date().toISOString(),
      totalProcessed: placeDMs.length,
      added,
      skipped,
      errors,
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✨ Done! Your Twitter DMs have been synced to Notion.');
    console.log('\n💡 Tip: You can DM yourself place names or Google Maps links to auto-add them!');

  } catch (error) {
    console.error('❌ Error syncing Twitter DMs:', error.message);

    // Provide helpful hints for common errors
    if (error.message.includes('OAuth 1.0a')) {
      console.log('\n📘 Note: Twitter DM access requires OAuth 1.0a authentication.');
      console.log('Unfortunately, the Bearer Token alone is not sufficient for DMs.');
      console.log('\nAlternatives:');
      console.log('1. Use Twitter bookmarks with OAuth 2.0 setup');
      console.log('2. Manually export your Twitter data archive');
      console.log('3. Use the "npm run add" command to manually add places');
    }

    process.exit(1);
  }
}

syncTwitterDMs().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
