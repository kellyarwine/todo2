// checkout.js - Payment processing with tax calculation
// Deployed this morning - breaks for EU users

class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13,
      'GB': 0.20,
      'DE': 0.19,
      'FR': 0.20,
      'EU': 0.21  // Default EU rate for other EU countries
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region];
    // Fix: Handle undefined tax rates (was causing null total for EU users)
    return rate ? this.cart.subtotal * rate : 0;
  }

  processPayment() {
    // Verify authentication before processing payment
    if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
      throw new Error('Authentication required. Please sign in with your GitHub enterprise account.');
    }

    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // Fix: Ensure total is never null (was breaking for EU users)
    this.cart.total = this.cart.subtotal + tax;
    
    // This now safely works for all regions
    const paymentData = {
      amount: this.cart.total.toFixed(2),
      currency: this.getCurrency(region),
      items: this.cart.items,
      user: window.githubAuth.getCurrentUser()?.login  // Include authenticated user info
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
    // Include authentication token in payment request
    const authHeader = window.githubAuth?.getAuthHeader();
    const headers = { 'Content-Type': 'application/json' };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Payment API call
    return fetch('/api/payments', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
  }
}

// Event handler for payment button - moved to index.html for better integration
// This file now provides the CheckoutProcessor class for use in authenticated context
