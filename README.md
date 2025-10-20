# todo2

A JavaScript payment processing module with tax calculation functionality.

## Overview

This repository contains a checkout processor implementation that handles payment processing with region-specific tax calculations. The `CheckoutProcessor` class manages cart totals, tax calculations, and payment submission.

## Files

- `checkout.js` - Main payment processing module containing the CheckoutProcessor class
- `test` - Test file

## Features

- Region-specific tax calculation
- Multi-currency support (USD, CAD, GBP, EUR)
- Payment API integration
- Shopping cart total calculation

## Usage

The CheckoutProcessor class can be instantiated with a cart object:

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

## Supported Regions

### Tax Rates
- US: 8%
- CA: 13%

### Currencies
- US: USD
- CA: CAD
- GB: GBP
- DE: EUR
- FR: EUR

## Known Issues

There is a known bug affecting EU users where the cart total becomes null for regions not included in the taxRates object. This causes the payment processing to fail when calling `.toFixed(2)` on a null value.

The issue occurs in the `calculateTax` method at line 14-15 of checkout.js, where regions without defined tax rates return `undefined`, resulting in `NaN` when multiplied by the subtotal.

## Requirements

- Modern browser with ES6 support
- DOM elements with IDs: `country-select`, `pay-button`
- Global `window.cart` object with `subtotal` and `items` properties

## API

### CheckoutProcessor

#### Constructor
- `constructor(cart)` - Initializes the processor with a cart object

#### Methods
- `calculateTax(region)` - Calculates tax based on region
- `processPayment()` - Processes the payment and submits to API
- `getUserRegion()` - Gets the selected country from the DOM
- `getCurrency(region)` - Returns the appropriate currency code for a region
- `submitPayment(data)` - Submits payment data to the API endpoint

## License

No license specified.
