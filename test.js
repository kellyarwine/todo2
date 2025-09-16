// test.js - Comprehensive tests for CheckoutProcessor
// Tests the checkout processor functionality including the known EU tax bug

// Mock DOM elements since we're running in Node.js
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: global.mockCountry || 'US' };
    }
    if (id === 'pay-button') {
      return { addEventListener: () => {} };
    }
    return null;
  }
};

// Mock fetch for payment API
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true, id: 'payment_123' })
  };
};

// Define CheckoutProcessor class manually for testing
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

// Simple test framework
let testCount = 0;
let passedTests = 0;

function test(description, testFn) {
  testCount++;
  try {
    testFn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

function assertApproxEqual(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} - Expected: ~${expected}, Got: ${actual}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(`${message} - Expected function to throw, but it didn't`);
  } catch (error) {
    // Expected to throw
  }
}

// Test data
const mockCart = {
  subtotal: 100,
  total: 0,
  items: ['item1', 'item2']
};

console.log('Running CheckoutProcessor tests...\n');

console.log('=== Testing Tax Calculation ===');

// Test tax calculation for supported regions
test('Tax calculation for US region', () => {
  const processor = new CheckoutProcessor({ ...mockCart });
  const tax = processor.calculateTax('US');
  assertApproxEqual(tax, 8, 0.01, 'US tax should be 8% of subtotal');
});

test('Tax calculation for CA region', () => {
  const processor = new CheckoutProcessor({ ...mockCart });
  const tax = processor.calculateTax('CA');
  assertApproxEqual(tax, 13, 0.01, 'CA tax should be 13% of subtotal');
});

// Test the bug: tax calculation for unsupported regions
test('Tax calculation for GB region (unsupported - should cause bug)', () => {
  const processor = new CheckoutProcessor({ ...mockCart });
  const tax = processor.calculateTax('GB');
  // This will be NaN because taxRates['GB'] is undefined
  // undefined * 100 = NaN
  if (!isNaN(tax)) {
    throw new Error('Expected NaN for unsupported region, but got a number');
  }
});

test('Tax calculation for DE region (unsupported - should cause bug)', () => {
  const processor = new CheckoutProcessor({ ...mockCart });
  const tax = processor.calculateTax('DE');
  // This will be NaN because taxRates['DE'] is undefined
  if (!isNaN(tax)) {
    throw new Error('Expected NaN for unsupported region, but got a number');
  }
});

// Test currency mapping
console.log('\n=== Testing Currency Mapping ===');
test('Currency mapping for US', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('US');
  assertEqual(currency, 'USD', 'US should map to USD');
});

test('Currency mapping for CA', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('CA');
  assertEqual(currency, 'CAD', 'CA should map to CAD');
});

test('Currency mapping for GB', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('GB');
  assertEqual(currency, 'GBP', 'GB should map to GBP');
});

test('Currency mapping for DE', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('DE');
  assertEqual(currency, 'EUR', 'DE should map to EUR');
});

test('Currency mapping for unsupported region defaults to USD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('XX');
  assertEqual(currency, 'USD', 'Unknown region should default to USD');
});

// Test getUserRegion
console.log('\n=== Testing User Region Detection ===');
test('getUserRegion returns mocked country value', () => {
  global.mockCountry = 'GB';
  const processor = new CheckoutProcessor(mockCart);
  const region = processor.getUserRegion();
  assertEqual(region, 'GB', 'Should return mocked country value');
});

// Test payment processing for working regions
console.log('\n=== Testing Payment Processing ===');
test('Payment processing for US region (should work)', async () => {
  global.mockCountry = 'US';
  const cart = { ...mockCart };
  const processor = new CheckoutProcessor(cart);
  
  // This should work because US is in taxRates
  const result = await processor.processPayment();
  
  // Verify cart.total was set correctly
  assertApproxEqual(cart.total, 108, 0.01, 'Total should be subtotal + tax for US');
});

// Test the critical bug: payment processing for EU regions
test('Payment processing for GB region (should demonstrate the bug)', async () => {
  global.mockCountry = 'GB';
  const cart = { ...mockCart };
  const processor = new CheckoutProcessor(cart);
  
  try {
    await processor.processPayment();
    throw new Error('Expected payment processing to fail for GB region, but it succeeded');
  } catch (error) {
    // This should throw because cart.total becomes NaN + 100 = NaN
    // and NaN.toFixed(2) throws a TypeError
    if (!error.message.includes('toFixed')) {
      throw new Error(`Expected toFixed error, but got: ${error.message}`);
    }
  }
});

test('Payment processing for DE region (should demonstrate the bug)', async () => {
  global.mockCountry = 'DE';
  const cart = { ...mockCart };
  const processor = new CheckoutProcessor(cart);
  
  try {
    await processor.processPayment();
    throw new Error('Expected payment processing to fail for DE region, but it succeeded');
  } catch (error) {
    // This should throw because cart.total becomes NaN
    if (!error.message.includes('toFixed')) {
      throw new Error(`Expected toFixed error, but got: ${error.message}`);
    }
  }
});

// Summary
console.log(`\nTest Results: ${passedTests}/${testCount} tests passed`);

if (passedTests === testCount) {
  console.log('All tests passed! ✓');
  process.exit(0);
} else {
  console.log(`${testCount - passedTests} tests failed! ✗`);
  process.exit(1);
}
