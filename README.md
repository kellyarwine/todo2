# todo2

A JavaScript-based checkout and payment processing system.

## Overview

This repository contains a checkout processor implementation that handles payment processing with tax calculation for different regions. The system calculates taxes based on the user's region and processes payments through an API.

## Features

- Multi-region tax calculation (US, CA)
- Dynamic currency selection based on region
- Payment processing integration
- Shopping cart total calculation with tax

## Files

- `checkout.js` - Main checkout processor with tax calculation and payment handling
- `test` - Test file

## Installation

No installation required. This is a browser-based JavaScript application. Simply include the `checkout.js` file in your HTML:

```html
<script src="checkout.js"></script>
```

## Usage

The checkout processor requires the following HTML elements:
- A country select dropdown with id `country-select`
- A payment button with id `pay-button`
- A cart object available at `window.cart` with `subtotal` and `items` properties

### Example

```javascript
// Initialize cart
window.cart = {
  subtotal: 100.00,
  items: [
    { name: "Product 1", price: 50.00 },
    { name: "Product 2", price: 50.00 }
  ]
};

// The checkout processor will handle the payment when the pay button is clicked
```

## Known Issues

⚠️ **Critical Bug**: The checkout processor currently breaks for EU users (and any region not defined in the `taxRates` object).

**Problem**: When `calculateTax()` is called for a region not in the `taxRates` object (e.g., 'GB', 'DE', 'FR'), it returns `undefined`. This causes `cart.total` to become `NaN`, which then throws an error when `toFixed(2)` is called.

**Affected Regions**: All regions except US and CA, particularly:
- GB (United Kingdom)
- DE (Germany)
- FR (France)
- And any other international regions

**Deployed**: This issue exists in the current production deployment (as of this morning).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Notes

Previous comments/items tracked:
- strawberry
- banana
- apple
- orange
- lemon
- vanilla

---

*Last updated: October 21, 2025*
