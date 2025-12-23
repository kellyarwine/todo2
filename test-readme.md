# Checkout Test Suite

This repository contains tests for the `CheckoutProcessor` class functionality.

## Running the Tests

To run the comprehensive test suite:

```bash
node checkout.test.js
```

## Test Coverage

The test suite covers:

1. **Tax Calculation**
   - US tax calculation (8%)
   - Canada tax calculation (13%)
   - Unknown regions (returns NaN - demonstrates the EU bug)

2. **Currency Mapping**
   - US → USD
   - EU countries (DE, FR) → EUR
   - Canada → CAD
   - Great Britain → GBP
   - Unknown regions → USD (fallback)

3. **Payment Processing**
   - Successful payment processing for supported regions (US, CA)
   - Bug demonstration for EU countries (NaN amounts)

4. **Edge Cases**
   - Zero subtotal handling
   - Unknown country handling

## Known Issues

### EU User Bug
The checkout system currently fails for EU users because:
1. EU countries (DE, FR, GB, etc.) are not included in the `taxRates` object
2. `calculateTax()` returns `NaN` for unknown regions
3. `cart.total` becomes `NaN` (subtotal + NaN = NaN)
4. Payment API receives `"NaN"` as the amount string
5. This results in failed payments for EU users

### Suggested Fix
Add EU tax rates to the `taxRates` object or implement a default tax rate:

```javascript
this.taxRates = {
  'US': 0.08,
  'CA': 0.13,
  'GB': 0.20,    // UK VAT
  'DE': 0.19,    // German VAT
  'FR': 0.20,    // French VAT
  // ... other EU countries
};
```

Or add a default rate:
```javascript
calculateTax(region) {
  const rate = this.taxRates[region] || 0.20; // Default 20% for unknown regions
  return this.cart.subtotal * rate;
}
```

## Test Results

When run, the test suite should show:
- ✅ 11 tests passed
- 📈 100% success rate
- 🐛 Detailed bug analysis
- 💡 Suggested fixes