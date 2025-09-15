# Checkout Tests

This directory contains tests for the CheckoutProcessor class.

## Running Tests

```bash
npm test
```

or 

```bash
node checkout.test.js
```

## Test Coverage

The test suite covers:
- Constructor initialization
- Tax calculation for different regions
- Currency mapping functionality  
- Payment processing workflow
- Known bugs (documented in tests)

## Known Issues

The tests expose a bug where EU users (regions not in taxRates) get NaN tax calculations, causing invalid payment amounts.
