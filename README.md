# todo2

A payment processing checkout system with tax calculation support for multiple regions.

## Overview

This project provides a checkout processor that handles payment calculations including region-specific tax rates and currency conversion. The system supports multiple countries and automatically applies the appropriate tax rate based on the user's selected region.

## Features

- **Multi-region Tax Calculation**: Supports US and Canadian tax rates
- **Currency Conversion**: Handles USD, CAD, GBP, and EUR currencies
- **Automatic Region Detection**: Retrieves user region from country selector
- **Payment API Integration**: Submits payment data to backend API

## Installation

```bash
# Clone the repository
git clone https://github.com/kellyarwine/todo2.git

# Navigate to the project directory
cd todo2
```

## Usage

### Basic Setup

Include the `checkout.js` file in your HTML:

```html
<script src="checkout.js"></script>
```

### HTML Requirements

The checkout page must include:
- A country selector with id `country-select`
- A payment button with id `pay-button`
- A `window.cart` object with the following structure:

```javascript
window.cart = {
  subtotal: 100.00,
  items: [
    { name: "Product 1", price: 50.00 },
    { name: "Product 2", price: 50.00 }
  ]
};
```

### Example

```html
<select id="country-select">
  <option value="US">United States</option>
  <option value="CA">Canada</option>
  <option value="GB">United Kingdom</option>
  <option value="DE">Germany</option>
  <option value="FR">France</option>
</select>

<button id="pay-button">Complete Payment</button>
```

## API Reference

### CheckoutProcessor

#### Constructor

```javascript
new CheckoutProcessor(cart)
```

- `cart` (Object): Cart object containing subtotal and items

#### Methods

##### `calculateTax(region)`

Calculates tax based on the region's tax rate.

- **Parameters**: `region` (String) - Region code (e.g., 'US', 'CA')
- **Returns**: Number - Tax amount

##### `processPayment()`

Processes the payment including tax calculation and API submission.

- **Returns**: Promise - Resolves with payment result

##### `getUserRegion()`

Retrieves the selected region from the country selector.

- **Returns**: String - Region code

##### `getCurrency(region)`

Gets the appropriate currency for a region.

- **Parameters**: `region` (String) - Region code
- **Returns**: String - Currency code (e.g., 'USD', 'EUR')

## Supported Regions

### Tax Rates

| Region | Tax Rate |
|--------|----------|
| US     | 8%       |
| CA     | 13%      |

### Currencies

| Region | Currency |
|--------|----------|
| US     | USD      |
| CA     | CAD      |
| GB     | GBP      |
| DE     | EUR      |
| FR     | EUR      |
| Other  | USD (default) |

## Known Issues

⚠️ **Critical Bug**: The system currently breaks for EU users and other regions not listed in the `taxRates` object. When `calculateTax()` returns `undefined` for unsupported regions, `cart.total` becomes `NaN`, causing `toFixed()` to throw an error.

**Workaround**: Add default tax rate handling for unsupported regions.

## API Endpoint

The payment processor submits to:

```
POST /api/payments
Content-Type: application/json
```

**Payload**:
```json
{
  "amount": "108.00",
  "currency": "USD",
  "items": [...]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is available for use under standard open source practices.

---

*Last updated: October 21, 2025*
