# todo2

A simple payment processing checkout system with tax calculation functionality.

## Overview

This repository contains a payment checkout processor implementation that handles cart totals, tax calculations, and payment submissions for different regions.

## Project Structure

```
.
├── README.md       # Project documentation
├── checkout.js     # Payment processor implementation
└── test           # Test file
```

## Files Description

### checkout.js

Contains the `CheckoutProcessor` class that handles:
- Tax calculation for US and CA regions (other regions need tax rates defined)
- Payment processing workflow
- Currency conversion for US, CA, GB, DE, and FR
- Payment API submission

**Current Tax Rates:**
- US: 8%
- CA: 13%

**Supported Currencies:**
- USD (US)
- CAD (Canada)
- GBP (Great Britain)
- EUR (Germany, France)

### test

A simple test file containing basic test data.

## Known Issues

⚠️ **Critical Bug**: The checkout processor breaks for EU users (regions: GB, DE, FR, etc.)

**Problem**: When `calculateTax()` is called for a region not defined in the `taxRates` object (lines 7-10 in checkout.js), it returns `NaN` (undefined * subtotal). This causes:
1. `cart.total` to become `NaN` (subtotal + NaN = NaN)
2. `toFixed(2)` call on `NaN` causes a runtime error
3. Payment processing fails for EU users

**Affected Code** (lines 13-23):
```javascript
calculateTax(region) {
  const rate = this.taxRates[region];
  return this.cart.subtotal * rate;  // Returns NaN when rate is undefined
}

processPayment() {
  const region = this.getUserRegion();
  const tax = this.calculateTax(region);
  this.cart.total = this.cart.subtotal + tax;  // NaN when tax is undefined
  // ...
}
```

**Solution**: Add default tax rate handling or extend `taxRates` to include all supported regions.

## Usage

The checkout processor is initialized with a cart object and processes payments through the following flow:

1. User selects their country from the dropdown
2. System calculates tax based on region
3. Total amount is computed (subtotal + tax)
4. Payment is submitted to `/api/payments` endpoint

```javascript
const processor = new CheckoutProcessor(window.cart);
processor.processPayment()
  .then(result => {
    window.location.href = '/success';
  })
  .catch(error => {
    console.error('Payment failed:', error);
  });
```

## Notes

- Deployed October 21, 2025
- Bug affects EU users since deployment
- Requires DOM elements: `#country-select` and `#pay-button`

## Comments
- strawberry
- banana
- apple
- orange
- lemon
- vanilla
