# Todo2 - Checkout Processor

This repository contains a checkout payment processor with tax calculation functionality.

## Running Tests

To run the test suite:

```bash
npm install
npm test
```

## Test Coverage

The test suite covers:
- Currency mapping for different regions
- Tax calculation (including the bug for unsupported regions)
- Payment processing functionality
- DOM interaction mocking

## Known Issues

The `calculateTax` method has a bug where it returns `NaN` for regions not defined in the `taxRates` object. This causes the payment amount to be invalid for users in unsupported regions like GB, DE, FR, etc.

## Code Structure

- `checkout.js` - Main payment processor class
- `checkout.test.js` - Test suite for the payment processor
- `package.json` - Node.js dependencies and scripts