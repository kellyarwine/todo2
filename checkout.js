// checkout.js - Payment processing with tax calculation
// Deployed this morning - breaks for EU users

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
    // Fix: default to 0 tax for unsupported regions instead of undefined
    return this.cart.subtotal * (rate || 0);
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
    if (typeof document !== 'undefined' && document.getElementById) {
      return document.getElementById('country-select').value;
    }
    return 'US'; // Default for testing
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

// Event handler for payment button
if (typeof document !== 'undefined' && document.getElementById) {
  document.getElementById('pay-button').addEventListener('click', () => {
    const processor = new CheckoutProcessor(window.cart);
    processor.processPayment()
      .then(result => {
        window.location.href = '/success';
      })
      .catch(error => {
        console.error('Payment failed:', error);
      });
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CheckoutProcessor;
}
