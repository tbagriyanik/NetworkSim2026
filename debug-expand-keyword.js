// Debug file for expandKeywordPrefixes!
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { expandKeywordPrefixes } from './src/lib/network/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Testing expandKeywordPrefixes('sh int', 'privileged'):");
try {
  const result = expandKeywordPrefixes('sh int', 'privileged');
  console.log('Result:', result);
} catch (err) {
  console.error('Error:', err);
}
