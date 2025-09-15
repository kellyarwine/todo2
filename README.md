# Todo2 - Payment Processing Tests

This repository contains a payment processing application with comprehensive tests that demonstrate both working functionality and bugs.

## Files

- `checkout.js` - Main payment processing class with tax calculation
- `test.js` - Comprehensive test suite
- `package.json` - Node.js package configuration

## Running Tests

```bash
npm test
```

or

```bash
node test.js
```

## Test Coverage

The test suite includes:

1. **Tax Calculation Tests**
   - US region (8% tax rate) ✅
   - Canada region (13% tax rate) ✅
   - Unsupported regions (returns NaN) ⚠️

2. **Currency Mapping Tests**
   - Supported currencies (USD, CAD, EUR, GBP) ✅
   - Fallback to USD for unknown regions ✅

3. **Payment Processing Tests**
   - Valid payment processing for supported regions ✅
   - Invalid payment data for unsupported regions ⚠️

4. **Bug Demonstration**
   - Shows how EU users encounter payment issues
   - Demonstrates NaN values in payment amounts
   - Highlights missing tax rates for EU countries

## Known Issues

The tests reveal a critical bug in the `CheckoutProcessor`:

**Bug**: EU users (Germany, France, etc.) encounter payment failures because:
1. Tax rates are only defined for US (8%) and CA (13%)
2. For undefined regions, `calculateTax()` returns `NaN`
3. `cart.total` becomes `NaN` when adding `subtotal + NaN`
4. Payment is submitted with amount: "NaN", causing payment failures

**Impact**: EU users cannot complete purchases, resulting in lost revenue.

**Fix needed**: Add proper tax rates for EU countries or implement a default tax rate for unsupported regions.

## Test Output Example

```
✅ All tests passed!
⚠️  Bug detected: Payment processed with amount "NaN"!
📊 Payment data: { amount: 'NaN', currency: 'EUR', items: [ 'item1', 'item2' ] }
```

The tests pass but clearly highlight the payment processing bug that affects EU users.