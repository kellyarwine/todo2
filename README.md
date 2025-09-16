# Checkout System

Payment processing system with tax calculation for multiple regions.

## Features

- Tax calculation for US, CA, GB, DE, and FR
- Fallback to 0% tax for unknown regions  
- Currency mapping for each region
- Payment processing with proper error handling

## Testing

The system includes comprehensive tests to verify tax calculation functionality.

### Run Tests

```bash
# Run comprehensive test suite
npm test

# Run simple verification tests
npm run test:simple

# Run tests directly
node test.js
node test-simple.js
```

### Test Coverage

- ✅ Tax calculation for all supported regions (US: 8%, CA: 13%, GB: 20%, DE: 19%, FR: 20%)
- ✅ Fallback behavior for unknown regions (defaults to 0%)
- ✅ Currency mapping for all regions
- ✅ Cart total calculation in payment processing
- ✅ Verification that cart.total is never null (bug fix validation)

## Bug Fix

Fixed issue where EU users experienced payment failures due to:
- Missing tax rates for GB, DE, and FR regions
- No fallback handling for unknown regions causing cart.total to become null

The fix adds EU tax rates and implements fallback to 0% tax for unknown regions.