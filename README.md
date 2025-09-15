# Todo2 Checkout System

A JavaScript checkout processor with tax calculation functionality.

## Bug Status

⚠️ **Known Bug**: The checkout system fails for EU users (Germany, France, UK) due to undefined tax rates causing `NaN` values in payment processing.

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

The test suite includes:

- ✅ Tax calculation for supported regions (US, CA)
- ❌ Tax calculation for unsupported regions (exposes NaN bug)
- ✅ Currency mapping for all regions
- ✅ Payment processing for supported regions
- ❌ Payment processing for EU regions (demonstrates bug)
- ✅ Edge cases and error handling
- ✅ Integration tests for complete payment flow

## Bug Details

### Current Behavior (Bug)
- For unsupported regions (DE, GB, FR), `calculateTax()` returns `NaN`
- This causes `cart.total` to become `NaN`
- Payment API receives invalid data with `amount: "NaN"`

### Expected Behavior (Test shows what should happen)
- For unsupported regions, should default to 0% tax rate
- Payment should process successfully with valid numeric amounts

## Files

- `checkout.js` - Main checkout processor class
- `checkout.test.js` - Comprehensive test suite
- `package.json` - Dependencies and test configuration