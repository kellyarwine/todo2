# Todo2 - Payment Processing Application

A JavaScript application with checkout functionality that includes tax calculation and payment processing.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific tests (e.g., bug documentation)
npx jest --testNamePattern="DOCUMENTED BUG"
```

## Application Structure

- `checkout.js` - Main checkout processor with tax calculation and payment handling
- `checkout.test.js` - Comprehensive test suite (29 tests)
- `TEST_DOCUMENTATION.md` - Detailed testing documentation

## Known Issues

⚠️ **Critical Bug**: The application currently has a bug affecting EU users where regions without defined tax rates (GB, DE, FR) result in invalid payment amounts being sent to the payment API.

**Details:**
- Tax calculation returns `NaN` for unsupported regions
- This causes payment requests with `amount: "NaN"`
- Affects all users outside of US and Canada

**See Tests**: Run `npx jest --testNamePattern="BUG"` to see all documented bugs.

## Features

✅ **Working Functionality:**
- US and Canada tax calculation
- Currency mapping for all regions  
- Payment API integration
- DOM interaction for region selection

🐛 **Issues Identified by Tests:**
- Missing tax rates for EU regions
- No validation for NaN amounts
- No error handling for unsupported regions

## Testing

The test suite provides:
- **76% code coverage**
- **29 comprehensive tests**
- **Bug documentation and reproduction**
- **Edge case validation**
- **Integration testing**

## Development

To develop and test changes:

1. Make code changes to `checkout.js`
2. Run tests: `npm test`
3. Check coverage: `npm run test:coverage`
4. Verify no new issues: `npx jest --testNamePattern="BUG"`

## Contributing

1. Ensure all tests pass
2. Add tests for new functionality
3. Update documentation as needed
4. Run coverage report to maintain >75% coverage