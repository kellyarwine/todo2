# Todo2 Application

This repository contains a checkout payment processing system.

## Files

- `checkout.js` - Main checkout processor with payment functionality
- `checkout.test.js` - Comprehensive tests for the CheckoutProcessor class
- `test` - Test documentation

## Running Tests

To run the tests for the checkout functionality:

```bash
node checkout.test.js
```

## Known Issues

The tests reveal a bug in the CheckoutProcessor:
- Tax calculation fails for EU regions (DE, FR, etc.) because they are not included in the `taxRates` object
- This causes `cart.total` to become `NaN` and breaks the payment processing for EU users
- The `getCurrency()` method correctly handles EU currencies, but `calculateTax()` does not have corresponding tax rates

## Test Coverage

The test suite covers:
- Currency mapping for different regions
- Tax calculation for US/CA regions
- Bug demonstration for EU regions
- Payment processing workflow
- Different cart value scenarios