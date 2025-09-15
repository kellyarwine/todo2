// Simple test runner
const assert = require('assert');

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default test value
    }
    if (id === 'pay-button') {
      return { addEventListener: () => {} };
    }
    return null;
  }
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  // Capture the payment data for inspection
  const paymentData = JSON.parse(options.body);
  global.lastPaymentData = paymentData;
  
  return {
    ok: true,
    json: async () => ({ success: true, transactionId: 'test123' })
  };
};

// Import the checkout processor
// Since checkout.js has DOM event listeners, we need to modify it for testing
// For now, we'll extract the class definition

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

// Test runner
async function runTests() {
  console.log('Running tests for CheckoutProcessor...\n');
  
  let passed = 0;
  let failed = 0;
  
  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      failed++;
    }
  }

  // Test data
  const mockCart = {
    subtotal: 100,
    items: ['item1', 'item2'],
    total: null
  };

  // Test 1: Tax calculation for US
  test('Tax calculation for US (8%)', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const tax = processor.calculateTax('US');
    assert.strictEqual(tax, 8, 'US tax should be 8% of subtotal');
  });

  // Test 2: Tax calculation for Canada
  test('Tax calculation for CA (13%)', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const tax = processor.calculateTax('CA');
    assert.strictEqual(tax, 13, 'CA tax should be 13% of subtotal');
  });

  // Test 3: Tax calculation for unsupported region (this will expose the bug)
  test('Tax calculation for unsupported region (DE)', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const tax = processor.calculateTax('DE');
    // This will be NaN because taxRates['DE'] is undefined
    assert.ok(isNaN(tax), 'Tax should be NaN for unsupported region');
  });

  // Test 4: Currency mapping for US
  test('Currency mapping for US', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const currency = processor.getCurrency('US');
    assert.strictEqual(currency, 'USD', 'US currency should be USD');
  });

  // Test 5: Currency mapping for Germany
  test('Currency mapping for DE', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const currency = processor.getCurrency('DE');
    assert.strictEqual(currency, 'EUR', 'DE currency should be EUR');
  });

  // Test 6: Currency mapping for unknown region
  test('Currency mapping for unknown region', () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    const currency = processor.getCurrency('XX');
    assert.strictEqual(currency, 'USD', 'Unknown region should default to USD');
  });

  // Test 7: Payment processing with US region (should work)
  await test('Payment processing for US region', async () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    // Mock getUserRegion to return 'US'
    processor.getUserRegion = () => 'US';
    
    try {
      await processor.processPayment();
      // If we get here, payment processed successfully
      assert.ok(true, 'Payment should process successfully for US');
    } catch (error) {
      assert.fail('Payment processing should not fail for US');
    }
  });

  // Test 8: Payment processing with unsupported region (this will expose the bug)
  await test('Payment processing for DE region (demonstrates bug)', async () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    // Mock getUserRegion to return 'DE'
    processor.getUserRegion = () => 'DE';
    
    await processor.processPayment();
    
    // The bug: payment goes through with amount: "NaN"
    assert.ok(isNaN(processor.cart.total), 'Cart total should be NaN for unsupported region');
    assert.strictEqual(global.lastPaymentData.amount, 'NaN', 'Payment amount should be "NaN" string');
    
    console.log('      ⚠️  Bug detected: Payment processed with amount "NaN"!');
    console.log('      📊 Payment data:', global.lastPaymentData);
  });

  // Test 9: Validate payment data for supported region
  await test('Payment data validation for US region', async () => {
    const processor = new CheckoutProcessor({ ...mockCart });
    processor.getUserRegion = () => 'US';
    
    await processor.processPayment();
    
    assert.strictEqual(global.lastPaymentData.amount, '108.00', 'US payment amount should be correct');
    assert.strictEqual(global.lastPaymentData.currency, 'USD', 'US currency should be USD');
    console.log('      ✅ Valid payment data:', global.lastPaymentData);
  });

  // Test 10: Cart total calculation for supported region
  await test('Cart total calculation for supported region', () => {
    const cart = { ...mockCart };
    const processor = new CheckoutProcessor(cart);
    processor.getUserRegion = () => 'CA';
    
    // Simulate the calculation that happens in processPayment
    const region = 'CA';
    const tax = processor.calculateTax(region);
    cart.total = cart.subtotal + tax;
    
    assert.strictEqual(cart.total, 113, 'Cart total should be subtotal + tax');
  });

  // Test 11: Cart total calculation for unsupported region (demonstrates bug)
  await test('Cart total calculation for unsupported region (demonstrates bug)', () => {
    const cart = { ...mockCart };
    const processor = new CheckoutProcessor(cart);
    
    const region = 'DE';
    const tax = processor.calculateTax(region);
    cart.total = cart.subtotal + tax;
    
    assert.ok(isNaN(cart.total), 'Cart total should be NaN for unsupported region');
    console.log('      ⚠️  Bug: Cart total becomes NaN for region:', region);
  });

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed, indicating bugs in the checkout processor!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run the tests
runTests().catch(console.error);
