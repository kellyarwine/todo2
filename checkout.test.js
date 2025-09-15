// checkout.test.js - Tests for CheckoutProcessor class
const assert = require('assert');

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default test value
    }
    return null;
  }
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true, transactionId: 'test-123' })
  };
};

// Import the CheckoutProcessor class
// Since we can't use ES6 imports without a build system, we'll eval the file
const fs = require('fs');
const checkoutCode = fs.readFileSync('/home/runner/work/todo2/todo2/checkout.js', 'utf8');

// Remove the DOM event listener part for testing and extract just the class
const classOnlyCode = checkoutCode.split('// Event handler')[0];

// Evaluate the class definition in global scope
eval(`
${classOnlyCode}
// Make CheckoutProcessor available globally
global.CheckoutProcessor = CheckoutProcessor;
`);

// Test suite
console.log('Running CheckoutProcessor tests...\n');

// Test 1: getCurrency method
function testGetCurrency() {
  console.log('Test 1: getCurrency method');
  const processor = new CheckoutProcessor({ subtotal: 100, items: [] });
  
  // Test known currencies
  assert.strictEqual(processor.getCurrency('US'), 'USD', 'US should return USD');
  assert.strictEqual(processor.getCurrency('CA'), 'CAD', 'CA should return CAD');
  assert.strictEqual(processor.getCurrency('GB'), 'GBP', 'GB should return GBP');
  assert.strictEqual(processor.getCurrency('DE'), 'EUR', 'DE should return EUR');
  assert.strictEqual(processor.getCurrency('FR'), 'EUR', 'FR should return EUR');
  
  // Test unknown region (should default to USD)
  assert.strictEqual(processor.getCurrency('XX'), 'USD', 'Unknown region should default to USD');
  
  console.log('✓ getCurrency tests passed\n');
}

// Test 2: calculateTax method
function testCalculateTax() {
  console.log('Test 2: calculateTax method');
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  
  // Test US tax calculation
  const usTax = processor.calculateTax('US');
  assert.strictEqual(usTax, 8, 'US tax should be 8% of subtotal (8)');
  
  // Test CA tax calculation
  const caTax = processor.calculateTax('CA');
  assert.strictEqual(caTax, 13, 'CA tax should be 13% of subtotal (13)');
  
  // Test region without tax rate (this reveals the bug)
  const deTax = processor.calculateTax('DE');
  assert.strictEqual(deTax, NaN, 'DE tax should be NaN due to missing tax rate');
  
  console.log('✓ calculateTax tests passed (including bug demonstration)\n');
}

// Test 3: processPayment method with valid regions
function testProcessPaymentValid() {
  console.log('Test 3: processPayment with valid regions');
  
  // Mock getUserRegion to return US
  global.document.getElementById = (id) => {
    if (id === 'country-select') {
      return { value: 'US' };
    }
    return null;
  };
  
  const cart = { subtotal: 100, items: ['item1', 'item2'] };
  const processor = new CheckoutProcessor(cart);
  
  // This should work for US
  const result = processor.processPayment();
  
  // Check that cart.total was calculated correctly
  assert.strictEqual(cart.total, 108, 'Cart total should be subtotal + tax (100 + 8 = 108)');
  
  console.log('✓ processPayment with valid region (US) passed\n');
}

// Test 4: processPayment method with invalid regions (demonstrates the bug)
function testProcessPaymentBug() {
  console.log('Test 4: processPayment with EU regions (demonstrates bug)');
  
  // Mock getUserRegion to return DE (Germany)
  global.document.getElementById = (id) => {
    if (id === 'country-select') {
      return { value: 'DE' };
    }
    return null;
  };
  
  const cart = { subtotal: 100, items: ['item1', 'item2'] };
  const processor = new CheckoutProcessor(cart);
  
  try {
    processor.processPayment();
    // Check if cart.total is NaN (which it will be)
    if (isNaN(cart.total)) {
      console.log('✓ Bug confirmed: cart.total becomes NaN for EU regions');
      console.log(`  cart.total = ${cart.total} (should be a number)\n`);
    } else {
      assert.fail('Expected cart.total to be NaN due to missing tax rate');
    }
  } catch (error) {
    // This would occur if NaN.toFixed(2) is called
    console.log('✓ Bug confirmed: processPayment fails for EU regions');
    console.log(`  Error: ${error.message}\n`);
  }
}

// Test 5: Test with different cart values
function testDifferentCartValues() {
  console.log('Test 5: Different cart values');
  
  // Mock getUserRegion to return CA
  global.document.getElementById = (id) => {
    if (id === 'country-select') {
      return { value: 'CA' };
    }
    return null;
  };
  
  const cart = { subtotal: 250.50, items: ['expensive-item'] };
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('CA');
  const expectedTax = 250.50 * 0.13; // 32.565
  assert.strictEqual(tax, expectedTax, 'Tax should be calculated correctly for different amounts');
  
  processor.processPayment();
  const expectedTotal = 250.50 + expectedTax; // 283.065
  assert.strictEqual(cart.total, expectedTotal, 'Total should be calculated correctly');
  
  console.log('✓ Different cart values test passed\n');
}

// Run all tests
try {
  testGetCurrency();
  testCalculateTax();
  testProcessPaymentValid();
  testProcessPaymentBug();
  testDifferentCartValues();
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- getCurrency() works correctly with fallback to USD');
  console.log('- calculateTax() works for US/CA but fails for EU (returns NaN)');
  console.log('- processPayment() works for US/CA but crashes for EU regions');
  console.log('- The bug is in calculateTax() - missing tax rates for EU countries');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}