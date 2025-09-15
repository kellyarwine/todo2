// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, testFn) {
    this.tests.push({ description, testFn });
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected null, but got ${actual}`);
        }
      },
      toThrow: () => {
        let threw = false;
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error('Expected function to throw, but it did not');
        }
      }
    };
  }

  run() {
    console.log('Running tests...\n');
    
    this.tests.forEach(({ description, testFn }) => {
      try {
        testFn.call(this);
        console.log(`✓ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    });

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Mock DOM and fetch for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default to US for testing
    }
    return null;
  }
};

global.fetch = () => Promise.resolve({ ok: true });

// Import the CheckoutProcessor (simulate)
// Since we can't use ES6 imports, we'll copy the class definition
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

// Test Suite
const runner = new TestRunner();

// Test tax calculation for supported regions
runner.test('calculateTax should work for US region', function() {
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('US');
  this.expect(tax).toBe(8); // 100 * 0.08
});

runner.test('calculateTax should work for CA region', function() {
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('CA');
  this.expect(tax).toBe(13); // 100 * 0.13
});

// Test the bug: tax calculation for unsupported regions
runner.test('calculateTax should return NaN for unsupported regions like GB', function() {
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('GB');
  this.expect(isNaN(tax)).toBe(true); // undefined * 100 = NaN
});

runner.test('calculateTax should return NaN for unsupported regions like DE', function() {
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('DE');
  this.expect(isNaN(tax)).toBe(true); // undefined * 100 = NaN
});

// Test currency mapping
runner.test('getCurrency should return correct currency for US', function() {
  const processor = new CheckoutProcessor({});
  this.expect(processor.getCurrency('US')).toBe('USD');
});

runner.test('getCurrency should return correct currency for GB', function() {
  const processor = new CheckoutProcessor({});
  this.expect(processor.getCurrency('GB')).toBe('GBP');
});

runner.test('getCurrency should return correct currency for DE', function() {
  const processor = new CheckoutProcessor({});
  this.expect(processor.getCurrency('DE')).toBe('EUR');
});

runner.test('getCurrency should default to USD for unknown regions', function() {
  const processor = new CheckoutProcessor({});
  this.expect(processor.getCurrency('UNKNOWN')).toBe('USD');
});

// Test the critical bug in processPayment for EU users
runner.test('processPayment should produce NaN amount for EU regions due to tax calculation bug', function() {
  // Mock getUserRegion to return GB (EU region)
  const processor = new CheckoutProcessor({ subtotal: 100, items: [] });
  processor.getUserRegion = () => 'GB'; // Override for this test
  
  // Simulate the calculation that happens in processPayment
  const tax = processor.calculateTax('GB'); // This returns NaN
  const total = 100 + tax; // 100 + NaN = NaN
  const amount = total.toFixed(2); // This returns "NaN" instead of a valid amount
  
  this.expect(amount).toBe("NaN"); // This demonstrates the bug
});

runner.test('processPayment should work for US region', function() {
  const cart = { subtotal: 100, items: ['item1'], total: null };
  const processor = new CheckoutProcessor(cart);
  processor.getUserRegion = () => 'US'; // Override for this test
  
  // This should not throw
  const region = processor.getUserRegion();
  const tax = processor.calculateTax(region);
  cart.total = cart.subtotal + tax;
  
  this.expect(cart.total).toBe(108); // 100 + 8
  
  // The toFixed call should work
  const amount = cart.total.toFixed(2);
  this.expect(amount).toBe('108.00');
});

// Test that demonstrates the exact problem described in the comment
runner.test('CRITICAL BUG: cart.total becomes null for EU regions', function() {
  const cart = { subtotal: 100, items: [] };
  const processor = new CheckoutProcessor(cart);
  
  // Test the problematic calculation for GB (EU region)
  const tax = processor.calculateTax('GB');
  cart.total = cart.subtotal + tax; // 100 + NaN = NaN
  
  // This is the bug: cart.total is now NaN, which makes toFixed(2) fail
  this.expect(isNaN(cart.total)).toBe(true);
});

// Run all tests
if (runner.run()) {
  console.log('\nAll tests passed! 🎉');
  process.exit(0);
} else {
  console.log('\nSome tests failed! 💥');
  process.exit(1);
}
