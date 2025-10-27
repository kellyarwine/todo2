// test.js - Tax rate tests for checkout processor
// Test suite for New Zealand, Thailand, and Switzerland tax rates

// Import the CheckoutProcessor class
const CheckoutProcessor = require('./checkout.js');

// Simple test helper function
function assertEqual(actual, expected, testName) {
  if (Math.abs(actual - expected) < 0.001) {
    console.log(`✅ ${testName}: PASSED`);
    return true;
  } else {
    console.log(`❌ ${testName}: FAILED - Expected ${expected}, got ${actual}`);
    return false;
  }
}

// Test suite
function runTaxRateTests() {
  console.log('Running tax rate tests for New Zealand, Thailand, and Switzerland...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  // Mock cart for testing
  const mockCart = {
    subtotal: 100,
    items: [],
    total: 0
  };

  // Test New Zealand tax rate (15% GST)
  const nzProcessor = new CheckoutProcessor(mockCart);
  const nzTax = nzProcessor.calculateTax('NZ');
  totalTests++;
  if (assertEqual(nzTax, 15, 'New Zealand tax calculation (15% GST on $100)')) {
    passedTests++;
  }

  // Test Thailand tax rate (7% VAT)
  const thProcessor = new CheckoutProcessor(mockCart);
  const thTax = thProcessor.calculateTax('TH');
  totalTests++;
  if (assertEqual(thTax, 7, 'Thailand tax calculation (7% VAT on $100)')) {
    passedTests++;
  }

  // Test Switzerland tax rate (7.7% VAT)
  const chProcessor = new CheckoutProcessor(mockCart);
  const chTax = chProcessor.calculateTax('CH');
  totalTests++;
  if (assertEqual(chTax, 7.7, 'Switzerland tax calculation (7.7% VAT on $100)')) {
    passedTests++;
  }

  // Test with different subtotal amounts
  const largeMockCart = {
    subtotal: 250,
    items: [],
    total: 0
  };

  // Test New Zealand with larger amount
  const nzProcessorLarge = new CheckoutProcessor(largeMockCart);
  const nzTaxLarge = nzProcessorLarge.calculateTax('NZ');
  totalTests++;
  if (assertEqual(nzTaxLarge, 37.5, 'New Zealand tax calculation (15% GST on $250)')) {
    passedTests++;
  }

  // Test Thailand with larger amount
  const thProcessorLarge = new CheckoutProcessor(largeMockCart);
  const thTaxLarge = thProcessorLarge.calculateTax('TH');
  totalTests++;
  if (assertEqual(thTaxLarge, 17.5, 'Thailand tax calculation (7% VAT on $250)')) {
    passedTests++;
  }

  // Test Switzerland with larger amount
  const chProcessorLarge = new CheckoutProcessor(largeMockCart);
  const chTaxLarge = chProcessorLarge.calculateTax('CH');
  totalTests++;
  if (assertEqual(chTaxLarge, 19.25, 'Switzerland tax calculation (7.7% VAT on $250)')) {
    passedTests++;
  }

  // Test edge case: zero subtotal
  const zeroCart = {
    subtotal: 0,
    items: [],
    total: 0
  };

  const nzZero = new CheckoutProcessor(zeroCart);
  totalTests++;
  if (assertEqual(nzZero.calculateTax('NZ'), 0, 'New Zealand tax on $0 subtotal')) {
    passedTests++;
  }

  // Verify existing tax rates still work correctly
  console.log('\nVerifying existing tax rates...');
  
  // Test US tax rate (8%)
  const usProcessor = new CheckoutProcessor(mockCart);
  const usTax = usProcessor.calculateTax('US');
  totalTests++;
  if (assertEqual(usTax, 8, 'US tax calculation (8% on $100) - existing functionality')) {
    passedTests++;
  }

  // Test CA tax rate (13%)
  const caProcessor = new CheckoutProcessor(mockCart);
  const caTax = caProcessor.calculateTax('CA');
  totalTests++;
  if (assertEqual(caTax, 13, 'Canada tax calculation (13% on $100) - existing functionality')) {
    passedTests++;
  }

  // Summary
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run the tests
runTaxRateTests();
