# EU Checkout Bug Test

## Purpose
This test demonstrates the EU checkout failure bug described in the checkout.js comments where European users cannot complete payments due to missing tax rates.

## Running the Test
```bash
node eu-checkout-bug-test.js
```

## What the Test Demonstrates

### The Bug
- EU users (GB, DE, FR) experience payment failures
- Missing tax rates in the `taxRates` object cause `calculateTax()` to return `NaN`
- `cart.total` becomes `NaN` when adding subtotal + NaN tax
- Payment API rejects the invalid "NaN" amount string

### Working Cases
- US and CA users work correctly because their tax rates are defined
- Shows the contrast between working and broken functionality

### Expected Output
The test shows:
1. ✓ US users can complete checkout successfully ($100 + $8 tax = $108)
2. ✗ GB users fail with "Payment failed: Invalid amount 'NaN'"
3. ✗ DE users fail with the same error
4. ✗ FR users fail with the same error

## The Fix Needed
As suggested in the test output, the fix requires either:
1. Adding tax rates for EU countries: `'GB': 0.20, 'DE': 0.19, 'FR': 0.20`
2. Adding a fallback: `const rate = this.taxRates[region] || 0;`

This test validates the bug described in previous PR messages and provides a foundation for testing the fix.