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
    // Allow for testing by checking if document exists
    if (typeof document !== 'undefined') {
      return document.getElementById('country-select').value;
    }
    // Return a default for testing
    return 'US';
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
    // In test environment, return a mock promise
    if (typeof global !== 'undefined' && global.process && global.process.env.NODE_ENV !== 'production') {
      // Mock response for testing
      return Promise.resolve({ ok: true, status: 200 });
    }
    
    // Use global fetch if available (browser environment)
    if (typeof fetch !== 'undefined') {
      return fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Fallback mock for testing
      return Promise.resolve({ ok: true, status: 200 });
    }
  }
}

// Export for testing
export { CheckoutProcessor };

// Event handler for payment button (only run in browser environment)
if (typeof document !== 'undefined') {
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
