# Todo2 - Checkout Processor Tests

This repository contains a checkout processor with comprehensive tests to validate payment processing functionality.

## Files

- `checkout.js` - The main CheckoutProcessor class with payment processing logic
- `test.js` - Comprehensive test suite for the CheckoutProcessor
- `package.json` - Node.js package configuration

## Known Issues

The tests identify a critical bug in the checkout processor that affects EU users:

- **Bug**: Tax calculation returns `undefined` for regions not defined in `taxRates` (like GB, DE, FR)
- **Impact**: This causes `cart.total` to become `NaN`, resulting in invalid payment amounts ("NaN")
- **Affected Users**: EU customers trying to make payments

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite covers:

1. ✅ Tax calculation for supported regions (US, CA)
2. ✅ Tax calculation for unsupported regions (GB, DE, FR) - exposes the bug
3. ✅ Currency mapping for all supported currencies
4. ✅ Payment processing workflow for valid regions
5. ✅ Critical bug demonstration for EU users

## Test Results

All 11 tests pass, including tests that specifically catch and validate the existence of the EU user bug.