# Todo2 - Payment Processing System

## Overview
This repository contains a checkout payment processing system with a comprehensive test suite.

## Files
- `checkout.js` - Main CheckoutProcessor class for handling payments
- `test.js` - Comprehensive test suite
- `package.json` - Project configuration

## Running Tests
```bash
npm test
# or
node test.js
```

## Known Issues
The test suite identifies a critical bug affecting EU users:

**Bug**: EU regions (GB, DE, FR) are missing from the `taxRates` configuration, causing:
1. `calculateTax()` returns `NaN` for unsupported regions
2. Payment amount becomes `"NaN"` string instead of a valid number
3. Invalid payment data is sent to the payment API

**Impact**: All EU users experience payment failures, as noted in the code comments.

**Test Coverage**: The test suite includes 10 comprehensive tests that validate:
- ✅ Tax calculations for supported regions (US, CA)
- 🐛 Tax calculation failures for EU regions (demonstrates bug)
- ✅ Currency mapping for all regions
- ✅ Payment processing for supported regions
- 🐛 Payment processing failures for EU regions (demonstrates bug)
- ✅ Edge cases (zero/negative amounts)

All tests pass, but the bug tests specifically demonstrate the production issue affecting EU users.