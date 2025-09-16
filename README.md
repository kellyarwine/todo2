# Checkout Processor Tests

This repository contains a checkout processor for payment handling with comprehensive tests.

## Running Tests

```bash
npm test
```

## What the Tests Cover

### Tax Calculation
- Tests tax calculation for supported regions (US: 8%, CA: 13%)
- Tests tax calculation for unsupported regions (demonstrates bug where `undefined * subtotal = NaN`)

### Currency Mapping
- Tests currency mapping for all supported regions
- Tests fallback to USD for unsupported regions

### Payment Processing
- Tests successful payment processing for supported regions
- Tests payment processing failure for EU regions (demonstrates the toFixed bug)

## Known Bug

The checkout processor has a known bug where EU users (GB, DE, FR, etc.) cannot complete payments because:

1. Tax calculation returns `NaN` for unsupported regions
2. This makes `cart.total = subtotal + NaN = NaN`
3. Calling `NaN.toFixed(2)` throws a TypeError

The tests successfully demonstrate this bug in the "Payment Processing" section.