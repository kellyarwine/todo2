// Test for EU checkout failure bug
// This test reproduces the issue where EU users cannot complete checkout

console.log("=== EU Checkout Failure Bug Test ===");
console.log("This test demonstrates the bug described in the checkout.js comments");
console.log("where EU users experience payment failures due to missing tax rates.\n");

// Mock cart object
const mockCart = {
  subtotal: 100.00,
  total: 0,
  items: [
    { name: "Test Product", price: 100.00 }
  ]
};

// CheckoutProcessor class as it exists in the current codebase
class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13
      // Missing: GB, DE, FR and other EU countries
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region]; // undefined for EU regions
    return this.cart.subtotal * rate;   // NaN for EU regions
  }

  processPayment() {
    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // BUG: cart.total becomes NaN for regions not in taxRates
    this.cart.total = this.cart.subtotal + tax;
    
    // This creates problematic payment data when cart.total is NaN
    const paymentData = {
      amount: this.cart.total.toFixed(2), // "NaN" for EU users
      currency: this.getCurrency(region),
      items: this.cart.items
    };

    return this.submitPayment(paymentData);
  }

  getUserRegion() {
    // Simulate different user regions for testing
    return this.mockRegion || 'US';
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
    // Simulate payment API validation that would fail with "NaN" amount
    if (data.amount === "NaN" || isNaN(parseFloat(data.amount))) {
      throw new Error(`Payment failed: Invalid amount '${data.amount}'`);
    }
    return Promise.resolve({ success: true, amount: data.amount });
  }
}

// Test cases demonstrating the bug
function runTests() {
  console.log("Test 1: US User (Working Case)");
  console.log("=====================================");
  try {
    const usProcessor = new CheckoutProcessor({...mockCart});
    usProcessor.mockRegion = 'US';
    
    const tax = usProcessor.calculateTax('US');
    console.log(`✓ Tax calculation: $${tax} (8% of $100)`);
    
    const result = usProcessor.processPayment();
    console.log(`✓ Payment processing: Success`);
    console.log(`✓ Final cart total: $${usProcessor.cart.total}`);
    console.log(`✓ Payment amount: $${usProcessor.cart.total.toFixed(2)}`);
    
  } catch (error) {
    console.log(`✗ Unexpected error: ${error.message}`);
  }
  
  console.log("\nTest 2: GB User (EU Bug Case)");
  console.log("==============================");
  try {
    const gbProcessor = new CheckoutProcessor({...mockCart});
    gbProcessor.mockRegion = 'GB';
    
    const tax = gbProcessor.calculateTax('GB');
    console.log(`✗ Tax calculation: ${tax} (undefined rate causes NaN)`);
    
    gbProcessor.cart.total = gbProcessor.cart.subtotal + tax;
    console.log(`✗ Cart total becomes: ${gbProcessor.cart.total}`);
    console.log(`✗ Amount for payment: "${gbProcessor.cart.total.toFixed(2)}"`);
    
    const result = gbProcessor.processPayment();
    console.log(`✗ This shouldn't succeed with invalid amount`);
    
  } catch (error) {
    console.log(`✓ Payment correctly fails: ${error.message}`);
  }
  
  console.log("\nTest 3: DE User (Another EU Case)");
  console.log("==================================");
  try {
    const deProcessor = new CheckoutProcessor({...mockCart});
    deProcessor.mockRegion = 'DE';
    
    const tax = deProcessor.calculateTax('DE');
    console.log(`✗ Tax calculation: ${tax} (undefined rate causes NaN)`);
    
    deProcessor.processPayment();
    console.log(`✗ Payment should fail for DE users too`);
    
  } catch (error) {
    console.log(`✓ Payment correctly fails: ${error.message}`);
  }
  
  console.log("\nTest 4: FR User (Third EU Case)");
  console.log("================================");
  try {
    const frProcessor = new CheckoutProcessor({...mockCart});
    frProcessor.mockRegion = 'FR';
    
    const tax = frProcessor.calculateTax('FR');
    console.log(`✗ Tax calculation: ${tax} (undefined rate causes NaN)`);
    
    frProcessor.processPayment();
    console.log(`✗ Payment should fail for FR users too`);
    
  } catch (error) {
    console.log(`✓ Payment correctly fails: ${error.message}`);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("SUMMARY OF BUG:");
  console.log("- US/CA users work fine (have tax rates defined)");
  console.log("- EU users (GB/DE/FR) fail due to missing tax rates");
  console.log("- calculateTax() returns NaN for unsupported regions");
  console.log("- cart.total becomes NaN, causing payment failures");
  console.log("- Payment API rejects invalid 'NaN' amount strings");
  console.log("\nFIX NEEDED:");
  console.log("- Add tax rates for GB, DE, FR in taxRates object");
  console.log("- OR add fallback: const rate = this.taxRates[region] || 0;");
  console.log("=".repeat(50));
}

// Run all tests
runTests();
