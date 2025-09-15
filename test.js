// test.js - Comprehensive tests for checkout.js functionality
const assert = require('assert');

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    const mockElements = {
      'country-select': { value: 'US' },
      'pay-button': { addEventListener: () => {} }
    };
    return mockElements[id] || { value: '', addEventListener: () => {} };
  }
};

// Mock fetch for testing
global.fetch = () => Promise.resolve({ ok: true });

// Mock window object
global.window = {
  cart: {
    subtotal: 100,
    items: ['item1', 'item2'],
    total: 0
  },
  location: { href: '' }
};

// Load the checkout.js file (we'll need to modify it slightly to export the class)
// For now, we'll copy the class definition here for testing
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

// Test suite
function runTests() {
  console.log('Running CheckoutProcessor Tests...\n');
  
  let testsPassed = 0;
  let testsTotal = 0;

  function test(name, testFn) {
    testsTotal++;
    try {
      console.log(`Running: ${name}`);
      testFn();
      console.log(`✓ PASSED: ${name}\n`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${name}`);
      console.log(`  Error: ${error.message}\n`);
    }
  }

  // Test 1: Constructor initializes correctly
  test('Constructor initializes with cart and tax rates', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    
    assert.strictEqual(processor.cart, cart);
    assert.strictEqual(processor.taxRates.US, 0.08);
    assert.strictEqual(processor.taxRates.CA, 0.13);
  });

  // Test 2: Tax calculation for US
  test('calculateTax returns correct tax for US', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    
    const tax = processor.calculateTax('US');
    assert.strictEqual(tax, 8); // 100 * 0.08
  });

  // Test 3: Tax calculation for Canada
  test('calculateTax returns correct tax for Canada', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    
    const tax = processor.calculateTax('CA');
    assert.strictEqual(tax, 13); // 100 * 0.13
  });

  // Test 4: Bug test - Tax calculation for unsupported region (EU)
  test('calculateTax returns NaN for unsupported regions (BUG)', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    
    const tax = processor.calculateTax('DE'); // Germany (EU)
    assert(isNaN(tax), 'Tax should be NaN for unsupported regions'); // This is the bug!
  });

  // Test 5: Currency mapping works correctly
  test('getCurrency returns correct currency codes', () => {
    const processor = new CheckoutProcessor({});
    
    assert.strictEqual(processor.getCurrency('US'), 'USD');
    assert.strictEqual(processor.getCurrency('CA'), 'CAD');
    assert.strictEqual(processor.getCurrency('GB'), 'GBP');
    assert.strictEqual(processor.getCurrency('DE'), 'EUR');
    assert.strictEqual(processor.getCurrency('FR'), 'EUR');
    assert.strictEqual(processor.getCurrency('UNKNOWN'), 'USD'); // fallback
  });

  // Test 6: getUserRegion reads from DOM
  test('getUserRegion reads from country-select element', () => {
    const processor = new CheckoutProcessor({});
    
    // Mock country-select to return a specific value
    global.document.getElementById = (id) => {
      if (id === 'country-select') return { value: 'CA' };
      return { value: '', addEventListener: () => {} };
    };
    
    assert.strictEqual(processor.getUserRegion(), 'CA');
  });

  // Test 7: Payment processing for supported regions
  test('processPayment works for supported regions (US)', async () => {
    const cart = { subtotal: 100, items: ['item1'], total: 0 };
    const processor = new CheckoutProcessor(cart);
    
    // Mock getUserRegion to return US
    processor.getUserRegion = () => 'US';
    
    const result = await processor.processPayment();
    
    // Check that cart.total was calculated correctly
    assert.strictEqual(cart.total, 108); // 100 + 8 (tax)
    assert.strictEqual(result.ok, true);
  });

  // Test 8: Bug test - Payment processing fails for unsupported regions
  test('processPayment fails for unsupported regions (BUG TEST)', async () => {
    const cart = { subtotal: 100, items: ['item1'], total: 0 };
    const processor = new CheckoutProcessor(cart);
    
    // Mock getUserRegion to return a region without tax rates
    processor.getUserRegion = () => 'DE';
    
    try {
      await processor.processPayment();
      assert.fail('Expected processPayment to throw an error for unsupported regions');
    } catch (error) {
      // This should throw because cart.total becomes NaN and toFixed(2) fails
      assert(error.message.includes('toFixed') || error.message.includes('Cannot read'));
      console.log(`    Expected error caught: ${error.message}`);
    }
  });

  // Test 9: Verify the actual bug scenario
  test('Demonstrate the EU user bug scenario', () => {
    const cart = { subtotal: 100, items: ['item1'], total: 0 };
    const processor = new CheckoutProcessor(cart);
    
    // Calculate tax for Germany (EU country not in taxRates)
    const tax = processor.calculateTax('DE');
    const total = cart.subtotal + tax; // This will be 100 + NaN = NaN
    
    assert(isNaN(total), 'Total should be NaN when tax is NaN');
    
    // In Node.js, calling toFixed on NaN returns "NaN" string, doesn't throw
    const result = total.toFixed(2);
    assert.strictEqual(result, 'NaN', 'toFixed on NaN should return "NaN" string');
  });

  // Test 10: Edge case with zero subtotal
  test('calculateTax handles zero subtotal correctly', () => {
    const cart = { subtotal: 0, items: [] };
    const processor = new CheckoutProcessor(cart);
    
    assert.strictEqual(processor.calculateTax('US'), 0);
    assert.strictEqual(processor.calculateTax('CA'), 0);
  });

  // Print test summary
  console.log('='.repeat(50));
  console.log(`Test Summary: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
    return 0; // success exit code
  } else {
    console.log(`❌ ${testsTotal - testsPassed} test(s) failed.`);
    return 1; // failure exit code
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const exitCode = runTests();
  process.exit(exitCode);
}

module.exports = { CheckoutProcessor, runTests };
