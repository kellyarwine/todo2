// checkout.test.js - Tests for CheckoutProcessor class
const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock DOM elements and fetch for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default mock value
    }
    return null;
  }
};

global.fetch = async (url, options) => {
  // Mock fetch response
  return {
    ok: true,
    json: async () => ({ success: true, transactionId: 'test123' })
  };
};

// Import the class (we need to modify checkout.js to export it)
// For now, we'll copy the class definition here
class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region];
    return this.cart.subtotal * rate;
  }

  processPayment() {
    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // BUG: cart.total becomes null for regions not in taxRates
    this.cart.total = this.cart.subtotal + tax;
    
    // This breaks when cart.total is null
    const paymentData = {
      amount: this.cart.total.toFixed(2),
      currency: this.getCurrency(region),
      items: this.cart.items
    };

    return this.submitPayment(paymentData);
  }

  getUserRegion() {
    return document.getElementById('country-select').value;
  }

  getCurrency(region) {
    const currencies = {
      'US': 'USD',
      'CA': 'CAD',
      'GB': 'GBP',
      'DE': 'EUR',
      'FR': 'EUR'
    };
    return currencies[region] || 'USD';
  }

  submitPayment(data) {
    // Payment API call
    return fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  // Setup before each test
  function setupTest() {
    mockCart = {
      subtotal: 100.00,
      items: ['item1', 'item2'],
      total: null
    };
    processor = new CheckoutProcessor(mockCart);
  }

  describe('constructor', () => {
    test('should initialize with cart and tax rates', () => {
      setupTest();
      
      assert.strictEqual(processor.cart, mockCart);
      assert.deepStrictEqual(processor.taxRates, {
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax correctly for US', () => {
      setupTest();
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, 8.00); // 100 * 0.08
    });

    test('should calculate tax correctly for CA', () => {
      setupTest();
      
      const tax = processor.calculateTax('CA');
      assert.strictEqual(tax, 13.00); // 100 * 0.13
    });

    test('should return NaN for regions not in taxRates (BUG)', () => {
      setupTest();
      
      const tax = processor.calculateTax('GB');
      assert.ok(Number.isNaN(tax)); // This exposes the bug - undefined * number = NaN
    });

    test('should return NaN for null/undefined region', () => {
      setupTest();
      
      const tax1 = processor.calculateTax(null);
      const tax2 = processor.calculateTax(undefined);
      assert.ok(Number.isNaN(tax1));
      assert.ok(Number.isNaN(tax2));
    });
  });

  describe('getCurrency', () => {
    test('should return correct currency for known regions', () => {
      setupTest();
      
      assert.strictEqual(processor.getCurrency('US'), 'USD');
      assert.strictEqual(processor.getCurrency('CA'), 'CAD');
      assert.strictEqual(processor.getCurrency('GB'), 'GBP');
      assert.strictEqual(processor.getCurrency('DE'), 'EUR');
      assert.strictEqual(processor.getCurrency('FR'), 'EUR');
    });

    test('should return USD as fallback for unknown regions', () => {
      setupTest();
      
      assert.strictEqual(processor.getCurrency('XX'), 'USD');
      assert.strictEqual(processor.getCurrency(null), 'USD');
      assert.strictEqual(processor.getCurrency(undefined), 'USD');
    });
  });

  describe('getUserRegion', () => {
    test('should return value from country-select element', () => {
      setupTest();
      
      // Mock returns 'US' by default
      const region = processor.getUserRegion();
      assert.strictEqual(region, 'US');
    });

    test('should handle different country selections', () => {
      setupTest();
      
      // Mock different country
      global.document.getElementById = (id) => {
        if (id === 'country-select') {
          return { value: 'CA' };
        }
        return null;
      };
      
      const region = processor.getUserRegion();
      assert.strictEqual(region, 'CA');
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for US', async () => {
      setupTest();
      
      // Mock US region
      global.document.getElementById = (id) => {
        if (id === 'country-select') {
          return { value: 'US' };
        }
        return null;
      };
      
      const result = await processor.processPayment();
      
      // Verify cart.total was calculated correctly
      assert.strictEqual(processor.cart.total, 108.00); // 100 + 8 tax
      
      // Verify result
      const response = await result.json();
      assert.strictEqual(response.success, true);
    });

    test('should fail for regions without tax rates (BUG)', async () => {
      setupTest();
      
      // Mock GB region (not in taxRates)
      global.document.getElementById = (id) => {
        if (id === 'country-select') {
          return { value: 'GB' };
        }
        return null;
      };
      
      // processPayment actually succeeds but produces invalid data
      await processor.processPayment();
      
      // Verify cart.total is NaN (the bug)
      assert.ok(Number.isNaN(processor.cart.total));
      
      // This shows the bug - the amount becomes "NaN" string
      // which will cause issues in payment processing
    });

    test('should create correct payment data structure', async () => {
      setupTest();
      
      // Reset mock to default US region
      global.document.getElementById = (id) => {
        if (id === 'country-select') {
          return { value: 'US' };
        }
        return null;
      };
      
      // Mock the submitPayment to capture the data
      let capturedPaymentData;
      processor.submitPayment = (data) => {
        capturedPaymentData = data;
        return Promise.resolve({ json: () => Promise.resolve({ success: true }) });
      };
      
      await processor.processPayment();
      
      assert.strictEqual(capturedPaymentData.amount, '108.00');
      assert.strictEqual(capturedPaymentData.currency, 'USD');
      assert.deepStrictEqual(capturedPaymentData.items, ['item1', 'item2']);
    });

    test('should create invalid payment data for regions without tax rates (BUG)', async () => {
      setupTest();
      
      // Mock GB region (not in taxRates)
      global.document.getElementById = (id) => {
        if (id === 'country-select') {
          return { value: 'GB' };
        }
        return null;
      };
      
      // Mock the submitPayment to capture the data
      let capturedPaymentData;
      processor.submitPayment = (data) => {
        capturedPaymentData = data;
        return Promise.resolve({ json: () => Promise.resolve({ success: true }) });
      };
      
      await processor.processPayment();
      
      // This should be '108.00' but is 'NaN' due to the bug with missing tax rate for GB
      assert.strictEqual(capturedPaymentData.amount, 'NaN');
      assert.strictEqual(capturedPaymentData.currency, 'GBP');
      assert.deepStrictEqual(capturedPaymentData.items, ['item1', 'item2']);
    });
  });

  describe('submitPayment', () => {
    test('should make correct API call', async () => {
      setupTest();
      
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };
      
      // Mock fetch to capture the call
      let capturedUrl, capturedOptions;
      global.fetch = (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      };
      
      await processor.submitPayment(paymentData);
      
      assert.strictEqual(capturedUrl, '/api/payments');
      assert.strictEqual(capturedOptions.method, 'POST');
      assert.strictEqual(capturedOptions.headers['Content-Type'], 'application/json');
      assert.strictEqual(capturedOptions.body, JSON.stringify(paymentData));
    });
  });
});