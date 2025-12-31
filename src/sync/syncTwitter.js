/**
 * Sync places from Twitter bookmarks to Notion
 * Filters for place-related bookmarks and adds them to the dashboard
 */

import { validateConfig } from '../config/index.js';
import { getBookmarks, filterPlaceBookmarks } from '../integrations/twitter.js';
import { searchPlace } from '../integrations/googleMaps.js';
import { addOrUpdatePlace } from '../services/places.js';
import { getSyncState, updateSyncState } from '../utils/syncState.js';
import inquirer from 'inquirer';

async function syncTwitterBookmarks() {
  console.log('🐦 Syncing Twitter Bookmarks\n');

  // Validate required config
  try {
    validateConfig(['notion.apiKey', 'notion.databaseId', 'twitter.bearerToken']);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  try {
    // Get sync state
    const syncState = getSyncState('twitter');
    const lastSync = syncState.lastSync ? new Date(syncState.lastSync) : null;

    if (lastSync) {
      console.log(`Last synced: ${lastSync.toLocaleString()}\n`);
    }

    // Fetch bookmarks
    console.log('📥 Fetching bookmarks from Twitter...');
    const bookmarksData = await getBookmarks(100);

    if (!bookmarksData?.data || bookmarksData.data.length === 0) {
      console.log('No bookmarks found.');
      return;
    }

    console.log(`Found ${bookmarksData.data.length} total bookmarks\n`);

    // Filter for place-related bookmarks
    console.log('🔍 Filtering for place-related bookmarks...');
    const placeBookmarks = filterPlaceBookmarks(bookmarksData);

    console.log(`Found ${placeBookmarks.length} place-related bookmarks\n`);

    if (placeBookmarks.length === 0) {
      console.log('✅ No place-related bookmarks to sync.');
      return;
    }

    // Show preview and ask for confirmation
    console.log('Preview of places found:');
    placeBookmarks.slice(0, 5).forEach((bookmark, i) => {
      console.log(`${i + 1}. ${bookmark.name}`);
      if (bookmark.location) console.log(`   📍 ${bookmark.location}`);
      if (bookmark.url) console.log(`   🔗 ${bookmark.url}`);
    });

    if (placeBookmarks.length > 5) {
      console.log(`... and ${placeBookmarks.length - 5} more\n`);
    }

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Add these ${placeBookmarks.length} places to Notion?`,
        default: true,
      },
    ]);

    if (!proceed) {
      console.log('Cancelled.');
      return;
    }

    // Process each bookmark
    let added = 0;
    let skipped = 0;
    let errors = 0;

    console.log('\n📝 Processing bookmarks...\n');

    for (const bookmark of placeBookmarks) {
      try {
        console.log(`Processing: ${bookmark.name}`);

        // Try to get more details from Google Maps if we have a location or name
        let placeDetails = null;
        const searchQuery = bookmark.location || bookmark.name;

        try {
          placeDetails = await searchPlace(searchQuery);
          console.log(`  ✅ Found on Google Maps: ${placeDetails.address}`);
        } catch (error) {
          console.log(`  ⚠️  Not found on Google Maps, using tweet data`);
        }

        // Prepare place data
        const placeData = {
          name: bookmark.name,
          category: placeDetails?.category || 'Other',
          url: bookmark.url || placeDetails?.url,
          sources: ['Twitter'],
          status: 'Want to Visit',
          notes: `From Twitter: ${bookmark.tweetUrl}\n\n${bookmark.tweetText}`,
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
          merge: true, // Merge sources if duplicate found
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

        // Rate limiting - wait 1 second between requests to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errors++;
        console.log();
      }
    }

    // Update sync state
    updateSyncState('twitter', {
      lastSync: new Date().toISOString(),
      totalProcessed: placeBookmarks.length,
      added,
      skipped,
      errors,
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✨ Done! Your Twitter bookmarks have been synced to Notion.');

  } catch (error) {
    console.error('❌ Error syncing Twitter bookmarks:', error.message);
    process.exit(1);
  }
}

syncTwitterBookmarks().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
