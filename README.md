# Checkout Processor Tests

This repository contains comprehensive tests for the CheckoutProcessor class, focusing on US tax calculations.

## Running Tests

```bash
# Run all tests
npm test

# Or run directly with Node.js
node test-checkout.js
```

## Test Coverage

The test suite includes 10 comprehensive tests for US tax calculations:

1. **Basic US tax calculation** - Tests 8% tax on $100 subtotal
2. **Decimal subtotal handling** - Tests tax calculation with $99.99
3. **Zero subtotal edge case** - Ensures $0 subtotal results in $0 tax
4. **Large amount testing** - Tests tax on $1000 subtotal
5. **Small decimal amounts** - Tests tax on $0.01 subtotal
6. **Tax rate verification** - Confirms US rate is exactly 8%
7. **Payment processing integration** - Tests full payment flow with tax
8. **Currency mapping** - Verifies US maps to USD
9. **Calculation consistency** - Ensures repeated calls give same result
10. **Multiple amount testing** - Batch tests various subtotal amounts

All tests verify that US tax calculations work correctly at the 8% rate and integrate properly with the payment processing flow.