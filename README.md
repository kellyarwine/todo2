# CheckoutProcessor Tests

This repository contains tests for the `CheckoutProcessor` class in `checkout.js`.

## Test Files

- **`test.html`** - Browser-based test suite with visual interface
- **`test.js`** - Node.js command-line test suite
- **`test`** - Simple instructions file

## Running Tests

### Browser Tests
1. Start a local web server in the repository directory:
   ```bash
   python3 -m http.server 8000
   ```
2. Open http://localhost:8000/test.html in your browser
3. Tests will run automatically and display results

### Node.js Tests
```bash
node test.js
```

## Test Coverage

The tests cover all methods of the `CheckoutProcessor` class:

1. **Constructor initialization** - Verifies proper setup of cart and tax rates
2. **calculateTax()** - Tests tax calculation for supported regions (US, CA) and unsupported regions
3. **getCurrency()** - Tests currency mapping for all regions with fallback
4. **processPayment()** - Tests complete payment flow for both working and failing scenarios
5. **submitPayment()** - Tests API call functionality

## Known Issues Tested

The tests identify the existing bug where:
- `calculateTax()` returns `NaN` for unsupported regions (like EU countries)
- This causes `cart.total` to become `NaN`
- Calling `toFixed(2)` on `NaN` throws an error, breaking the payment flow

## Test Results

Current test status: **6/7 tests passing** (1 test demonstrates the known bug)

![Test Results](https://github.com/user-attachments/assets/e72b40b8-5379-4ac4-b630-3c849562fa8f)