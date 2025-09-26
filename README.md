# todo2

A JavaScript-based checkout and payment processing system that handles multi-region tax calculations and currency conversion.

## Overview

This project provides a `CheckoutProcessor` class that manages e-commerce checkout operations, including:

- Multi-region tax calculation
- Currency conversion based on region
- Payment processing through API integration
- Shopping cart total calculation

## Features

- **Multi-region Support**: Handles tax rates for US and Canada
- **Currency Conversion**: Supports multiple currencies (USD, CAD, GBP, EUR)
- **Tax Calculation**: Automatic tax calculation based on user's region
- **Payment Processing**: Secure payment submission via API
- **Cart Management**: Integration with shopping cart system

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kellyarwine/todo2.git
cd todo2
```

2. Include the checkout.js file in your HTML page:
```html
<script src="checkout.js"></script>
```

## Usage

### Basic Implementation

1. Ensure your HTML includes the required elements:
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

2. Initialize a cart object with the required properties:
```javascript
window.cart = {
  subtotal: 100.00,
  items: [
    { name: "Product 1", price: 50.00 },
    { name: "Product 2", price: 50.00 }
  ]
};
```

3. The checkout processor will automatically handle payment button clicks and process payments.

### API Requirements

The system expects a payment API endpoint at `/api/payments` that accepts POST requests with the following payload:
```json
{
  "amount": "108.00",
  "currency": "USD",
  "items": [...]
}
```

## Known Issues

⚠️ **Current Bug**: The checkout system has a known issue affecting EU users:
- Tax calculation returns `undefined` for regions not explicitly defined in `taxRates`
- This causes `cart.total` to become `null` for EU regions
- Payment processing fails when trying to call `toFixed(2)` on a null value

### Affected Regions
- All EU countries except those explicitly supported (currently only US and CA have tax rates defined)
- Any region not included in the `taxRates` object

## Project Structure

```
todo2/
├── checkout.js     # Main checkout processing logic
├── test           # Test file (minimal content)
└── README.md      # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is available under the MIT License.

## Support

For questions or issues, please open an issue on the GitHub repository.