# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env` and add your Notion credentials (required for testing):
```
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
```

### 3. Create Notion Database
Your Notion database should have these properties:
- **Name** (Title) - Place name
- **Type** (Select) - Restaurant, Cafe, Bar, Museum, Park, etc.
- **Location** (Text) - Street address
- **City** (Text) - City name
- **Country** (Text) - Country name
- **URL** (URL) - Website or Google Maps link
- **Source** (Select) - Google Maps, Instapaper, Twitter, iCloud, Manual
- **Status** (Select) - Want to go, Visited, Maybe
- **Tags** (Multi-select) - Custom tags

### 4. Get Notion Credentials

#### API Key:
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "Places Dashboard")
4. Copy the "Internal Integration Token"
5. Paste it as `NOTION_API_KEY` in `.env`

#### Database ID:
1. Open your Places database in Notion
2. Click "Share" and invite your integration
3. Copy the database ID from the URL:
   - URL format: `notion.so/workspace/{database_id}?v=...`
   - Copy the 32-character ID between the last `/` and `?`
4. Paste it as `NOTION_DATABASE_ID` in `.env`

### 5. Get Google Maps API Key (Optional but Recommended)

This enables automatic place lookup - just enter a name and it finds coordinates, address, and URL automatically.

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable these APIs:
   - **Places API (New)**
   - **Geocoding API** (optional)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key
6. Add to `.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
7. (Recommended) Restrict the API key to only Places API

### 6. Test Your Connection
```bash
npm test
```

You should see:
```
✅ Connected successfully!
✅ Found X place(s) in database
✨ All tests passed! Your Notion integration is ready.
```

## Next Steps

Once the foundation is working:
1. Add places using `npm run add` - it will auto-lookup on Google Maps!
2. View places using `npm run list`
3. (Later) Set up Twitter/Notes sync for automation

## Troubleshooting

### "Missing required environment variables"
- Make sure you created `.env` file (not `.env.example`)
- Check that `NOTION_API_KEY` and `NOTION_DATABASE_ID` are set

### "Connection failed: Unauthorized"
- Verify your `NOTION_API_KEY` is correct
- Make sure you created the integration at https://www.notion.so/my-integrations

### "Object not found"
- Verify your `NOTION_DATABASE_ID` is correct
- Make sure you invited the integration to your database (Share → Add your integration)
