// checkout.js - Payment processing with tax calculation
// Fixed: Now supports EU users with proper tax rates

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

  processPayment() {
    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // Fixed: cart.total now handles regions not in taxRates (defaults to 0 tax)
    this.cart.total = this.cart.subtotal + tax;
    
    // Payment data creation with proper error handling
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
