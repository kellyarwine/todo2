# todo2

A JavaScript payment processing module for e-commerce checkout flows with tax calculation support.

## Overview

This repository contains a `CheckoutProcessor` class that handles payment processing with automatic tax calculation based on user region. The processor integrates with a payment API and manages the complete checkout flow from tax calculation to payment submission.

## Features

- Regional tax calculation for US and Canada
- Multi-currency support (USD, CAD, GBP, EUR)
- Payment API integration
- Client-side checkout flow management

## Installation

Clone the repository:

```bash
git clone https://github.com/kellyarwine/todo2.git
cd todo2
```

Include the checkout script in your HTML:

```html
<script src="checkout.js"></script>
```

## Usage

The checkout processor requires a cart object with `subtotal` and `items` properties, and HTML elements with specific IDs:

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

Initialize your cart object:

```javascript
window.cart = {
  subtotal: 100.00,
  items: [
    { id: 1, name: "Product A", price: 50.00 },
    { id: 2, name: "Product B", price: 50.00 }
  ]
};
```

The checkout processor will automatically handle the payment flow when the pay button is clicked.

## API

### CheckoutProcessor

#### Constructor

```javascript
new CheckoutProcessor(cart)
```

Creates a new checkout processor instance.

**Parameters:**
- `cart` (Object): Cart object containing `subtotal` and `items`

#### Methods

##### `calculateTax(region)`

Calculates tax for the given region.

**Parameters:**
- `region` (String): Region code (e.g., 'US', 'CA')

**Returns:** Tax amount (Number)

##### `processPayment()`

Processes the complete payment flow including tax calculation and payment submission.

**Returns:** Promise that resolves with payment result

##### `getUserRegion()`

Retrieves the selected region from the country select element.

**Returns:** Region code (String)

##### `getCurrency(region)`

Gets the appropriate currency for a region.

**Parameters:**
- `region` (String): Region code

**Returns:** Currency code (String)

##### `submitPayment(data)`

Submits payment data to the payment API.

**Parameters:**
- `data` (Object): Payment data including amount, currency, and items

**Returns:** Promise from fetch API call

## Known Issues

There is a known bug affecting EU users where the checkout process fails for regions not included in the `taxRates` object. When `calculateTax()` returns `undefined` for unsupported regions, the `cart.total` becomes `NaN`, causing the `toFixed()` call to fail.

**Affected regions:** GB, DE, FR, and other regions not in the taxRates map

**Workaround:** Add tax rates for all supported regions or implement a default tax rate fallback.

## Configuration

### Supported Tax Rates

Currently configured tax rates:
- US: 8%
- CA: 13%

### Supported Currencies

- USD (United States)
- CAD (Canada)
- GBP (United Kingdom)
- EUR (Germany, France)

## API Endpoint

The processor submits payments to `/api/payments` via POST request with JSON payload:

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

This project is open source and available under the MIT License.
