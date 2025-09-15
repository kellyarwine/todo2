// checkout.test.js - Comprehensive test suite for CheckoutProcessor
// Tests normal functionality and edge cases including the EU bug

// Mock DOM elements and global objects for testing
const mockDOM = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: mockDOM.selectedCountry || 'US' };
    }
    return null;
  },
  selectedCountry: 'US'
};

const mockFetch = (url, options) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
};

// Set up global mocks
global.document = mockDOM;
global.fetch = mockFetch;

// Import the CheckoutProcessor class (we'll need to modify checkout.js slightly for this to work)
// For now, we'll copy the class definition
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

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertThrows(fn, message) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(`Assertion failed: ${message}. Expected function to throw.`);
  }
}

// Test data
const mockCart = {
  subtotal: 100,
  items: [
    { id: 1, name: 'Test Item', price: 100 }
  ]
};

// Test suite
async function runTests() {
  console.log('🧪 Running CheckoutProcessor Test Suite...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Tax calculation for US
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const tax = processor.calculateTax('US');
    assertEqual(tax, 8, 'US tax calculation (8% of $100)');
    console.log('✅ Test 1 passed: US tax calculation');
    passed++;
  } catch (e) {
    console.log('❌ Test 1 failed:', e.message);
    failed++;
  }

  // Test 2: Tax calculation for Canada
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const tax = processor.calculateTax('CA');
    assertEqual(tax, 13, 'Canada tax calculation (13% of $100)');
    console.log('✅ Test 2 passed: Canada tax calculation');
    passed++;
  } catch (e) {
    console.log('❌ Test 2 failed:', e.message);
    failed++;
  }

  // Test 3: Tax calculation for unknown region (EU bug)
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const tax = processor.calculateTax('DE'); // Germany - not in taxRates
    // This should return NaN because rate is undefined
    assert(isNaN(tax), 'Tax calculation for unknown region should return NaN');
    console.log('✅ Test 3 passed: Unknown region tax calculation returns NaN');
    passed++;
  } catch (e) {
    console.log('❌ Test 3 failed:', e.message);
    failed++;
  }

  // Test 4: Currency mapping for US
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const currency = processor.getCurrency('US');
    assertEqual(currency, 'USD', 'US currency mapping');
    console.log('✅ Test 4 passed: US currency mapping');
    passed++;
  } catch (e) {
    console.log('❌ Test 4 failed:', e.message);
    failed++;
  }

  // Test 5: Currency mapping for EU countries
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const germanCurrency = processor.getCurrency('DE');
    const frenchCurrency = processor.getCurrency('FR');
    assertEqual(germanCurrency, 'EUR', 'German currency mapping');
    assertEqual(frenchCurrency, 'EUR', 'French currency mapping');
    console.log('✅ Test 5 passed: EU currency mapping');
    passed++;
  } catch (e) {
    console.log('❌ Test 5 failed:', e.message);
    failed++;
  }

  // Test 6: Currency fallback for unknown region
  try {
    const processor = new CheckoutProcessor({...mockCart});
    const currency = processor.getCurrency('ZZ'); // Unknown country
    assertEqual(currency, 'USD', 'Unknown region currency fallback');
    console.log('✅ Test 6 passed: Currency fallback to USD');
    passed++;
  } catch (e) {
    console.log('❌ Test 6 failed:', e.message);
    failed++;
  }

  // Test 7: Processing payment for US (should work)
  try {
    mockDOM.selectedCountry = 'US';
    const cart = {...mockCart};
    const processor = new CheckoutProcessor(cart);
    await processor.processPayment();
    assertEqual(cart.total, 108, 'US payment processing - total calculation');
    console.log('✅ Test 7 passed: US payment processing');
    passed++;
  } catch (e) {
    console.log('❌ Test 7 failed:', e.message);
    failed++;
  }

  // Test 8: Processing payment for EU country (demonstrates the bug)
  try {
    mockDOM.selectedCountry = 'DE'; // Germany
    const cart = {...mockCart};
    const processor = new CheckoutProcessor(cart);
    
    // Process payment - this will complete but with invalid data
    await processor.processPayment();
    
    // The bug is that cart.total becomes NaN, and payment amount becomes "NaN"
    assert(isNaN(cart.total), 'EU payment processing should result in NaN total due to bug');
    
    // Additionally, let's verify the payment data would be malformed
    const region = processor.getUserRegion();
    const tax = processor.calculateTax(region);
    const malformedTotal = cart.subtotal + tax; // This is NaN
    const malformedAmount = malformedTotal.toFixed(2); // This is "NaN"
    
    assertEqual(malformedAmount, "NaN", 'Payment amount should be "NaN" string for EU countries');
    console.log('✅ Test 8 passed: EU payment processing demonstrates bug (NaN total and amount)');
    passed++;
  } catch (e) {
    console.log('❌ Test 8 failed:', e.message);
    failed++;
  }

  // Test 9: getUserRegion functionality
  try {
    mockDOM.selectedCountry = 'CA';
    const processor = new CheckoutProcessor({...mockCart});
    const region = processor.getUserRegion();
    assertEqual(region, 'CA', 'getUserRegion should return selected country');
    console.log('✅ Test 9 passed: getUserRegion functionality');
    passed++;
  } catch (e) {
    console.log('❌ Test 9 failed:', e.message);
    failed++;
  }

  // Test 10: Edge case - zero subtotal
  try {
    const zeroCart = { subtotal: 0, items: [] };
    const processor = new CheckoutProcessor(zeroCart);
    const tax = processor.calculateTax('US');
    assertEqual(tax, 0, 'Zero subtotal should result in zero tax');
    console.log('✅ Test 10 passed: Zero subtotal edge case');
    passed++;
  } catch (e) {
    console.log('❌ Test 10 failed:', e.message);
    failed++;
  }

  // Test 11: Verify payment data structure for EU bug
  try {
    mockDOM.selectedCountry = 'FR'; // France
    const cart = {...mockCart};
    const processor = new CheckoutProcessor(cart);
    
    // Mock submitPayment to capture the data being sent
    let capturedPaymentData = null;
    processor.submitPayment = (data) => {
      capturedPaymentData = data;
      return Promise.resolve({ ok: true });
    };
    
    await processor.processPayment();
    
    // Verify the payment data contains "NaN" amount
    assertEqual(capturedPaymentData.amount, "NaN", 'Payment API receives "NaN" as amount');
    assertEqual(capturedPaymentData.currency, "EUR", 'Currency mapping still works correctly');
    assert(Array.isArray(capturedPaymentData.items), 'Items array is preserved');
    
    console.log('✅ Test 11 passed: Payment API receives malformed data for EU countries');
    passed++;
  } catch (e) {
    console.log('❌ Test 11 failed:', e.message);
    failed++;
  }
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the failures above.');
  }

  // Bug Analysis
  console.log('\n🐛 Bug Analysis:');
  console.log('The checkout system fails for EU users because:');
  console.log('1. EU countries (DE, FR, GB, etc.) are not in the taxRates object');
  console.log('2. calculateTax returns NaN for unknown regions');
  console.log('3. cart.total becomes NaN (subtotal + NaN = NaN)');
  console.log('4. NaN.toFixed(2) throws a TypeError');
  console.log('5. This breaks the entire payment flow for EU users');
  
  console.log('\n💡 Suggested Fix:');
  console.log('Add default tax rate handling or EU tax rates to the taxRates object');
}

// Export for module use or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CheckoutProcessor, runTests };
}

// Always run tests when this file is executed
runTests().catch(console.error);