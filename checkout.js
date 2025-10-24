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
    const headers = { 'Content-Type': 'application/json' };
    
    // Add authentication token if user is signed in
    if (window.signinManager && window.signinManager.isSignedIn()) {
      const token = window.signinManager.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return fetch('/api/payments', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
  }
}

// Event handler for payment button
document.getElementById('pay-button').addEventListener('click', () => {
  // Check if user is signed in before processing payment
  if (window.signinManager && !window.signinManager.isSignedIn()) {
    // Redirect to signin with return URL
    const currentPage = encodeURIComponent(window.location.pathname);
    window.location.href = `/signin.html?returnUrl=${currentPage}`;
    return;
  }

  const processor = new CheckoutProcessor(window.cart);
  processor.processPayment()
    .then(result => {
      window.location.href = '/success';
    })
    .catch(error => {
      console.error('Payment failed:', error);
    });
});
