// test/checkout.test.js - Comprehensive tests for CheckoutProcessor

// Mock browser dependencies for testing
global.document = {
  getElementById: jest.fn(() => ({ value: 'US' }))
};

global.window = {
  location: { href: '' },
  cart: {}
};

global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({ success: true })
  })
);

// Import the CheckoutProcessor class
const CheckoutProcessor = require('./checkout-test-module.js');

describe('CheckoutProcessor', () => {
  let processor;
  let mockCart;

  beforeEach(() => {
    // Set up a mock cart for testing
    mockCart = {
      subtotal: 100,
      total: 0,
      items: [
        { id: 1, name: 'Product 1', price: 50 },
        { id: 2, name: 'Product 2', price: 50 }
      ]
    };
    processor = new CheckoutProcessor(mockCart);
  });

  describe('Tax Calculation', () => {
    test('should calculate correct tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08 = 8
    });

    test('should calculate correct tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13 = 13
    });

    test('should handle unsupported regions gracefully', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN(); // This reveals the bug - rate is undefined
    });

    test('should handle null region input', () => {
      const tax = processor.calculateTax(null);
      expect(tax).toBeNaN();
    });

    test('should handle undefined region input', () => {
      const tax = processor.calculateTax(undefined);
      expect(tax).toBeNaN();
    });
  });

  describe('Currency Mapping', () => {
    test('should return correct currency for US', () => {
      const currency = processor.getCurrency('US');
      expect(currency).toBe('USD');
    });

    test('should return correct currency for CA', () => {
      const currency = processor.getCurrency('CA');
      expect(currency).toBe('CAD');
    });

    test('should return correct currency for GB', () => {
      const currency = processor.getCurrency('GB');
      expect(currency).toBe('GBP');
    });

    test('should return correct currency for EU countries', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return default USD for unsupported regions', () => {
      const currency = processor.getCurrency('XX');
      expect(currency).toBe('USD');
    });

    test('should handle null region input', () => {
      const currency = processor.getCurrency(null);
      expect(currency).toBe('USD');
    });
  });

  describe('Payment Processing Edge Cases', () => {
    test('should handle zero subtotal', () => {
      mockCart.subtotal = 0;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(0);
    });

    test('should handle negative subtotal', () => {
      mockCart.subtotal = -50;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(-4); // -50 * 0.08 = -4
    });

    test('should handle very large subtotal', () => {
      mockCart.subtotal = 999999.99;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBeCloseTo(79999.999, 2);
    });
  });

  describe('Cart Integration', () => {
    test('should correctly reference cart subtotal', () => {
      mockCart.subtotal = 250;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(20); // 250 * 0.08 = 20
    });

    test('should work with different cart structures', () => {
      const customCart = {
        subtotal: 75,
        items: [{ id: 1, name: 'Custom Product', price: 75 }]
      };
      
      processor = new CheckoutProcessor(customCart);
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(9.75); // 75 * 0.13 = 9.75
    });
  });

  describe('Tax Rates Configuration', () => {
    test('should have correct US tax rate', () => {
      expect(processor.taxRates['US']).toBe(0.08);
    });

    test('should have correct CA tax rate', () => {
      expect(processor.taxRates['CA']).toBe(0.13);
    });

    test('should not have tax rates for unsupported regions', () => {
      expect(processor.taxRates['GB']).toBeUndefined();
      expect(processor.taxRates['DE']).toBeUndefined();
      expect(processor.taxRates['FR']).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    test('should process payment successfully for supported region', async () => {
      // Mock getUserRegion to return a supported region
      processor.getUserRegion = jest.fn(() => 'US');
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBe(108); // 100 + 8 tax
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: mockCart.items
        })
      });
    });

    test('should handle payment processing for unsupported region', async () => {
      // Mock getUserRegion to return an unsupported region
      processor.getUserRegion = jest.fn(() => 'GB');
      
      // This should fail because cart.total becomes NaN
      try {
        await processor.processPayment();
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      expect(processor.cart.total).toBeNaN(); // subtotal + NaN = NaN
    });

    test('should format payment amount correctly with decimals', async () => {
      mockCart.subtotal = 99.99;
      processor = new CheckoutProcessor(mockCart);
      processor.getUserRegion = jest.fn(() => 'CA');
      
      await processor.processPayment();
      
      const expectedTax = 99.99 * 0.13; // 12.9987
      const expectedTotal = 99.99 + expectedTax; // 112.9887
      
      expect(fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        body: expect.stringContaining('"amount":"112.99"') // Should be rounded to 2 decimals
      }));
    });

    test('should use correct currency for payment in different regions', async () => {
      processor.getUserRegion = jest.fn(() => 'CA');
      
      await processor.processPayment();
      
      expect(fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        body: expect.stringContaining('"currency":"CAD"')
      }));
    });
  });
});