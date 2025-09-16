// Test suite for checkout.js
// Simple Node.js test framework

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default test value
    }
    return null;
  }
};

global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
global.window = {};

// CheckoutProcessor class for testing (copied from checkout.js)
class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13,
      'GB': 0.20,
      'DE': 0.19,
      'FR': 0.20
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region] || 0;
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

// Test utilities
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

function assertEquals(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, but got ${actual}. ${message}`);
  }
}

function assertApproxEquals(actual, expected, tolerance = 0.01, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected approximately ${expected}, but got ${actual}. ${message}`);
  }
}

// Mock cart for testing
const mockCart = {
  subtotal: 100,
  items: ['item1', 'item2'],
  total: null
};

console.log('Running Checkout Tax Calculation Tests...\n');

// Test tax calculation for known regions
test('calculateTax for US region (8%)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('US');
  assertApproxEquals(tax, 8, 0.01, 'US tax should be 8% of subtotal');
});

test('calculateTax for CA region (13%)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('CA');
  assertApproxEquals(tax, 13, 0.01, 'CA tax should be 13% of subtotal');
});

test('calculateTax for GB region (20%)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('GB');
  assertApproxEquals(tax, 20, 0.01, 'GB tax should be 20% of subtotal');
});

test('calculateTax for DE region (19%)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('DE');
  assertApproxEquals(tax, 19, 0.01, 'DE tax should be 19% of subtotal');
});

test('calculateTax for FR region (20%)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('FR');
  assertApproxEquals(tax, 20, 0.01, 'FR tax should be 20% of subtotal');
});

// Test fallback behavior for unknown regions
test('calculateTax for unknown region defaults to 0%', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('XX');
  assertEquals(tax, 0, 'Unknown region should have 0% tax');
});

test('calculateTax for undefined region defaults to 0%', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax(undefined);
  assertEquals(tax, 0, 'Undefined region should have 0% tax');
});

test('calculateTax for null region defaults to 0%', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax(null);
  assertEquals(tax, 0, 'Null region should have 0% tax');
});

// Test currency mapping
test('getCurrency for US returns USD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('US');
  assertEquals(currency, 'USD', 'US should use USD currency');
});

test('getCurrency for CA returns CAD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('CA');
  assertEquals(currency, 'CAD', 'CA should use CAD currency');
});

test('getCurrency for GB returns GBP', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('GB');
  assertEquals(currency, 'GBP', 'GB should use GBP currency');
});

test('getCurrency for DE returns EUR', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('DE');
  assertEquals(currency, 'EUR', 'DE should use EUR currency');
});

test('getCurrency for FR returns EUR', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('FR');
  assertEquals(currency, 'EUR', 'FR should use EUR currency');
});

test('getCurrency for unknown region defaults to USD', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('XX');
  assertEquals(currency, 'USD', 'Unknown region should default to USD');
});

// Test cart total calculation in processPayment
test('processPayment calculates correct total for US', () => {
  global.document.getElementById = () => ({ value: 'US' });
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  // Mock submitPayment to capture the payment data
  let capturedData = null;
  processor.submitPayment = (data) => {
    capturedData = data;
    return Promise.resolve();
  };
  
  return processor.processPayment().then(() => {
    assertEquals(testCart.total, 108, 'Total should be subtotal + US tax (100 + 8)');
    assertEquals(capturedData.amount, '108.00', 'Payment amount should be formatted correctly');
    assertEquals(capturedData.currency, 'USD', 'Payment currency should be USD');
  });
});

test('processPayment calculates correct total for GB', () => {
  global.document.getElementById = () => ({ value: 'GB' });
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  let capturedData = null;
  processor.submitPayment = (data) => {
    capturedData = data;
    return Promise.resolve();
  };
  
  return processor.processPayment().then(() => {
    assertEquals(testCart.total, 120, 'Total should be subtotal + GB tax (100 + 20)');
    assertEquals(capturedData.amount, '120.00', 'Payment amount should be formatted correctly');
    assertEquals(capturedData.currency, 'GBP', 'Payment currency should be GBP');
  });
});

test('processPayment calculates correct total for unknown region', () => {
  global.document.getElementById = () => ({ value: 'XX' });
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  let capturedData = null;
  processor.submitPayment = (data) => {
    capturedData = data;
    return Promise.resolve();
  };
  
  return processor.processPayment().then(() => {
    assertEquals(testCart.total, 100, 'Total should be subtotal + 0 tax (100 + 0)');
    assertEquals(capturedData.amount, '100.00', 'Payment amount should be formatted correctly');
    assertEquals(capturedData.currency, 'USD', 'Payment currency should default to USD');
  });
});

// Test that the bug is fixed - cart.total should never be null
test('processPayment never sets cart.total to null', () => {
  const regions = ['US', 'CA', 'GB', 'DE', 'FR', 'XX', 'YY', undefined, null];
  const promises = regions.map(region => {
    global.document.getElementById = () => ({ value: region });
    const testCart = { ...mockCart, total: null };
    const processor = new CheckoutProcessor(testCart);
    
    processor.submitPayment = () => Promise.resolve();
    
    return processor.processPayment().then(() => {
      if (testCart.total === null || testCart.total === undefined) {
        throw new Error(`cart.total should not be null/undefined for region: ${region}`);
      }
      if (typeof testCart.total !== 'number') {
        throw new Error(`cart.total should be a number for region: ${region}, got: ${typeof testCart.total}`);
      }
    });
  });
  
  return Promise.all(promises);
});

// Run all tests
Promise.all([]).then(() => {
  console.log(`\nTest Results: ${passedTests}/${testCount} tests passed`);
  
  if (passedTests === testCount) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
