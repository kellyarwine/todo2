# Testing Documentation

## Overview
This repository now includes comprehensive unit tests for the `CheckoutProcessor` class using Jest.

## Test Structure

### Test File: `checkout.test.js`
The test suite covers:

1. **Tax Calculation Tests**
   - Valid regions (US, CA)
   - Invalid regions (exposes the bug)
   - Edge cases (null, zero amounts)

2. **Currency Handling Tests**
   - Supported regions
   - Fallback behavior

3. **Payment Processing Tests**
   - Successful payment flows
   - Bug demonstration for EU users
   - Error handling

4. **Bug Demonstration**
   - Shows exactly how the tax calculation bug occurs
   - Validates that invalid amounts ("NaN") are sent to the payment API

## Known Bug
The tests successfully capture a critical bug:
- EU regions (DE, FR, etc.) are not included in the `taxRates` object
- This causes `calculateTax()` to return `NaN`
- The payment API receives amount: "NaN" instead of a valid number
- This breaks payments for EU users

## Running Tests
```bash
npm test
```

## Test Environment
- Jest with jsdom environment
- Mocked fetch API calls
- Mocked DOM interactions