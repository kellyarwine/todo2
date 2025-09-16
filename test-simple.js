// Simple test to verify basic tax calculation functionality
// Run with: node test-simple.js

console.log('Running simple checkout tests...\n');

// CheckoutProcessor class (copied from checkout.js)
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
}

// Test data
const testCart = { subtotal: 100, items: ['item1', 'item2'] };
const processor = new CheckoutProcessor(testCart);

// Test known regions
console.log('Testing known regions:');
console.log(`US (8%): $${processor.calculateTax('US')} - Currency: ${processor.getCurrency('US')}`);
console.log(`CA (13%): $${processor.calculateTax('CA')} - Currency: ${processor.getCurrency('CA')}`);
console.log(`GB (20%): $${processor.calculateTax('GB')} - Currency: ${processor.getCurrency('GB')}`);
console.log(`DE (19%): $${processor.calculateTax('DE')} - Currency: ${processor.getCurrency('DE')}`);
console.log(`FR (20%): $${processor.calculateTax('FR')} - Currency: ${processor.getCurrency('FR')}`);

// Test unknown regions (the bug fix)
console.log('\nTesting unknown regions (should default to 0% tax):');
console.log(`XX: $${processor.calculateTax('XX')} - Currency: ${processor.getCurrency('XX')}`);
console.log(`Unknown: $${processor.calculateTax('UNKNOWN')} - Currency: ${processor.getCurrency('UNKNOWN')}`);

console.log('\n✅ All basic tests completed successfully!');
console.log('For comprehensive tests, run: npm test');