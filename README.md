# todo2

A payment processing checkout system with tax calculation capabilities.

## Overview

This project provides a checkout processor that handles payment transactions with automatic tax calculation based on user region. It's designed to support multiple currencies and regions for international e-commerce applications.

## Features

- **Multi-region Tax Calculation**: Automatic tax calculation based on user location
- **Multi-currency Support**: Handles USD, CAD, GBP, and EUR
- **Payment API Integration**: Integrated payment processing with REST API
- **Shopping Cart Integration**: Works with existing cart systems

## Files

- `checkout.js` - Main checkout processor with payment and tax calculation logic
- `test` - Test file

## Usage

### CheckoutProcessor Class

```javascript
// Initialize with cart object
const processor = new CheckoutProcessor(cart);

// Process payment
processor.processPayment()
  .then(result => {
    // Handle successful payment
    window.location.href = '/success';
  })
  .catch(error => {
    // Handle payment error
    console.error('Payment failed:', error);
  });
```

### Supported Regions

Currently supported tax regions:
- **US**: 8% tax rate
- **CA**: 13% tax rate

Supported currencies:
- USD (United States)
- CAD (Canada)
- GBP (United Kingdom)
- EUR (Germany, France)

## Known Issues

⚠️ **EU Region Tax Bug**: The system currently breaks for EU users (GB, DE, FR) because tax rates are not defined for these regions. This causes `cart.total` to become `null`, resulting in a JavaScript error when calling `.toFixed(2)`.

**Status**: Deployed with this issue - affects EU users

**Workaround Needed**: Add tax rates for EU regions in the `taxRates` object.

## Requirements

- Modern web browser with ES6 support
- Fetch API support (or polyfill)
- DOM elements:
  - `#country-select` - Country/region selector
  - `#pay-button` - Payment button

## API Endpoint

The checkout processor sends payment data to:
```
POST /api/payments
Content-Type: application/json
```

## Notes

Last updated: October 21, 2025

### Previous Comments
- strawberry
- banana
- apple
- orange
- lemon
- vanilla
