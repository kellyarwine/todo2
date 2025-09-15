# Todo2 - Checkout System

## Overview
This repository contains a payment checkout system with tax calculation functionality.

## Files
- `checkout.js` - Main checkout processor class with payment handling
- `test` - Comprehensive test suite for the checkout functionality

## Known Issues
The checkout system has a critical bug affecting EU users:

1. **Tax calculation bug**: The `calculateTax()` method only supports US (8%) and CA (13%) tax rates
2. **Payment failure**: EU countries (DE, FR, GB, etc.) return `NaN` for tax calculation
3. **Invalid payment data**: This causes the payment amount to be sent as "NaN" to the payment API

## Running Tests
```bash
node test
```

The test suite validates:
- ✅ Tax calculation for supported regions (US, CA)
- ✅ Currency mapping for all regions 
- ✅ Payment processing for valid regions
- ⚠️  Bug detection for unsupported regions (EU countries)
- ✅ Edge cases (zero subtotal, different amounts)

## Test Output
The tests will pass (indicating they correctly validate current behavior) but will show detected bugs:
```
✅ All tests passed!

📋 Test Summary:
- Tests validate current checkout.js behavior
- BUG DETECTED: calculateTax() returns NaN for EU countries
- BUG DETECTED: processPayment() sends amount: "NaN" for EU regions
- This causes payment failures for EU users in production

🔧 To fix: Add tax rates for EU countries or default to 0% tax
```

## Suggested Fix
Add default tax handling in the `calculateTax()` method:
```javascript
calculateTax(region) {
  const rate = this.taxRates[region] || 0; // Default to 0% for unknown regions
  return this.cart.subtotal * rate;
}
```