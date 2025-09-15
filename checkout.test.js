// checkout.test.js - Tests for CheckoutProcessor class
// Tests the payment processing system and validates known bugs

// Mock DOM elements for testing
const mockDOM = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: mockDOM.countryValue || 'US' };
    }
    return null;
  },
  countryValue: 'US'
};

// Mock fetch for API calls
const mockFetch = (url, options) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
};

// Set up global mocks
global.document = mockDOM;
global.fetch = mockFetch;

// Import the CheckoutProcessor class (simulate require)
// Since we can't use ES6 modules easily, we'll copy the class definition
class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region];
    return this.cart.subtotal * rate;
  }

  processPayment() {
    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // BUG: cart.total becomes null for regions not in taxRates
    this.cart.total = this.cart.subtotal + tax;
    
    // This breaks when cart.total is null
    const paymentData = {
      amount: this.cart.total.toFixed(2),
      currency: this.getCurrency(region),
      items: this.cart.items
    };

    return this.submitPayment(paymentData);
  }

  getUserRegion() {
    return document.getElementById('country-select').value;
  }

  getCurrency(region) {
    const currencies = {
      'US': 'USD',
      'CA': 'CAD',
      'GB': 'GBP',
      'DE': 'EUR',
      'FR': 'EUR'
    };
    return currencies[region] || 'USD';
  }

  submitPayment(data) {
    // Payment API call
    return fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// Test helper functions
function createMockCart(subtotal = 100, items = ['item1', 'item2']) {
  return {
    subtotal: subtotal,
    items: items,
    total: null
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
  console.log(`✓ ${message}`);
}

// Test Suite
console.log('Running CheckoutProcessor Tests...\n');

// Test 1: Tax calculation for supported regions
function testTaxCalculationSupportedRegions() {
  console.log('Test 1: Tax calculation for supported regions');
  
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  // Test US tax rate
  const usTax = processor.calculateTax('US');
  assertEquals(usTax, 8, 'US tax calculation (8% of $100 = $8)');
  
  // Test CA tax rate
  const caTax = processor.calculateTax('CA');
  assertEquals(caTax, 13, 'CA tax calculation (13% of $100 = $13)');
  
  console.log('Test 1 passed!\n');
}

// Test 2: Tax calculation for unsupported regions (EU bug)
function testTaxCalculationUnsupportedRegions() {
  console.log('Test 2: Tax calculation for unsupported regions (demonstrates bug)');
  
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  // Test EU region (not in taxRates) - this should demonstrate the bug
  const euTax = processor.calculateTax('DE');
  
  // This will be NaN because undefined * 100 = NaN
  assert(isNaN(euTax), 'EU tax calculation returns NaN (demonstrates bug)');
  
  console.log('Test 2 passed - bug confirmed!\n');
}

// Test 3: Currency mapping
function testCurrencyMapping() {
  console.log('Test 3: Currency mapping');
  
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  assertEquals(processor.getCurrency('US'), 'USD', 'US currency is USD');
  assertEquals(processor.getCurrency('CA'), 'CAD', 'CA currency is CAD');
  assertEquals(processor.getCurrency('GB'), 'GBP', 'GB currency is GBP');
  assertEquals(processor.getCurrency('DE'), 'EUR', 'DE currency is EUR');
  assertEquals(processor.getCurrency('FR'), 'EUR', 'FR currency is EUR');
  assertEquals(processor.getCurrency('UNKNOWN'), 'USD', 'Unknown region defaults to USD');
  
  console.log('Test 3 passed!\n');
}

// Test 4: Payment processing with valid region
function testPaymentProcessingValidRegion() {
  console.log('Test 4: Payment processing with valid region');
  
  const cart = createMockCart(100, ['product1', 'product2']);
  const processor = new CheckoutProcessor(cart);
  
  // Set mock region to US
  mockDOM.countryValue = 'US';
  
  return processor.processPayment().then(() => {
    assertEquals(cart.total, 108, 'Cart total is correctly calculated ($100 + $8 tax)');
    console.log('Test 4 passed!\n');
  });
}

// Test 5: Payment processing with invalid region (demonstrates critical bug)
async function testPaymentProcessingInvalidRegion() {
  console.log('Test 5: Payment processing with invalid region (demonstrates critical bug)');
  
  const cart = createMockCart(100, ['product1', 'product2']);
  const processor = new CheckoutProcessor(cart);
  
  // Set mock region to EU country not in taxRates
  mockDOM.countryValue = 'DE';
  
  // Capture the payment data that would be sent
  let capturedPaymentData = null;
  const originalFetch = global.fetch;
  global.fetch = (url, options) => {
    capturedPaymentData = JSON.parse(options.body);
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
  };
  
  try {
    await processor.processPayment();
    
    // Check that the amount is "NaN" which is the actual bug
    assertEquals(capturedPaymentData.amount, "NaN", 'Payment amount becomes "NaN" for EU regions');
    assertEquals(capturedPaymentData.currency, "EUR", 'Currency is correctly set to EUR');
    assert(isNaN(cart.total), 'Cart total is NaN');
    
    console.log('✓ Bug confirmed: Payment processes with amount "NaN" for EU users');
    console.log('Test 5 passed - critical bug confirmed!\n');
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}

// Test 7: Simulate real browser scenario with EU bug
function testRealBrowserScenarioEUBug() {
  console.log('Test 7: Simulate real browser scenario with EU bug');
  
  const cart = createMockCart(100, ['product1', 'product2']);
  const processor = new CheckoutProcessor(cart);
  
  // Set mock region to EU country
  mockDOM.countryValue = 'DE';
  
  // Simulate the exact sequence that happens in processPayment()
  const region = processor.getUserRegion(); // 'DE'
  const tax = processor.calculateTax(region); // undefined * 100 = NaN
  cart.total = cart.subtotal + tax; // 100 + NaN = NaN
  
  assert(isNaN(cart.total), 'Cart total becomes NaN for EU regions');
  
  // This is where the actual error occurs in the browser
  try {
    const paymentData = {
      amount: cart.total.toFixed(2), // NaN.toFixed(2) returns "NaN"
      currency: processor.getCurrency(region),
      items: cart.items
    };
    // Actually, this doesn't throw an error - it just sets amount to "NaN"
    assertEquals(paymentData.amount, "NaN", 'Amount becomes "NaN" string');
    console.log('✓ Confirmed: EU users get "NaN" as payment amount');
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('Test 7 passed - real browser bug scenario confirmed!\n');
}
// Test 6: Edge cases
function testEdgeCases() {
  console.log('Test 6: Edge cases');
  
  // Test with zero subtotal
  const zeroCart = createMockCart(0);
  const processor = new CheckoutProcessor(zeroCart);
  
  const zeroTax = processor.calculateTax('US');
  assertEquals(zeroTax, 0, 'Zero subtotal results in zero tax');
  
  // Test with negative subtotal (edge case)
  const negativeCart = createMockCart(-50);
  const negativeProcessor = new CheckoutProcessor(negativeCart);
  
  const negativeTax = negativeProcessor.calculateTax('US');
  assertEquals(negativeTax, -4, 'Negative subtotal results in negative tax');
  
  console.log('Test 6 passed!\n');
}

// Run all tests
async function runAllTests() {
  try {
    testTaxCalculationSupportedRegions();
    testTaxCalculationUnsupportedRegions();
    testCurrencyMapping();
    await testPaymentProcessingValidRegion();
    await testPaymentProcessingInvalidRegion();
    testRealBrowserScenarioEUBug();
    testEdgeCases();
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✓ Tax calculation works for supported regions (US, CA)');
    console.log('- ⚠️  BUG CONFIRMED: Tax calculation fails for EU regions (returns NaN)');
    console.log('- ⚠️  BUG CONFIRMED: Payment processing sends "NaN" as amount for EU users');
    console.log('- ✓ Currency mapping works correctly');
    console.log('- ✓ Edge cases handled appropriately');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Export for Node.js execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CheckoutProcessor, runAllTests };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}
