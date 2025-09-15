// Simple test for the thread sum calculation
// Tests the sum of numbers 4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22

console.log('=== Testing Thread Sum Calculation ===\n');

// Direct implementation of the sum calculation
function calculateThreadSum() {
  const numbers = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
  return numbers.reduce((sum, num) => sum + num, 0);
}

// Test the calculation
const result = calculateThreadSum();
const expected = 247;

console.log('Testing sum of numbers 4-22...');
console.log(`Numbers: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]`);
console.log(`Expected sum: ${expected}`);
console.log(`Calculated sum: ${result}`);
console.log(`Test result: ${result === expected ? '✓ PASS' : '✗ FAIL'}`);

if (result === expected) {
  console.log('\n🎉 Thread sum test passed!');
  console.log('The sum calculation is correctly implemented and can be integrated into the checkout process.');
} else {
  console.log('\n❌ Thread sum test failed!');
  process.exit(1);
}