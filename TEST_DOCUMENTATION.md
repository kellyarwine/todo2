# Test Documentation for CheckoutProcessor

## Overview

This test suite provides comprehensive coverage for the `CheckoutProcessor` class in `checkout.js`. The tests validate both expected functionality and document existing bugs.

## Test Structure

### Unit Tests

1. **Constructor Tests**
   - Verifies proper initialization of cart and tax rates

2. **calculateTax Tests**
   - Tests tax calculation for supported regions (US, CA)
   - Documents bug: Returns NaN for unsupported regions
   - Tests edge cases: null regions, zero/negative subtotals

3. **getCurrency Tests**
   - Tests currency mapping for all supported regions
   - Tests fallback to USD for unsupported regions

4. **getUserRegion Tests**
   - Tests DOM interaction for getting selected region
   - Tests error handling when DOM element is missing

5. **submitPayment Tests**
   - Tests API call structure and parameters

### Integration Tests

1. **processPayment Tests**
   - Tests complete payment flow for supported regions
   - Documents payment failures for unsupported regions
   - Tests network error handling

2. **Full Flow Tests**
   - End-to-end payment processing
   - Error propagation testing

### Bug Documentation

The test suite explicitly documents and tests the following bugs:

1. **Tax Calculation Bug**: When `calculateTax()` is called with a region not in `taxRates`, it returns `NaN` (undefined × number = NaN)

2. **Invalid Payment Amount Bug**: When cart.total becomes NaN, the payment API receives an invalid amount string "NaN"

## Coverage

- **Statements**: ~76%
- **Branches**: ~80%
- **Functions**: ~67%
- **Lines**: ~76%

Uncovered lines are primarily the browser-specific DOM event handler initialization.

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Dependencies

- **Jest**: Test framework
- **jest-environment-jsdom**: DOM environment for browser-like testing
- **fetch mock**: Mocked for API testing

## Key Test Findings

1. **Working Functionality**: 
   - US and Canada regions work correctly
   - Currency mapping works for all regions
   - API integration follows expected patterns

2. **Critical Bugs**:
   - EU users (GB, DE, FR) receive invalid payment amounts
   - No tax rates defined for regions other than US/CA
   - No validation for cart.total before API submission

3. **Recommendations**:
   - Add tax rates for missing regions
   - Add validation to prevent NaN amounts
   - Implement proper error handling for unsupported regions