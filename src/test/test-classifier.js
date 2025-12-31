import { classifyTemple } from '../utils/templeClassifier.js';

// Test the classifier
const testCases = [
  { name: 'Brihadeeshwarar Temple', address: 'Thanjavur' },
  { name: 'Hampi achyutaraya temple', address: 'Hampi' },
  { name: 'Somnath Temple', address: 'Gujarat' },
  { name: 'Tirupati Balaji', address: 'Andhra Pradesh' },
];

console.log('🧪 Testing Temple Classifier\n');

testCases.forEach(test => {
  const types = classifyTemple(test.name, test.address);
  console.log(`${test.name}:`);
  if (types.length > 0) {
    console.log(`  ✅ ${types.join(', ')}`);
  } else {
    console.log(`  ℹ️  No classification`);
  }
  console.log();
});
