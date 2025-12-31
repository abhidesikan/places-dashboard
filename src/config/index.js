import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  instapaper: {
    consumerKey: process.env.INSTAPAPER_CONSUMER_KEY,
    consumerSecret: process.env.INSTAPAPER_CONSUMER_SECRET,
    username: process.env.INSTAPAPER_USERNAME,
    password: process.env.INSTAPAPER_PASSWORD,
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  },
  icloud: {
    email: process.env.ICLOUD_EMAIL,
    appPassword: process.env.ICLOUD_APP_PASSWORD,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  dataDir: path.resolve(__dirname, '../../data'),
  syncStatePath: path.resolve(__dirname, '../../data/sync-state.json'),
  cachePath: path.resolve(__dirname, '../../data/cache'),
};

// Validation helper
export function validateConfig(requiredKeys) {
  const missing = [];

  for (const key of requiredKeys) {
    const [section, field] = key.split('.');
    if (!config[section]?.[field]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }
}

export default config;
