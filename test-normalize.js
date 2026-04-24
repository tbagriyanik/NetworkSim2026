// Test normalizePortId behavior
const testCases = [
  'faa0/232323',
  'fa0/2222',
  'fastethernet0/2222',
  'gigabitethernet0/999',
  'gi0/1',
  ''
];

// Simulate normalizePortId regex behavior
function testNormalizePortId(input) {
  const lower = input.toLowerCase().trim().replace(/\s+/g, '');
  
  const subMatch = lower.match(/^(?:fa|fastethernet|fast|gi|gig|gigabit|gigabitethernet)(\d+)\/(\d+)\.(\d+)$/);
  if (subMatch) {
    const prefix = lower.startsWith('fa') || lower.startsWith('fast') ? 'fa' : 'gi';
    return `${prefix}${subMatch[1]}/${subMatch[2]}.${subMatch[3]}`;
  }
  
  const faMatch = lower.match(/^(?:fastethernet|fast|fa)(\d+)\/(\d+)$/);
  if (faMatch) {
    return `fa${faMatch[1]}/${faMatch[2]}`;
  }
  
  const giMatch = lower.match(/^(?:gigabitethernet|gigabit|gig|gi)(\d+)\/(\d+)$/);
  if (giMatch) {
    return `gi${giMatch[1]}/${giMatch[2]}`;
  }
  
  if (lower === 'wlan0') {
    return 'wlan0';
  }
  
  return null;
}

testCases.forEach(tc => {
  const result = testNormalizePortId(tc);
  const fallback = result || tc.toLowerCase();
  console.log(`"${tc}" -> normalize: ${result}, fallback: "${fallback}"`);
  console.log(`  || operator result: "${result || tc.toLowerCase()}"`);
});
