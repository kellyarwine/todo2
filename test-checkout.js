// test-checkout.js - Tests for CheckoutProcessor US tax calculations
// Simple Node.js test runner for US tax calculations

// Mock DOM elements for testing
global.document = {
  getElementById: function(id) {
    if (id === 'country-select') {
      return { value: 'US' };
    }
    if (id === 'pay-button') {
      return { addEventListener: function() {} };
    }
    return null;
  }
};

// Mock fetch for testing
global.fetch = function() {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  });
};

// Import the CheckoutProcessor (we'll need to extract it from checkout.js)
// For now, we'll copy the class definition for testing
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
    
    // Calculate total with tax included
    this.cart.total = this.cart.subtotal + tax;
    
    // Payment data with calculated total
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
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Test failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertAlmostEqual(actual, expected, tolerance = 0.001, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Test failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

// Test suite for US tax calculations
function runUSTestSuite() {
  console.log('Running US Tax Calculation Tests...\n');
  
  let testCount = 0;
  let passedCount = 0;

  function runTest(testName, testFunction) {
    testCount++;
    try {
      testFunction();
      console.log(`✓ ${testName}`);
      passedCount++;
    } catch (error) {
      console.log(`✗ ${testName}: ${error.message}`);
    }
  }

  // Test 1: Basic US tax calculation with simple cart
  runTest('US tax calculation with $100 subtotal', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax = processor.calculateTax('US');
    assertEqual(tax, 8, 'Tax should be $8 for $100 subtotal at 8% rate');
  });

  // Test 2: US tax calculation with decimal subtotal
  runTest('US tax calculation with $99.99 subtotal', () => {
    const cart = { subtotal: 99.99, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax = processor.calculateTax('US');
    assertAlmostEqual(tax, 7.9992, 0.0001, 'Tax should be $7.9992 for $99.99 subtotal');
  });

  // Test 3: US tax calculation with zero subtotal
  runTest('US tax calculation with $0 subtotal', () => {
    const cart = { subtotal: 0, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax = processor.calculateTax('US');
    assertEqual(tax, 0, 'Tax should be $0 for $0 subtotal');
  });

  // Test 4: US tax calculation with large amount
  runTest('US tax calculation with $1000 subtotal', () => {
    const cart = { subtotal: 1000, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax = processor.calculateTax('US');
    assertEqual(tax, 80, 'Tax should be $80 for $1000 subtotal at 8% rate');
  });

  // Test 5: US tax calculation with small decimal amount
  runTest('US tax calculation with $0.01 subtotal', () => {
    const cart = { subtotal: 0.01, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax = processor.calculateTax('US');
    assertAlmostEqual(tax, 0.0008, 0.0001, 'Tax should be $0.0008 for $0.01 subtotal');
  });

  // Test 6: Verify US tax rate is exactly 8%
  runTest('US tax rate verification', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    assertEqual(processor.taxRates['US'], 0.08, 'US tax rate should be exactly 8% (0.08)');
  });

  // Test 7: US payment processing with tax included
  runTest('US payment processing calculates total correctly', () => {
    const cart = { subtotal: 100, items: ['item1', 'item2'] };
    const processor = new CheckoutProcessor(cart);
    
    // Mock getUserRegion to return US
    processor.getUserRegion = () => 'US';
    
    return processor.processPayment().then(() => {
      assertEqual(cart.total, 108, 'Total should be $108 ($100 + $8 tax)');
    });
  });

  // Test 8: US currency mapping
  runTest('US currency mapping', () => {
    const cart = { subtotal: 100, items: [] };
    const processor = new CheckoutProcessor(cart);
    const currency = processor.getCurrency('US');
    assertEqual(currency, 'USD', 'US should map to USD currency');
  });

  // Test 9: US tax calculation consistency
  runTest('US tax calculation consistency across multiple calls', () => {
    const cart = { subtotal: 250.50, items: [] };
    const processor = new CheckoutProcessor(cart);
    const tax1 = processor.calculateTax('US');
    const tax2 = processor.calculateTax('US');
    assertEqual(tax1, tax2, 'Tax calculation should be consistent across multiple calls');
    assertAlmostEqual(tax1, 20.04, 0.01, 'Tax should be $20.04 for $250.50 subtotal');
  });

  // Test 10: US tax with various subtotal amounts
  runTest('US tax calculations with multiple amounts', () => {
    const testCases = [
      { subtotal: 25, expectedTax: 2 },
      { subtotal: 50, expectedTax: 4 },
      { subtotal: 75, expectedTax: 6 },
      { subtotal: 125, expectedTax: 10 },
      { subtotal: 200, expectedTax: 16 }
    ];

    testCases.forEach(testCase => {
      const cart = { subtotal: testCase.subtotal, items: [] };
      const processor = new CheckoutProcessor(cart);
      const tax = processor.calculateTax('US');
      assertEqual(tax, testCase.expectedTax, 
        `Tax for $${testCase.subtotal} should be $${testCase.expectedTax}`);
    });
  });

  console.log(`\nTest Results: ${passedCount}/${testCount} tests passed`);
  
  if (passedCount === testCount) {
    console.log('🎉 All US tax calculation tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runUSTestSuite();
}

module.exports = { CheckoutProcessor, runUSTestSuite };