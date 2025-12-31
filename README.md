# Places Dashboard

Automated sync of saved places from multiple sources (Google Maps, Instapaper, Twitter, iCloud Notes) to a centralized Notion database for easy travel planning and tracking.

## Features

- **Multi-source sync**: Automatically pull places from Google Maps saved locations, Instapaper articles, Twitter bookmarks, and iCloud Notes
- **Deduplication**: Smart detection to avoid duplicate entries
- **Rich metadata**: Auto-populate temple types, locations, URLs, and more
- **Visit tracking**: Log visits with dates, costs, and photos
- **Easy filtering**: View and filter places by type, status, location

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- Notion account with integration created
- API access to Google Maps, Instapaper, Twitter (optional: iCloud)

### 2. Notion Setup

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration" and give it a name (e.g., "Places Sync")
3. Copy the "Internal Integration Token"
4. Open your Places database in Notion
5. Click the "..." menu → "Add connections" → Select your integration

### 3. Update Notion Database Properties

Add these properties to your Places database if not already present:

- **Visit Date** (Date)
- **Photos** (Files & media)
- **Travel Cost** (Number - Currency)
- **Notes** (Text)
- **Original Source** (URL)
- **Last Synced** (Date)
- **Planning Status** (Select: Saved/Planning/Booked/Visited)

### 4. API Setup

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API" and "Places API"
4. Create credentials → API Key
5. Copy the API key

#### Instapaper API
1. Go to [Instapaper API](https://www.instapaper.com/main/request_oauth_consumer_token)
2. Request consumer token
3. Save consumer key and secret

#### Twitter API
1. Apply for developer account at [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate API keys and tokens (need elevated access for bookmarks)

### 5. Install Dependencies

```bash
cd places-dashboard
npm install
```

### 6. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

## Usage

### Sync all sources
```bash
npm run sync
```

### Sync individual sources
```bash
npm run sync:google      # Google Maps saved places
npm run sync:instapaper  # Instapaper articles
npm run sync:twitter     # Twitter bookmarks
npm run sync:icloud      # iCloud Notes
```

### Manual operations
```bash
npm run add              # Add a place manually
npm run visit            # Log a visit with date/cost/photos
npm run list             # View all places with filters
```

### Test Notion connection
```bash
npm test
```

## Project Structure

```
places-dashboard/
├── src/
│   ├── config/              # Configuration
│   ├── integrations/        # API clients (Notion, Google, etc)
│   ├── services/            # Business logic
│   ├── sync/                # Sync scripts for each source
│   ├── scripts/             # CLI utilities
│   └── utils/               # Helper functions
└── data/                    # Sync state and cache
```

## Roadmap

- [ ] Phase 1: Notion + Google Maps integration
- [ ] Phase 2: Instapaper integration
- [ ] Phase 3: Twitter bookmarks
- [ ] Phase 4: iCloud Notes parsing
- [ ] Phase 5: Automated scheduling (GitHub Actions)
- [ ] Phase 6: Mobile app or web interface

## Contributing

This is a personal project, but feel free to fork and adapt for your own use!

## License

MIT
