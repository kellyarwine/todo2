# todo2

A payment processing demo project with checkout functionality and tax calculation.

## Overview

This project demonstrates a checkout payment processor that handles cart totals, tax calculations for different regions, and payment processing through an API. It's designed to showcase payment flow integration with regional tax rate support.

## Features

- Cart total calculation with regional tax rates
- Multi-region support (US, CA)
- Multi-currency support (USD, CAD, GBP, EUR)
- Payment API integration
- Client-side checkout flow

## Project Structure

- `checkout.js` - Main checkout processor with tax calculation and payment handling
- `test` - Test file

## Usage

The `CheckoutProcessor` class handles the complete payment flow:

```javascript
const processor = new CheckoutProcessor(cart);
processor.processPayment()
  .then(result => {
    // Handle success
  })
  .catch(error => {
    // Handle error
  });
```

## Known Issues

⚠️ **Critical Bug**: The checkout process breaks for EU users (regions not in taxRates).
- When `calculateTax()` is called with a region not in the `taxRates` object (like 'GB', 'DE', 'FR'), it returns `undefined`
- This causes `cart.total` to become `NaN` when adding `subtotal + undefined`
- The `.toFixed(2)` call on `NaN` returns the string `'NaN'`, which is then sent to the payment API, likely causing payment processing to fail

**Regions with tax rates defined:**
- US: 8%
- CA: 13%

**Regions without tax rates (currently broken):**
- GB (Great Britain)
- DE (Germany)
- FR (France)
- Other EU countries

## Contributing

This is a demo project. Issues and pull requests are welcome.

---

Last updated: October 21, 2025
