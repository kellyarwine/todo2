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

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CheckoutProcessor;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.CheckoutProcessor = CheckoutProcessor;
}

// Event handler for payment button - only run in browser environment
if (typeof document !== 'undefined' && document.getElementById) {
  const payButton = document.getElementById('pay-button');
  if (payButton) {
    payButton.addEventListener('click', () => {
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
}
