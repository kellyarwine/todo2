# Todo2 Checkout Processor

A JavaScript checkout processor with payment and tax calculation functionality.

## Running Tests

```bash
npm test
```

## Bug Documentation

The tests demonstrate a bug affecting EU users where regions not included in the `taxRates` object (like Germany, Great Britain, etc.) cause the tax calculation to return `NaN`, which then makes the cart total `NaN` and results in invalid payment amounts.

### Affected Regions
- Germany (DE)
- Great Britain (GB)
- Any region not explicitly listed in `taxRates`

### Expected vs Actual Behavior
- **Expected**: Unsupported regions should either default to 0% tax or show an error
- **Actual**: Tax becomes `NaN`, cart total becomes `NaN`, payment amount becomes "NaN"

## Test Coverage

The test suite covers:
- ✅ Constructor initialization
- ✅ Tax calculation for supported regions (US, CA)
- ✅ Tax calculation bug for unsupported regions
- ✅ Currency mapping functionality
- ✅ User region detection
- ✅ Payment processing for supported regions
- ✅ Payment processing bug demonstration for EU regions
- ✅ Edge cases (zero subtotal)