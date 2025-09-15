// Simple test runner for checkout.js tests
const CheckoutProcessor = require('./checkout-processor');

// Mock DOM elements and global objects needed for checkout.js
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: global.mockRegion || 'US' };
    }
    if (id === 'pay-button') {
      return { addEventListener: () => {} };
    }
    return null;
  }
};

global.window = {
  cart: global.mockCart || { subtotal: 100, items: [], total: 0 },
  location: { href: '' }
};

global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true })
  };
};



// Test framework
let testCount = 0;
let passCount = 0;

function test(description, testFn) {
  testCount++;
  try {
    testFn();
    console.log(`✓ ${description}`);
    passCount++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision);
      if (diff > tolerance) {
        throw new Error(`Expected ${actual} to be close to ${expected} within ${tolerance}`);
      }
    },
    toThrow: () => {
      let thrown = false;
      try {
        if (typeof actual === 'function') {
          actual();
        }
      } catch (e) {
        thrown = true;
      }
      if (!thrown) {
        throw new Error('Expected function to throw');
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, but got ${actual}`);
      }
    },
    toBeNaN: () => {
      if (!Number.isNaN(actual)) {
        throw new Error(`Expected NaN, but got ${actual}`);
      }
    }
  };
}

// Run tests
console.log('Running CheckoutProcessor tests...\n');

// Test suite for CheckoutProcessor
test('should calculate tax correctly for US', () => {
  const cart = { subtotal: 100, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('US');
  expect(tax).toBe(8);
});

test('should calculate tax correctly for CA', () => {
  const cart = { subtotal: 100, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('CA');
  expect(tax).toBe(13);
});

test('should return NaN for regions not in taxRates (THIS IS THE BUG)', () => {
  const cart = { subtotal: 100, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('DE');
  expect(tax).toBeNaN();
});

test('should return correct currency for supported regions', () => {
  const cart = { subtotal: 100, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  expect(processor.getCurrency('US')).toBe('USD');
  expect(processor.getCurrency('CA')).toBe('CAD');
  expect(processor.getCurrency('GB')).toBe('GBP');
  expect(processor.getCurrency('DE')).toBe('EUR');
  expect(processor.getCurrency('FR')).toBe('EUR');
});

test('should return USD as default currency for unknown regions', () => {
  const cart = { subtotal: 100, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  expect(processor.getCurrency('XX')).toBe('USD');
});

test('should process payment successfully for US region', () => {
  const cart = { subtotal: 100, items: ['item1'], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  global.mockRegion = 'US';
  
  const result = processor.processPayment();
  expect(cart.total).toBe(108); // 100 + 8% tax
});

test('should process payment successfully for CA region', () => {
  const cart = { subtotal: 100, items: ['item1'], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  global.mockRegion = 'CA';
  
  const result = processor.processPayment();
  expect(cart.total).toBe(113); // 100 + 13% tax
});

test('should create invalid payment data for EU region due to NaN tax (BUG DEMONSTRATION)', () => {
  const cart = { subtotal: 100, items: ['item1'], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  global.mockRegion = 'DE';
  
  // This doesn't throw immediately, but creates invalid payment data
  processor.processPayment();
  expect(cart.total).toBeNaN();
});

test('should fail when trying to format NaN total as currency (the actual failure point)', () => {
  const cart = { subtotal: 100, items: ['item1'], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  global.mockRegion = 'DE';
  
  // Mock fetch to track what gets sent
  let paymentDataSent = null;
  global.fetch = async (url, options) => {
    paymentDataSent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true }) };
  };
  
  processor.processPayment();
  
  // The payment data will have "NaN" as the amount string
  expect(paymentDataSent.amount).toBe("NaN");
  expect(paymentDataSent.currency).toBe("EUR");
});

test('should set cart.total to NaN for regions without tax rates', () => {
  const cart = { subtotal: 100, items: ['item1'], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  global.mockRegion = 'DE';
  
  try {
    processor.processPayment();
  } catch (e) {
    // Expected to throw, but let's check cart.total
    expect(cart.total).toBeNaN();
  }
});

test('should handle zero subtotal correctly', () => {
  const cart = { subtotal: 0, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  const taxUS = processor.calculateTax('US');
  const taxCA = processor.calculateTax('CA');
  
  expect(taxUS).toBe(0);
  expect(taxCA).toBe(0);
});

test('should handle negative subtotal', () => {
  const cart = { subtotal: -50, items: [], total: 0 };
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('US');
  expect(tax).toBe(-4); // -50 * 0.08
});

// Summary
console.log(`\nTest Results: ${passCount}/${testCount} tests passed`);

console.log('\n🐛 BUG SUMMARY:');
console.log('The CheckoutProcessor has a critical bug where regions not in taxRates');
console.log('(like DE, FR, GB, etc.) cause calculateTax() to return NaN.');
console.log('This results in cart.total becoming NaN, which then gets formatted');
console.log('as "NaN" in the payment amount, causing payment failures for EU users.');

if (passCount === testCount) {
  console.log('\n✅ All tests passed - the bug is successfully demonstrated!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}