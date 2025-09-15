const CheckoutProcessor = require('../checkout.js');

// Simple test framework
function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

// Mock fetch for testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true, transactionId: 'test-123' })
  };
};

console.log('Running CheckoutProcessor Tests\n');

// Test data
const mockCart = {
  subtotal: 100,
  items: [
    { name: 'Product 1', price: 50 },
    { name: 'Product 2', price: 50 }
  ]
};

// Test: Constructor initialization
test('Constructor should initialize with cart and tax rates', () => {
  const processor = new CheckoutProcessor(mockCart);
  assert(processor.cart === mockCart, 'Cart should be set');
  assert(processor.taxRates.US === 0.08, 'US tax rate should be 0.08');
  assert(processor.taxRates.CA === 0.13, 'CA tax rate should be 0.13');
});

// Test: Tax calculation for supported regions
test('calculateTax should return correct tax for US', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('US');
  assertEqual(tax, 8, 'US tax should be 8 (100 * 0.08)');
});

test('calculateTax should return correct tax for CA', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('CA');
  assertEqual(tax, 13, 'CA tax should be 13 (100 * 0.13)');
});

// Test: Bug - calculateTax for unsupported regions (EU users)
test('calculateTax should handle unsupported regions (EU bug)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('DE'); // Germany - EU country
  assert(tax === undefined || isNaN(tax), 'Tax should be undefined/NaN for unsupported regions');
});

test('calculateTax should handle unsupported regions (GB)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('GB'); // Great Britain
  assert(tax === undefined || isNaN(tax), 'Tax should be undefined/NaN for unsupported regions');
});

// Test: Currency mapping
test('getCurrency should return correct currency for supported regions', () => {
  const processor = new CheckoutProcessor(mockCart);
  assertEqual(processor.getCurrency('US'), 'USD', 'US should use USD');
  assertEqual(processor.getCurrency('CA'), 'CAD', 'CA should use CAD');
  assertEqual(processor.getCurrency('GB'), 'GBP', 'GB should use GBP');
  assertEqual(processor.getCurrency('DE'), 'EUR', 'DE should use EUR');
  assertEqual(processor.getCurrency('FR'), 'EUR', 'FR should use EUR');
});

test('getCurrency should default to USD for unsupported regions', () => {
  const processor = new CheckoutProcessor(mockCart);
  assertEqual(processor.getCurrency('XX'), 'USD', 'Unknown regions should default to USD');
});

// Test: getUserRegion with testRegion
test('getUserRegion should return testRegion when set', () => {
  const processor = new CheckoutProcessor(mockCart);
  processor.testRegion = 'DE';
  assertEqual(processor.getUserRegion(), 'DE', 'Should return test region when set');
});

test('getUserRegion should default to US in Node.js environment', () => {
  const processor = new CheckoutProcessor(mockCart);
  assertEqual(processor.getUserRegion(), 'US', 'Should default to US in Node.js');
});

// Test: Payment processing - successful cases
test('processPayment should work for US region', async () => {
  const processor = new CheckoutProcessor(mockCart);
  processor.testRegion = 'US';
  
  const result = await processor.processPayment();
  assert(result.ok, 'Payment should be successful for US');
});

test('processPayment should work for CA region', async () => {
  const processor = new CheckoutProcessor(mockCart);
  processor.testRegion = 'CA';
  
  const result = await processor.processPayment();
  assert(result.ok, 'Payment should be successful for CA');
});

// Test: Payment processing - EU bug demonstration
test('processPayment should produce invalid payment data for EU regions', async () => {
  const processor = new CheckoutProcessor(mockCart);
  processor.testRegion = 'DE'; // Germany - not in taxRates
  
  // Override submitPayment to capture the payment data
  let capturedPaymentData = null;
  processor.submitPayment = async (data) => {
    capturedPaymentData = data;
    return { ok: true, json: async () => ({ success: true }) };
  };
  
  await processor.processPayment();
  
  assert(capturedPaymentData !== null, 'Payment data should be captured');
  assertEqual(capturedPaymentData.amount, 'NaN', 'Payment amount should be NaN for EU regions');
  assert(isNaN(processor.cart.total), 'Cart total should be NaN');
});

test('processPayment should produce invalid payment data for GB', async () => {
  const processor = new CheckoutProcessor(mockCart);
  processor.testRegion = 'GB'; // Great Britain - not in taxRates
  
  // Override submitPayment to capture the payment data
  let capturedPaymentData = null;
  processor.submitPayment = async (data) => {
    capturedPaymentData = data;
    return { ok: true, json: async () => ({ success: true }) };
  };
  
  await processor.processPayment();
  
  assert(capturedPaymentData !== null, 'Payment data should be captured');
  assertEqual(capturedPaymentData.amount, 'NaN', 'Payment amount should be NaN for GB');
  assert(isNaN(processor.cart.total), 'Cart total should be NaN');
});

// Test: Edge cases
test('processPayment should handle zero subtotal', async () => {
  const zeroCart = { subtotal: 0, items: [] };
  const processor = new CheckoutProcessor(zeroCart);
  processor.testRegion = 'US';
  
  const result = await processor.processPayment();
  assert(result.ok, 'Payment should work with zero subtotal');
});

console.log('\nTest Summary:');
console.log('These tests demonstrate the EU user bug where regions not in taxRates');
console.log('cause cart.total to become NaN, leading to invalid payment amounts of "NaN".');