# Todo2 Payment Processing Tests

This repository contains a payment processing system (`checkout.js`) and comprehensive test suite (`checkout.test.js`) that validates the functionality and identifies critical bugs.

## Files

- `checkout.js` - Payment processing system with CheckoutProcessor class
- `checkout.test.js` - Comprehensive test suite
- `package.json` - Project configuration and npm scripts

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite includes:

1. **Tax Calculation Tests** - Validates tax calculation for supported regions (US, CA)
2. **Bug Detection Tests** - Identifies tax calculation failures for EU regions
3. **Currency Mapping Tests** - Verifies currency assignment for different countries
4. **Payment Processing Tests** - Tests complete payment flow for valid regions
5. **Bug Validation Tests** - Demonstrates critical bug where EU users get "NaN" as payment amount
6. **Real Browser Scenario Tests** - Simulates actual browser behavior with the bug
7. **Edge Case Tests** - Tests zero and negative subtotal scenarios

## Identified Bugs

⚠️ **Critical Bug**: EU users (regions not in `taxRates` object) experience payment failures:
- Tax calculation returns `NaN` for unsupported regions
- Payment amount becomes "NaN" when processed
- This affects all EU countries (DE, FR, etc.) not explicitly listed in `taxRates`

## Bug Impact

- EU users cannot complete purchases successfully
- Payment API receives invalid "NaN" amounts
- Revenue loss from European market segment

## Test Results

All tests pass and successfully demonstrate both working functionality and the identified bugs. The test suite serves as documentation for expected behavior and regression prevention.