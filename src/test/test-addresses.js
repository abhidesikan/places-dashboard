import { getAllPlaces, extractProperties } from '../integrations/notion.js';

const places = await getAllPlaces();
console.log('📍 Current Places:\n');

places.forEach(page => {
  const props = extractProperties(page);
  console.log(`Name: ${props.name}`);
  console.log(`Address: ${props.place?.address || 'N/A'}`);
  console.log(`City: ${props.city || 'N/A'}`);
  console.log(`Country: ${props.country || 'N/A'}`);
  console.log('---\n');
});
