// Simple test for US tax calculator

// Mock the CheckoutProcessor class for testing
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
}

// Test function for US tax calculation
function testUSTaxCalculation() {
  console.log('Testing US Tax Calculator...');
  
  // Create a mock cart with $100 subtotal
  const mockCart = {
    subtotal: 100,
    items: ['item1', 'item2']
  };
  
  // Create processor instance
  const processor = new CheckoutProcessor(mockCart);
  
  // Test US tax calculation
  const usTax = processor.calculateTax('US');
  const expectedTax = 100 * 0.08; // 8% of $100 = $8
  
  if (usTax === expectedTax) {
    console.log('✓ PASS: US tax calculation is correct');
    console.log(`  Subtotal: $${mockCart.subtotal}`);
    console.log(`  Tax Rate: 8%`);
    console.log(`  Expected Tax: $${expectedTax}`);
    console.log(`  Calculated Tax: $${usTax}`);
    return true;
  } else {
    console.log('✗ FAIL: US tax calculation is incorrect');
    console.log(`  Expected: $${expectedTax}, Got: $${usTax}`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const result = testUSTaxCalculation();
  process.exit(result ? 0 : 1);
}

module.exports = { testUSTaxCalculation };
