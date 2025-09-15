// test.js - Tests for CheckoutProcessor class
// Run with: node test.js

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: global.mockCountryValue || 'US' };
    }
    return null;
  }
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true })
  };
};

// Load the CheckoutProcessor class
const fs = require('fs');
const path = require('path');

// Read the checkout.js file
let checkoutCode = fs.readFileSync(path.join(__dirname, 'checkout.js'), 'utf8');

// Remove the DOM event listener part for testing
checkoutCode = checkoutCode.split('// Event handler for payment button')[0];

// Make the class available globally by modifying the code
checkoutCode = checkoutCode.replace('class CheckoutProcessor', 'global.CheckoutProcessor = class CheckoutProcessor');

// Execute the modified code
eval(checkoutCode);

// Make it available in the current scope
const CheckoutProcessor = global.CheckoutProcessor;

// Test framework - simple assertion functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(`Assertion failed: ${message}. Expected function to throw an error.`);
  } catch (error) {
    // Expected to throw
  }
}

// Test suite
let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
  testsTotal++;
  try {
    testFn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}

// Mock cart data for testing
const mockCart = {
  subtotal: 100,
  items: ['item1', 'item2'],
  total: null
};

console.log('Running CheckoutProcessor tests...\n');

// Test calculateTax method
runTest('calculateTax - US region', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('US');
  assertEquals(tax, 8, 'US tax should be 8% of subtotal (100 * 0.08 = 8)');
});

runTest('calculateTax - CA region', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('CA');
  assertEquals(tax, 13, 'CA tax should be 13% of subtotal (100 * 0.13 = 13)');
});

runTest('calculateTax - unsupported region returns NaN', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('GB');
  assert(isNaN(tax), 'Tax calculation for unsupported region should result in NaN (undefined * number = NaN)');
});

runTest('calculateTax - unsupported region causes NaN result', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('DE');
  assert(isNaN(tax), 'Tax calculation for unsupported region should result in NaN');
});

// Test getCurrency method
runTest('getCurrency - US returns USD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('US');
  assertEquals(currency, 'USD', 'US should return USD currency');
});

runTest('getCurrency - CA returns CAD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('CA');
  assertEquals(currency, 'CAD', 'CA should return CAD currency');
});

runTest('getCurrency - GB returns GBP', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('GB');
  assertEquals(currency, 'GBP', 'GB should return GBP currency');
});

runTest('getCurrency - unsupported region defaults to USD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('XX');
  assertEquals(currency, 'USD', 'Unsupported regions should default to USD');
});

// Test getUserRegion method
runTest('getUserRegion - returns mocked country value', () => {
  global.mockCountryValue = 'CA';
  const processor = new CheckoutProcessor(mockCart);
  const region = processor.getUserRegion();
  assertEquals(region, 'CA', 'getUserRegion should return the mocked country value');
});

// Test processPayment method with supported region
runTest('processPayment - US region success', async () => {
  global.mockCountryValue = 'US';
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  const result = await processor.processPayment();
  
  assertEquals(testCart.total, 108, 'Cart total should be subtotal + tax (100 + 8 = 108)');
  assert(result, 'processPayment should return a result');
});

// Test processPayment method with unsupported region (this should reveal the bug)
runTest('processPayment - unsupported region causes error', async () => {
  global.mockCountryValue = 'FR';
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  try {
    await processor.processPayment();
    throw new Error('Expected processPayment to throw error for unsupported region');
  } catch (error) {
    assert(error.message.includes('toFixed'), 'Should fail when trying to call toFixed on null/undefined');
  }
});

// Test edge cases
runTest('calculateTax - zero subtotal', () => {
  const zeroCart = { subtotal: 0, items: [], total: null };
  const processor = new CheckoutProcessor(zeroCart);
  const tax = processor.calculateTax('US');
  assertEquals(tax, 0, 'Tax on zero subtotal should be zero');
});

runTest('calculateTax - negative subtotal', () => {
  const negativeCart = { subtotal: -50, items: [], total: null };
  const processor = new CheckoutProcessor(negativeCart);
  const tax = processor.calculateTax('US');
  assertEquals(tax, -4, 'Tax on negative subtotal should be negative');
});

// Summary
console.log(`\nTest Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
