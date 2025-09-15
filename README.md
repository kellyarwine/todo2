# Todo2 - Checkout Testing

This repository contains a checkout payment processor with comprehensive testing.

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

The test suite includes:
- Tax calculation tests for supported regions (US, CA)
- Tax calculation tests for unsupported regions (demonstrates EU bug)
- Currency mapping tests
- Payment processing end-to-end tests
- Error handling tests

## Known Issues

The checkout processor has a bug where EU regions (DE, GB, FR, etc.) are not included in the tax rates, causing:
1. `calculateTax()` to return `NaN` for these regions
2. `cart.total` to become `NaN` (subtotal + NaN = NaN)
3. Payment API to receive `"NaN"` as the amount value

The tests clearly demonstrate this behavior in the EU region test cases.