// Test file for CheckoutProcessor
// Run with: node checkout-comprehensive.test.js

// Mock DOM elements for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default test value
    }
    return null;
  }
};

// Mock fetch function
global.fetch = () => Promise.resolve({ ok: true });

// Import the class (we'll need to modify checkout.js to export it)
// For now, we'll copy the class definition for testing

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
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running CheckoutProcessor Tests...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      console.log('\n⚠️  Some tests revealed bugs in the checkout system!');
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} Expected: ${expected}, Got: ${actual}`);
    }
  }

  assertThrows(fn, message = '') {
    try {
      fn();
      throw new Error(`${message} Expected function to throw an error`);
    } catch (error) {
      if (error.message.includes('Expected function to throw')) {
        throw error;
      }
      // Expected to throw - test passes
    }
  }

  assertNaN(value, message = '') {
    if (!isNaN(value)) {
      throw new Error(`${message} Expected NaN, got: ${value}`);
    }
  }
}

const runner = new TestRunner();

// ========== Currency Tests ==========
runner.test('getCurrency: US -> USD', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('US');
  runner.assertEqual(currency, 'USD');
});

runner.test('getCurrency: CA -> CAD', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('CA');
  runner.assertEqual(currency, 'CAD');
});

runner.test('getCurrency: GB -> GBP', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('GB');
  runner.assertEqual(currency, 'GBP');
});

runner.test('getCurrency: DE -> EUR', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('DE');
  runner.assertEqual(currency, 'EUR');
});

runner.test('getCurrency: FR -> EUR', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('FR');
  runner.assertEqual(currency, 'EUR');
});

runner.test('getCurrency: Unknown region defaults to USD', () => {
  const processor = new CheckoutProcessor({});
  const currency = processor.getCurrency('UNKNOWN');
  runner.assertEqual(currency, 'USD');
});

// ========== Tax Calculation Tests ==========
runner.test('calculateTax: US region (8%)', () => {
  const cart = { subtotal: 100 };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('US');
  runner.assertEqual(tax, 8);
});

runner.test('calculateTax: CA region (13%)', () => {
  const cart = { subtotal: 100 };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('CA');
  runner.assertEqual(tax, 13);
});

runner.test('calculateTax: DE region - No tax rate defined (BUG)', () => {
  const cart = { subtotal: 100 };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('DE');
  runner.assertNaN(tax, 'Tax should be NaN for regions without defined tax rates');
});

runner.test('calculateTax: GB region - No tax rate defined (BUG)', () => {
  const cart = { subtotal: 100 };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('GB');
  runner.assertNaN(tax, 'Tax should be NaN for regions without defined tax rates');
});

runner.test('calculateTax: Zero subtotal', () => {
  const cart = { subtotal: 0 };
  const processor = new CheckoutProcessor(cart);
  const tax = processor.calculateTax('US');
  runner.assertEqual(tax, 0);
});

// ========== Payment Processing Tests ==========
runner.test('processPayment: US region works correctly', () => {
  // Mock document for this test
  global.document.getElementById = () => ({ value: 'US' });
  
  const cart = { subtotal: 100, items: ['item1', 'item2'] };
  const processor = new CheckoutProcessor(cart);
  
  processor.processPayment();
  runner.assertEqual(cart.total, 108, 'Cart total should be 108 (100 + 8% tax)');
});

runner.test('processPayment: CA region works correctly', () => {
  // Mock document for this test
  global.document.getElementById = () => ({ value: 'CA' });
  
  const cart = { subtotal: 200, items: ['item1'] };
  const processor = new CheckoutProcessor(cart);
  
  processor.processPayment();
  runner.assertEqual(cart.total, 226, 'Cart total should be 226 (200 + 13% tax)');
});

runner.test('processPayment: DE region fails (BUG - NaN total)', () => {
  // Mock document for this test
  global.document.getElementById = () => ({ value: 'DE' });
  
  const cart = { subtotal: 100, items: ['item1'] };
  const processor = new CheckoutProcessor(cart);
  
  // This should expose the bug - cart.total becomes NaN
  let errorCaught = false;
  try {
    processor.processPayment();
  } catch (error) {
    errorCaught = true;
    runner.assertEqual(error.message.includes('toFixed'), true, 
      'Should throw toFixed error due to NaN');
  }
  
  if (!errorCaught) {
    // Check if cart.total is NaN (the actual bug)
    runner.assertNaN(cart.total, 'Cart total should be NaN for DE region');
  }
});

runner.test('processPayment: GB region fails (BUG - NaN total)', () => {
  // Mock document for this test
  global.document.getElementById = () => ({ value: 'GB' });
  
  const cart = { subtotal: 150, items: ['product1', 'product2'] };
  const processor = new CheckoutProcessor(cart);
  
  // This should expose the bug - cart.total becomes NaN
  let errorCaught = false;
  try {
    processor.processPayment();
  } catch (error) {
    errorCaught = true;
    runner.assertEqual(error.message.includes('toFixed'), true, 
      'Should throw toFixed error due to NaN');
  }
  
  if (!errorCaught) {
    // Check if cart.total is NaN (the actual bug)
    runner.assertNaN(cart.total, 'Cart total should be NaN for GB region');
  }
});

// ========== Edge Cases ==========
runner.test('Constructor: Cart is properly assigned', () => {
  const cart = { subtotal: 50, items: ['test'] };
  const processor = new CheckoutProcessor(cart);
  runner.assertEqual(processor.cart, cart);
});

runner.test('Tax rates: US and CA are defined correctly', () => {
  const processor = new CheckoutProcessor({});
  runner.assertEqual(processor.taxRates.US, 0.08);
  runner.assertEqual(processor.taxRates.CA, 0.13);
});

// Run all tests
runner.run().then(() => {
  console.log('\n🔍 Summary:');
  console.log('This test suite reveals a critical bug in the CheckoutProcessor:');
  console.log('- EU users (DE, GB, etc.) cannot complete payments');
  console.log('- The calculateTax() method returns NaN for undefined regions');
  console.log('- NaN.toFixed(2) throws an error, breaking the payment flow');
  console.log('\n💡 To fix: Add proper handling for regions without tax rates');
});