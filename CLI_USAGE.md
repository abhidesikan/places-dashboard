# CLI Tools Usage Guide

## Available Commands

### 1. Add a Place
```bash
npm run add
```

Interactive prompts to add a new place:
- Name (required)
- Source (Manual, Twitter, Notes, Google Maps, Instapaper)
- Status (Want to go, Visited, Maybe)
- Notes (optional)
- Category (auto-suggested based on Google data)

**Smart Features:**
- 🔍 **Enter just the name** → Automatically looks it up on Google Maps:
  - GPS coordinates for Notion's map view
  - Full address
  - Google Maps URL
  - Category suggestion (Restaurant, Temple, etc.)
- ✅ **Deduplication** → Checks for duplicates and merges sources
- 📍 **Map integration** → Populates Notion's Place column with coordinates

**Setup Required:**
Add `GOOGLE_MAPS_API_KEY` to your `.env` file to enable automatic lookup

### 2. View/List Places
```bash
npm run list
```

Options:
- **All places** - See everything in your database
- **Filter by category** - Show only restaurants, temples, etc.
- **Filter by status** - Show "Want to go" or "Visited" places
- **Filter by source** - Show places from Twitter, Notes, etc.
- **Show statistics** - Database summary with counts

### 3. Log a Visit
```bash
npm run visit
```

Record when you visit a place:
- Select place from list
- Enter visit date (defaults to today)
- Add cost (optional)
- Add notes about the visit
- Add photo URLs (optional)

**Automatically:**
- Updates status to "Visited"
- Adds visit details to the Notion page

## Workflow Examples

### Adding Places from Twitter
When you see a place on Twitter:
1. Copy the name and URL
2. Run `npm run add`
3. Fill in the details
4. Source: "Twitter"

### Planning a Trip to Tokyo
1. Run `npm run list`
2. Choose "Filter by category"
3. Select "Restaurant"
4. (In the future: filter by city)

### After Visiting a Place
1. Run `npm run visit`
2. Select the place
3. Add cost, notes, photos
4. Status automatically updates to "Visited"

## Next Steps

Once the sync scripts are built, you won't need to manually add from Twitter/Notes:
- Twitter bookmarks will auto-sync
- Notes will auto-sync
- Google Maps stars will auto-sync

For now, use `npm run add` to manually populate your dashboard!
