# Todo2 - Payment Checkout Processor

A JavaScript payment processing library for handling e-commerce checkout with tax calculation and multi-currency support.

## Overview

This project provides a `CheckoutProcessor` class that handles payment processing for e-commerce applications, including:
- Tax calculation based on user region
- Multi-currency support
- Payment API integration
- Shopping cart management

## Features

- **Tax Calculation**: Automatic tax rate application based on customer region
- **Multi-Currency Support**: Handles USD, CAD, GBP, and EUR
- **Payment Processing**: Integration with payment API endpoints
- **Region Detection**: Automatic user region detection from form inputs

## Installation

Include the `checkout.js` file in your HTML:

```html
<script src="checkout.js"></script>
```

## Usage

### Basic Setup

Ensure your HTML includes the required elements:
- A country selection dropdown with id `country-select`
- A payment button with id `pay-button`
- A shopping cart object available as `window.cart`

```html
<select id="country-select">
  <option value="US">United States</option>
  <option value="CA">Canada</option>
  <option value="GB">United Kingdom</option>
  <option value="DE">Germany</option>
  <option value="FR">France</option>
</select>

<button id="pay-button">Pay Now</button>
```

### Cart Object Structure

Your `window.cart` object should have the following structure:

```javascript
window.cart = {
  subtotal: 100.00,  // Subtotal amount before tax
  items: [
    { id: 1, name: "Product 1", price: 50.00, quantity: 1 },
    { id: 2, name: "Product 2", price: 50.00, quantity: 1 }
  ],
  total: null  // Will be calculated automatically
};
```

### Example

```javascript
// The payment button is automatically wired up
// When clicked, it will:
// 1. Detect the user's selected region
// 2. Calculate tax
// 3. Determine the appropriate currency
// 4. Submit the payment
// 5. Redirect to /success on completion

document.getElementById('pay-button').addEventListener('click', () => {
  const processor = new CheckoutProcessor(window.cart);
  processor.processPayment()
    .then(result => {
      window.location.href = '/success';
    })
    .catch(error => {
      console.error('Payment failed:', error);
    });
});
```

## Supported Regions

### Tax Rates
- **US**: 8%
- **CA**: 13%

### Currencies
- **US**: USD
- **CA**: CAD
- **GB**: GBP
- **DE**: EUR
- **FR**: EUR
- **Other regions**: USD (default)

## Known Issues

⚠️ **EU Region Bug**: The current implementation has a known issue where payments fail for regions without defined tax rates (e.g., GB, DE, FR). When `calculateTax()` returns `undefined` for these regions, `cart.total` becomes `NaN`, causing the `toFixed(2)` call to fail.

**Affected regions**: GB, DE, FR, and any other regions not in the `taxRates` object.

**Workaround**: A fix is needed to default to 0% tax rate for regions without defined tax rates.

## API Reference

### CheckoutProcessor

#### Constructor
```javascript
new CheckoutProcessor(cart)
```
- `cart` (Object): Shopping cart object with `subtotal` and `items`

#### Methods

##### `calculateTax(region)`
Calculates tax amount based on region.
- **Parameters**: `region` (String) - Region code
- **Returns**: Number - Tax amount

##### `processPayment()`
Processes the payment with tax calculation and currency conversion.
- **Returns**: Promise - Resolves on successful payment

##### `getUserRegion()`
Gets the user's selected region from the country dropdown.
- **Returns**: String - Region code

##### `getCurrency(region)`
Determines the appropriate currency for a region.
- **Parameters**: `region` (String) - Region code
- **Returns**: String - Currency code (USD, CAD, GBP, or EUR)

##### `submitPayment(data)`
Submits payment data to the API.
- **Parameters**: `data` (Object) - Payment data
- **Returns**: Promise - API response

## Development

### File Structure
```
.
├── checkout.js    # Main checkout processor implementation
├── test          # Test files
└── README.md     # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is available for use under standard open source licensing.

## Support

For issues or questions, please open an issue on the GitHub repository.
