# Payment Checkout System

A JavaScript-based payment processing system that handles tax calculations and payment processing for e-commerce applications.

## Overview

This project provides a `CheckoutProcessor` class that manages the complete checkout flow, including:
- Tax calculation based on user region
- Currency handling for multiple countries
- Payment processing via API integration
- DOM integration for web applications

## Features

- **Multi-region Tax Support**: Supports different tax rates for various regions
- **Currency Conversion**: Automatic currency selection based on user region
- **Payment API Integration**: Seamless integration with payment processing APIs
- **Error Handling**: Built-in error handling for payment failures

## Installation

This is a client-side JavaScript module. Simply include the `checkout.js` file in your web application:

```html
<script src="checkout.js"></script>
```

## Usage

### Basic Setup

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

2. Initialize your cart object:
```javascript
window.cart = {
  subtotal: 100.00,
  items: [
    { name: "Product 1", price: 50.00 },
    { name: "Product 2", price: 50.00 }
  ]
};
```

3. The payment button will automatically handle the checkout process when clicked.

### Manual Usage

```javascript
// Create a checkout processor
const processor = new CheckoutProcessor(cart);

// Process payment
processor.processPayment()
  .then(result => {
    console.log('Payment successful!', result);
    window.location.href = '/success';
  })
  .catch(error => {
    console.error('Payment failed:', error);
  });
```

## Supported Regions

| Region | Tax Rate | Currency |
|--------|----------|----------|
| US     | 8%       | USD      |
| CA     | 13%      | CAD      |
| GB     | 0%*      | GBP      |
| DE     | 0%*      | EUR      |
| FR     | 0%*      | EUR      |

*Note: Tax rates for EU regions are not currently implemented (see Known Issues)

## API Endpoints

The system expects a payment API endpoint at `/api/payments` that accepts POST requests with the following payload:

```json
{
  "amount": "108.00",
  "currency": "USD",
  "items": [
    {
      "name": "Product 1",
      "price": 50.00
    }
  ]
}
```

## Known Issues

⚠️ **EU User Bug**: The system currently breaks for EU users because tax rates are not defined for European regions. When a user selects a European country, `cart.total` becomes `null`, causing the payment to fail.

**Temporary Workaround**: Ensure all regions in your country selector have corresponding tax rates defined in the `taxRates` object.

## Development

### Project Structure
```
.
├── checkout.js     # Main checkout processor class
├── test           # Test file (placeholder)
└── README.md      # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly, especially with different regions
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Testing

Currently, the project has minimal test coverage. When contributing, please ensure your changes work across all supported regions.

## Roadmap

- [ ] Fix EU tax calculation bug
- [ ] Add comprehensive test suite
- [ ] Add TypeScript definitions
- [ ] Implement more robust error handling
- [ ] Add support for discount codes
- [ ] Add tax calculation for more regions

## License

This project is open source. Please check with the repository owner for specific license terms.

## Support

If you encounter issues or have questions, please open an issue in the GitHub repository.