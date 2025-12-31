import { extractCity, extractCountry } from '../utils/addressParser.js';

const testAddresses = [
  'Brihadeeswara Temple, Srinivasapuram, Thanjavur 613001, India',
  '8FJC+Q26, Hampi, Karnataka 583239, India',
  '5H9Q+X6J, Maheshwar, Madhya Pradesh 451228, India',
  'Shringeri, Karnataka, India',
  'Temple Name, City, State, Country',
];

console.log('🧪 Testing City Extraction:\n');

testAddresses.forEach(address => {
  const city = extractCity(address);
  const country = extractCountry(address);
  console.log(`Address: ${address}`);
  console.log(`  → City: ${city}`);
  console.log(`  → Country: ${country}`);
  console.log();
});
