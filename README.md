# Todo2 - Checkout System with Comprehensive Tests

This repository contains a checkout processing system with comprehensive test coverage.

## Overview

The main functionality is in `checkout.js` which contains a `CheckoutProcessor` class that handles:
- Tax calculation for different regions
- Currency mapping 
- Payment processing
- Cart management

## Files

- `checkout.js` - Main checkout processing logic
- `test/checkout.test.js` - Comprehensive test suite (23 test cases)
- `test/checkout-test-module.js` - Testable module version of CheckoutProcessor
- `package.json` - Project configuration and dependencies

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch
```

## Test Coverage

The test suite includes 23 comprehensive test cases covering:

### Tax Calculation (5 tests)
- Correct tax calculation for supported regions (US: 8%, CA: 13%)
- Handling of unsupported regions (reveals existing bug)
- Edge cases with null/undefined input

### Currency Mapping (6 tests) 
- Correct currency mapping for all supported regions
- Default USD fallback for unsupported regions
- Null input handling

### Payment Processing Edge Cases (3 tests)
- Zero, negative, and very large subtotal values
- Proper tax calculation across different scenarios

### Cart Integration (2 tests)
- Different cart subtotal values
- Various cart structures and configurations

### Tax Rates Configuration (3 tests)
- Verification of correct tax rates for supported regions
- Confirmation that unsupported regions have no tax rates

### Integration Tests (4 tests)
- Full payment processing workflow for supported regions
- Error handling for unsupported regions (exposes existing bug)
- Decimal formatting and rounding verification
- Currency selection integration

## Known Issues

The tests reveal an existing bug in the checkout system:
- When processing payments for regions not in the `taxRates` object (e.g., 'GB', 'DE', 'FR'), the `calculateTax()` method returns `NaN`
- This causes `cart.total` to become `NaN`, which then breaks the payment processing when `.toFixed(2)` is called
- This affects EU users as mentioned in the original code comments

## Security

All dependencies have been scanned for vulnerabilities using GitHub Advisory Database and CodeQL. No security issues were found.

## Dependencies

- Jest: Testing framework
- jsdom: DOM simulation for testing browser code
- jest-environment-jsdom: Jest environment for DOM testing