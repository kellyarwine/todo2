# Todo2 Checkout Tests

This repository contains comprehensive tests for the CheckoutProcessor payment system.

## Bug Description

The checkout system currently has a critical bug affecting EU users:

- **Problem**: Missing tax rates for EU countries (GB, DE, FR) 
- **Impact**: Payment processing fails for EU users with "NaN" amounts
- **Root cause**: `calculateTax()` returns `NaN` when tax rate is undefined
- **Result**: Cart total becomes `NaN`, breaking payment processing

## Test Coverage

The test suite covers:

### ✅ Working Functionality
- Tax calculation for supported regions (US, CA)
- Currency mapping for all regions
- Payment processing for supported regions
- API calls and error handling
- Edge cases (zero, negative, large amounts)

### ❌ Bug Scenarios  
- Tax calculation returning NaN for EU regions
- Payment processing with invalid amounts
- Demonstration of broken user experience

## Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run bug demonstration
node demo-bug.js
```

## Test Files

- `test/setup.js` - Test environment setup with DOM mocking
- `test/checkout.test.js` - Comprehensive test suite (25 tests)
- `demo-bug.js` - Interactive bug demonstration script

## Test Results

All 25 tests pass, including tests that verify the bug behavior:

- Constructor and initialization ✅
- Tax calculation (working + broken regions) ✅  
- Currency mapping ✅
- User region detection ✅
- Payment processing (success + bug scenarios) ✅
- API integration ✅
- Edge cases ✅

## Technologies

- **Testing**: Jest with jsdom environment
- **Mocking**: DOM elements, fetch API, window object
- **Coverage**: All methods and edge cases

The tests clearly demonstrate both the working functionality and the EU payment bug, providing a solid foundation for fixing the issue.