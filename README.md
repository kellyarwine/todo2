# Todo2 - Checkout Tests

This repository contains tests for the CheckoutProcessor class which handles payment processing with tax calculation.

## Running Tests

### Basic Test
```bash
node checkout.test.js
```

### Comprehensive Test Suite
```bash
node checkout-comprehensive.test.js
```

## Test Coverage

The test suite covers:

### Currency Conversion
- Tests for all supported regions (US, CA, GB, DE, FR)
- Default fallback behavior for unknown regions

### Tax Calculation
- US tax rate (8%)
- CA tax rate (13%)
- **BUG DETECTION**: Missing tax rates for EU regions (DE, GB)

### Payment Processing
- End-to-end payment flow for supported regions
- **BUG DETECTION**: Payment failures for EU users

### Edge Cases
- Zero subtotal handling
- Constructor validation
- Tax rate configuration

## Known Issues Detected

⚠️ **Critical Bug**: EU users cannot complete payments

The current implementation has a critical bug where:
1. Tax rates are only defined for US (8%) and CA (13%)
2. EU regions (DE, GB, FR) have no tax rates defined
3. `calculateTax()` returns `NaN` for undefined regions
4. `NaN.toFixed(2)` throws an error, breaking the payment flow

### Example Failure
```javascript
// This fails for German users:
const cart = { subtotal: 100, items: ['item1'] };
const processor = new CheckoutProcessor(cart);
// When region = 'DE', calculateTax returns NaN
// cart.total becomes NaN
// NaN.toFixed(2) throws: "TypeError: Cannot read property 'toFixed' of NaN"
```

## Recommended Fix

Add proper tax rate handling for all supported regions:

```javascript
this.taxRates = {
  'US': 0.08,
  'CA': 0.13,
  'GB': 0.20,  // Add UK VAT
  'DE': 0.19,  // Add German VAT
  'FR': 0.20   // Add French VAT
};
```

Or add fallback handling:
```javascript
calculateTax(region) {
  const rate = this.taxRates[region] || 0; // Default to 0% for unknown regions
  return this.cart.subtotal * rate;
}
```

## Test Output

The tests will show:
- ✅ Passing tests for working functionality
- ❌ Failing tests that expose bugs
- 📊 Summary of test results
- 🔍 Detailed bug analysis