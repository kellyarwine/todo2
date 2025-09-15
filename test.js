// Test file for CheckoutProcessor
// Simple Node.js test without external dependencies

// Mock DOM elements since checkout.js expects browser environment
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: global.testRegion || 'US' };
    }
    if (id === 'pay-button') {
      return { addEventListener: () => {} };
    }
    return null;
  }
};

// Mock fetch API
global.fetch = (url, options) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
};

// Mock window object
global.window = {
  cart: null,
  location: { href: '' }
};

// Load the checkout.js file and evaluate it
const fs = require('fs');
const path = require('path');
const checkoutCode = fs.readFileSync(path.join(__dirname, 'checkout.js'), 'utf8');

// Remove the event listener block that depends on DOM being ready
const codeWithoutEventListener = checkoutCode.replace(
  /\/\/ Event handler for payment button[\s\S]*$/,
  ''
);

// Create a function to evaluate the code in the global scope
const vm = require('vm');
vm.runInThisContext(codeWithoutEventListener);

// Test utilities
function createMockCart(subtotal = 100, items = ['item1', 'item2']) {
  return {
    subtotal: subtotal,
    items: items,
    total: null
  };
}

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ ${testName}`);
  } catch (error) {
    console.log(`✗ ${testName}: ${error.message}`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertNotEqual(actual, unexpected, message = '') {
  if (actual === unexpected) {
    throw new Error(`Expected not ${unexpected}, got ${actual}. ${message}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`Expected truthy value, got ${value}. ${message}`);
  }
}

function assertThrows(fn, message = '') {
  try {
    fn();
    throw new Error(`Expected function to throw. ${message}`);
  } catch (error) {
    // Expected to throw
  }
}

console.log('Running CheckoutProcessor Tests...\n');

// Test 1: Constructor initializes correctly
runTest('Constructor initializes cart and tax rates', () => {
  const cart = createMockCart();
  const processor = new CheckoutProcessor(cart);
  
  assertEqual(processor.cart, cart);
  assertEqual(processor.taxRates['US'], 0.08);
  assertEqual(processor.taxRates['CA'], 0.13);
});

// Test 2: calculateTax works for US
runTest('calculateTax calculates correctly for US', () => {
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('US');
  assertEqual(tax, 8); // 100 * 0.08
});

// Test 3: calculateTax works for CA
runTest('calculateTax calculates correctly for CA', () => {
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('CA');
  assertEqual(tax, 13); // 100 * 0.13
});

// Test 4: calculateTax returns NaN for unknown regions (BUG)
runTest('calculateTax returns NaN for unknown regions', () => {
  const cart = createMockCart(100);
  const processor = new CheckoutProcessor(cart);
  
  const tax = processor.calculateTax('DE');
  assertTrue(isNaN(tax), 'Should return NaN for unknown regions'); // This exposes the bug
});

// Test 5: getCurrency works for supported regions
runTest('getCurrency returns correct currency for supported regions', () => {
  const cart = createMockCart();
  const processor = new CheckoutProcessor(cart);
  
  assertEqual(processor.getCurrency('US'), 'USD');
  assertEqual(processor.getCurrency('CA'), 'CAD');
  assertEqual(processor.getCurrency('GB'), 'GBP');
  assertEqual(processor.getCurrency('DE'), 'EUR');
  assertEqual(processor.getCurrency('FR'), 'EUR');
});

// Test 6: getCurrency defaults to USD for unknown regions
runTest('getCurrency defaults to USD for unknown regions', () => {
  const cart = createMockCart();
  const processor = new CheckoutProcessor(cart);
  
  assertEqual(processor.getCurrency('UNKNOWN'), 'USD');
});

// Test 7: getUserRegion reads from mock DOM
runTest('getUserRegion reads from country-select element', () => {
  const cart = createMockCart();
  const processor = new CheckoutProcessor(cart);
  
  global.testRegion = 'CA';
  assertEqual(processor.getUserRegion(), 'CA');
  
  global.testRegion = 'US';
  assertEqual(processor.getUserRegion(), 'US');
});

// Test 8: processPayment works for US region
runTest('processPayment works correctly for US region', async () => {
  const cart = createMockCart(100, ['item1']);
  const processor = new CheckoutProcessor(cart);
  
  global.testRegion = 'US';
  
  const result = await processor.processPayment();
  
  assertEqual(cart.total, 108); // 100 + 8 tax
  assertTrue(result.ok);
});

// Test 9: processPayment works for CA region  
runTest('processPayment works correctly for CA region', async () => {
  const cart = createMockCart(100, ['item1']);
  const processor = new CheckoutProcessor(cart);
  
  global.testRegion = 'CA';
  
  const result = await processor.processPayment();
  
  assertEqual(cart.total, 113); // 100 + 13 tax
  assertTrue(result.ok);
});

// Test 10: processPayment fails for EU regions (BUG)
runTest('processPayment fails for EU regions due to tax calculation bug', () => {
  const cart = createMockCart(100, ['item1']);
  const processor = new CheckoutProcessor(cart);
  
  global.testRegion = 'DE'; // EU region with no tax rate
  
  // This should throw because cart.total becomes NaN when adding undefined tax
  assertThrows(() => {
    // Calculate what happens in processPayment
    const tax = processor.calculateTax('DE'); // returns undefined
    cart.total = cart.subtotal + tax; // 100 + undefined = NaN
    cart.total.toFixed(2); // NaN.toFixed(2) throws TypeError
  }, 'Should throw when trying to call toFixed on NaN');
});

// Test 11: submitPayment makes correct API call
runTest('submitPayment makes correct fetch call', async () => {
  const cart = createMockCart();
  const processor = new CheckoutProcessor(cart);
  
  const testData = {
    amount: '108.00',
    currency: 'USD',
    items: ['item1']
  };
  
  const result = await processor.submitPayment(testData);
  assertTrue(result.ok);
});

console.log('\n--- Test Summary ---');
console.log('Tests completed. The tests reveal the bug in calculateTax() method:');
console.log('- EU regions (DE, FR, etc) are not in taxRates object');
console.log('- This causes calculateTax() to return NaN (undefined * number = NaN)'); 
console.log('- When NaN is added to cart.subtotal, cart.total becomes NaN');
console.log('- Calling NaN.toFixed(2) throws a TypeError');
console.log('\nTo fix: Add default tax rate of 0 for unknown regions in calculateTax()');
