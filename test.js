// test.js - Test suite for CheckoutProcessor
// Run with: node test

// Mock DOM elements since we're running in Node.js
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: global.mockRegion || 'US' };
    }
    return null;
  }
};

global.fetch = () => Promise.resolve({ ok: true });
global.window = { cart: null };

// Load the checkout module
const CheckoutProcessor = require('./checkout.js');

// Test framework - simple assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

// Test suite
function runTests() {
  console.log('Running CheckoutProcessor Tests...\n');
  
  let testCount = 0;
  let passedCount = 0;
  
  function test(name, testFn) {
    testCount++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedCount++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Test data
  const mockCart = {
    subtotal: 100,
    items: ['item1', 'item2'],
    total: null
  };

  // Test 1: Valid tax calculation for US
  test('Tax calculation for US region', () => {
    const processor = new CheckoutProcessor(mockCart);
    const tax = processor.calculateTax('US');
    assertEquals(tax, 8, 'US tax should be 8% of subtotal (8)');
  });

  // Test 2: Valid tax calculation for Canada
  test('Tax calculation for CA region', () => {
    const processor = new CheckoutProcessor(mockCart);
    const tax = processor.calculateTax('CA');
    assertEquals(tax, 13, 'CA tax should be 13% of subtotal (13)');
  });

  // Test 3: BUG TEST - Unsupported region (EU countries)
  test('Tax calculation for unsupported region (GB) - BUG', () => {
    const processor = new CheckoutProcessor(mockCart);
    const tax = processor.calculateTax('GB');
    assert(isNaN(tax), 'Unsupported region should return NaN - this is the bug!');
  });

  // Test 4: Currency mapping for supported regions
  test('Currency mapping for US', () => {
    const processor = new CheckoutProcessor(mockCart);
    const currency = processor.getCurrency('US');
    assertEquals(currency, 'USD', 'US should map to USD');
  });

  test('Currency mapping for GB', () => {
    const processor = new CheckoutProcessor(mockCart);
    const currency = processor.getCurrency('GB');
    assertEquals(currency, 'GBP', 'GB should map to GBP');
  });

  test('Currency mapping for unknown region defaults to USD', () => {
    const processor = new CheckoutProcessor(mockCart);
    const currency = processor.getCurrency('XY');
    assertEquals(currency, 'USD', 'Unknown region should default to USD');
  });

  // Test 5: Payment processing for supported region
  test('Payment processing for US region', () => {
    global.mockRegion = 'US';
    const cart = { ...mockCart };
    const processor = new CheckoutProcessor(cart);
    
    // This should work fine
    processor.processPayment();
    assertEquals(cart.total, 108, 'Cart total should be subtotal + tax (100 + 8 = 108)');
  });

  // Test 6: BUG TEST - Payment processing failure for EU region
  test('Payment processing for EU region (GB) - DEMONSTRATES BUG', () => {
    global.mockRegion = 'GB';
    const cart = { ...mockCart };
    const processor = new CheckoutProcessor(cart);
    
    // This will complete but create invalid payment data
    const result = processor.processPayment();
    
    // The bug: cart.total becomes NaN, resulting in "NaN" as payment amount
    assert(isNaN(cart.total), 'Cart total should be NaN due to undefined tax rate');
    
    // Simulate payment data creation to show the real issue
    const invalidAmount = cart.total.toFixed(2);
    assertEquals(invalidAmount, 'NaN', 'Payment amount becomes "NaN" string - invalid payment!');
    console.log(`    🐛 Bug: Payment will be processed with amount: "${invalidAmount}"`);
  });

  // Test 7: Edge case - Zero subtotal
  test('Tax calculation with zero subtotal', () => {
    const zeroCart = { subtotal: 0, items: [], total: null };
    const processor = new CheckoutProcessor(zeroCart);
    const tax = processor.calculateTax('US');
    assertEquals(tax, 0, 'Tax on zero subtotal should be 0');
  });

  // Test 8: Edge case - Negative subtotal
  test('Tax calculation with negative subtotal', () => {
    const negativeCart = { subtotal: -50, items: [], total: null };
    const processor = new CheckoutProcessor(negativeCart);
    const tax = processor.calculateTax('US');
    assertEquals(tax, -4, 'Tax on negative subtotal should be negative');
  });

  console.log(`\n📊 Test Results: ${passedCount}/${testCount} tests passed`);
  
  if (passedCount < testCount) {
    console.log('\n🔍 Issues found:');
    console.log('  • EU regions (GB, DE, FR) lack tax rates, causing payment failures');
    console.log('  • cart.total becomes NaN, breaking toFixed() call');
    console.log('  • This affects all EU users as mentioned in the code comments');
  }
  
  return passedCount === testCount;
}

// Run the tests
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}
