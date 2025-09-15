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

  // Calculate sum of numbers 4-22 for validation
  calculateThreadSum() {
    const numbers = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
    return numbers.reduce((sum, num) => sum + num, 0);
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

// Event handler for payment button
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
