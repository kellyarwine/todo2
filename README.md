# Todo2 - CheckoutProcessor Tests

This repository contains a `CheckoutProcessor` class for handling payment processing with tax calculation.

## Running Tests

To run the test suite:

```bash
node test.js
```

## Known Issues

The current implementation has a bug where tax calculation fails for regions not in the `taxRates` object (currently only supports 'US' and 'CA'). This causes:

1. `calculateTax()` to return `NaN` for unsupported regions
2. `cart.total` to become `NaN` 
3. `processPayment()` to throw an error when calling `.toFixed(2)` on `NaN`

The test suite includes tests that demonstrate this bug:
- `calculateTax - unsupported region returns NaN`
- `processPayment - unsupported region causes error`

## Test Coverage

The test suite covers:
- Tax calculation for supported regions (US, CA)
- Tax calculation for unsupported regions (demonstrates the bug)
- Currency mapping for all supported regions
- Edge cases (zero subtotal, negative subtotal)
- Integration testing of the payment process