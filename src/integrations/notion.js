import { Client } from '@notionhq/client';
import config, { validateConfig } from '../config/index.js';

// Validate required Notion credentials
validateConfig(['notion.apiKey', 'notion.databaseId']);

const notion = new Client({ auth: config.notion.apiKey });
const databaseId = config.notion.databaseId;

/**
 * Test connection to Notion database
 */
export async function testConnection() {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    return {
      success: true,
      database: response.title?.[0]?.plain_text || 'Untitled',
      id: response.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Query all places from the Notion database
 */
export async function getAllPlaces() {
  const places = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
    });

    places.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return places;
}

/**
 * Search for a place by name (case-insensitive)
 */
export async function findPlaceByName(name) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      title: {
        contains: name,
      },
    },
  });

  return response.results;
}

/**
 * Create a new place in Notion
 */
export async function createPlace({
  name,
  category = null,
  place = null, // { lat, lon, name, address }
  url = null,
  sources = [],
  templeTypes = [],
  city = null,
  country = null,
  status = 'Want to go',
  notes = null,
}) {
  const properties = {
    Name: {
      title: [{ text: { content: name } }],
    },
    Status: {
      select: { name: status },
    },
  };

  if (category) {
    properties.Category = { select: { name: category } };
  }

  if (place && place.lat && place.lon) {
    properties.Place = {
      type: 'place',
      place: {
        lat: place.lat,
        lon: place.lon,
        name: place.name || name,
        address: place.address || '',
      },
    };
  }

  if (url) {
    properties.URL = { url: url };
  }

  if (sources && sources.length > 0) {
    properties.Source = { multi_select: sources.map(s => ({ name: s })) };
  }

  if (templeTypes && templeTypes.length > 0) {
    properties['Temple Type'] = { multi_select: templeTypes.map(t => ({ name: t })) };
  }

  if (city) {
    properties.City = { rich_text: [{ text: { content: city } }] };
  }

  if (country) {
    properties.Country = { rich_text: [{ text: { content: country } }] };
  }

  const page = {
    parent: { database_id: databaseId },
    properties,
  };

  if (notes) {
    page.children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: notes } }],
        },
      },
    ];
  }

  const response = await notion.pages.create(page);
  return response;
}

/**
 * Update an existing place in Notion
 */
export async function updatePlace(pageId, updates) {
  const properties = {};

  if (updates.name) {
    properties.Name = { title: [{ text: { content: updates.name } }] };
  }

  if (updates.category) {
    properties.Category = { select: { name: updates.category } };
  }

  if (updates.place) {
    properties.Place = {
      type: 'place',
      place: updates.place,
    };
  }

  if (updates.url) {
    properties.URL = { url: updates.url };
  }

  if (updates.status) {
    properties.Status = { select: { name: updates.status } };
  }

  if (updates.sources) {
    properties.Source = { multi_select: updates.sources.map(s => ({ name: s })) };
  }

  if (updates.templeTypes) {
    properties['Temple Type'] = { multi_select: updates.templeTypes.map(t => ({ name: t })) };
  }

  if (updates.city) {
    properties.City = { rich_text: [{ text: { content: updates.city } }] };
  }

  if (updates.country) {
    properties.Country = { rich_text: [{ text: { content: updates.country } }] };
  }

  const response = await notion.pages.update({
    page_id: pageId,
    properties,
  });

  return response;
}

/**
 * Add a visit record to a place
 */
export async function addVisit(pageId, { date, cost = null, photos = [], notes = null }) {
  const blocks = [];

  // Add visit header
  blocks.push({
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ text: { content: `Visit - ${date}` } }],
    },
  });

  // Add cost if provided
  if (cost) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: `Cost: ${cost}` } }],
      },
    });
  }

  // Add notes if provided
  if (notes) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: notes } }],
      },
    });
  }

  // Add photos if provided
  if (photos && photos.length > 0) {
    for (const photoUrl of photos) {
      blocks.push({
        object: 'block',
        type: 'image',
        image: {
          type: 'external',
          external: { url: photoUrl },
        },
      });
    }
  }

  // Append blocks to the page
  await notion.blocks.children.append({
    block_id: pageId,
    children: blocks,
  });

  // Update status to "Visited"
  await updatePlace(pageId, { status: 'Visited' });

  return { success: true };
}

/**
 * Extract property values from a Notion page
 */
export function extractProperties(page) {
  const props = page.properties;

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || '',
    category: props.Category?.select?.name || null,
    place: props.Place?.place || null,
    url: props.URL?.url || null,
    sources: props.Source?.multi_select?.map(s => s.name) || [],
    templeTypes: props['Temple Type']?.multi_select?.map(t => t.name) || [],
    city: props.City?.rich_text?.[0]?.plain_text || null,
    country: props.Country?.rich_text?.[0]?.plain_text || null,
    status: props.Status?.select?.name || null,
  };
}

export default notion;
