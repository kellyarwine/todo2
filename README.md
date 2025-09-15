# Payment Processing Tests

This repository contains tests for the CheckoutProcessor class in `checkout.js`.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Test Coverage

The test suite covers:

### CheckoutProcessor Class Methods:
- ✅ **constructor**: Verifies proper initialization with cart and tax rates
- ✅ **calculateTax**: Tests tax calculation for different regions
- ✅ **getCurrency**: Tests currency mapping for various regions  
- ✅ **getUserRegion**: Tests DOM interaction for getting user region
- ✅ **submitPayment**: Tests payment API calls
- ✅ **processPayment**: Tests end-to-end payment processing

### Bug Detection:
- ✅ **EU User Bug**: Demonstrates the bug where EU regions (DE, FR, GB) don't have tax rates defined, causing `cart.total` to become `NaN` and invalid payment data to be sent to the API
- ✅ **Edge Cases**: Tests behavior with undefined regions and fallback scenarios

### Integration Tests:
- ✅ **End-to-End Scenarios**: Tests complete payment flow for both working (US, CA) and broken (EU) regions
- ✅ **API Integration**: Verifies correct payload structure sent to payment API

## Key Issues Identified

The tests reveal a critical bug in the checkout process:
- EU regions (DE, FR, GB) have currencies defined but no tax rates
- This causes `calculateTax()` to return `NaN` for EU users
- The `cart.total` becomes `NaN` (subtotal + NaN = NaN)
- Payment API receives invalid amount data: `"amount": "NaN"`
- This breaks the payment process for all EU users

## Test Framework

- **Jest**: Testing framework with DOM mocking
- **jsdom**: Browser environment simulation
- **Mocks**: Global fetch API and DOM elements