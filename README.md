# Todo2 Checkout System

This repository contains a checkout payment processing system with tax calculation functionality.

## Files

- `checkout.js` - Main checkout processor class with payment handling
- `test.js` - Comprehensive test suite for the checkout functionality

## Known Issues

The checkout system has a bug that affects EU users:

- The `calculateTax` method only supports US and CA tax rates
- For regions not in the `taxRates` object (like EU countries), it returns `NaN`
- This causes the payment amount to be calculated as "NaN", which breaks the payment process

## Running Tests

To run the test suite:

```bash
node test.js
```

The test suite includes:
- Unit tests for tax calculation
- Currency mapping validation
- Payment processing workflow tests
- Bug demonstration tests for unsupported regions
- Edge case handling (zero subtotal, etc.)

## Test Coverage

The tests cover:
- ✅ Normal operation for supported regions (US, CA)
- ✅ Currency code mapping for all regions
- ✅ DOM interaction mocking
- ✅ Bug demonstration for EU users
- ✅ Edge cases and error conditions

All tests pass, including those that demonstrate the current bug behavior.