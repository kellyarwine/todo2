# Todo2 Test Suite

This repository contains a comprehensive test suite for the checkout functionality.

## Setup

The test infrastructure uses Jest and includes:

- **package.json**: Contains Jest configuration and dependencies
- **checkout.test.js**: Comprehensive test suite for the CheckoutProcessor class

## Running Tests

```bash
npm install  # Install dependencies
npm test     # Run all tests
npm run test:watch  # Run tests in watch mode
```

## Test Coverage

The test suite covers:

1. **Constructor Testing**: Validates proper initialization
2. **Tax Calculation**: Tests for supported and unsupported regions (including the EU bug)
3. **Currency Handling**: Tests currency mapping for different regions
4. **User Region Detection**: Tests DOM interaction for getting user region
5. **Payment Submission**: Tests API call functionality
6. **Payment Processing**: End-to-end payment flow testing
7. **Edge Cases**: Including null/undefined values and error scenarios
8. **Bug Scenarios**: Specifically tests the EU user bug where unsupported regions cause NaN values

## Known Issues Demonstrated

The tests specifically demonstrate the bug affecting EU users:
- Tax calculation returns `NaN` for regions not in the `taxRates` object (DE, GB, etc.)
- This causes the payment amount to be "NaN" which breaks the payment flow for European users
- The bug is deployed and currently affects production

## Test Results

All 20 tests pass, including tests that verify the buggy behavior works as expected (sending "NaN" as the payment amount).