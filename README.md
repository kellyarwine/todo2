# Todo2 Testing

## Running Tests

To run the tests for the CheckoutProcessor class:

```bash
node --test checkout.test.js
```

## Test Coverage

The test suite covers:

- **Constructor**: Initialization with cart and tax rates
- **calculateTax**: Tax calculation for different regions (including bug cases)
- **getCurrency**: Currency mapping with fallback handling
- **getUserRegion**: DOM element value retrieval
- **processPayment**: End-to-end payment processing
- **submitPayment**: API call validation

## Known Issues Tested

The tests identify a bug in the `calculateTax` method where regions not defined in the `taxRates` object result in `NaN` values, causing payment processing to create invalid data with amount: "NaN".

### Bug Details:
1. `calculateTax('GB')` returns `NaN` because `undefined * 100 = NaN`
2. This causes `cart.total` to become `NaN`
3. The payment data gets `amount: "NaN"` which would fail in real payment processing

### Test Cases for the Bug:
- ✅ `should return NaN for regions not in taxRates (BUG)`
- ✅ `should fail for regions without tax rates (BUG)`
- ✅ `should create invalid payment data for regions without tax rates (BUG)`