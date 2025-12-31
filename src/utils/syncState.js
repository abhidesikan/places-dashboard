import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';

/**
 * Load sync state from disk
 */
export async function loadSyncState() {
  try {
    const data = await fs.readFile(config.syncStatePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return default state
    return {
      googleMaps: { lastSync: null, itemCount: 0 },
      instapaper: { lastSync: null, itemCount: 0 },
      twitter: { lastSync: null, itemCount: 0 },
      icloud: { lastSync: null, itemCount: 0 },
    };
  }
}

/**
 * Save sync state to disk
 */
export async function saveSyncState(state) {
  // Ensure data directory exists
  await fs.mkdir(path.dirname(config.syncStatePath), { recursive: true });

  await fs.writeFile(
    config.syncStatePath,
    JSON.stringify(state, null, 2),
    'utf-8'
  );
}

/**
 * Update sync state for a specific source
 */
export async function updateSyncState(source, updates) {
  const state = await loadSyncState();

  state[source] = {
    ...state[source],
    ...updates,
    lastSync: new Date().toISOString(),
  };

  await saveSyncState(state);
  return state;
}

/**
 * Get last sync time for a source
 */
export async function getLastSyncTime(source) {
  const state = await loadSyncState();
  return state[source]?.lastSync || null;
}
