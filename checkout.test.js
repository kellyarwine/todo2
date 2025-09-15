/**
 * @jest-environment jsdom
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Import the CheckoutProcessor class
const CheckoutProcessor = require('./checkout.js');

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Create a mock cart
    mockCart = {
      subtotal: 100,
      total: 0,
      items: [
        { id: 1, name: 'Test Item', price: 100 }
      ]
    };

    // Mock DOM elements
    document.body.innerHTML = `
      <select id="country-select">
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="GB">Great Britain</option>
        <option value="DE">Germany</option>
        <option value="FR">France</option>
      </select>
      <button id="pay-button">Pay Now</button>
    `;

    processor = new CheckoutProcessor(mockCart);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    test('should initialize with cart and tax rates', () => {
      expect(processor.cart).toBe(mockCart);
      expect(processor.taxRates).toEqual({
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax correctly for US', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate tax correctly for Canada', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should handle undefined tax rate (BUG: returns NaN)', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN(); // This is the bug - undefined * 100 = NaN
    });

    test('should handle null region', () => {
      const tax = processor.calculateTax(null);
      expect(tax).toBeNaN();
    });

    test('should handle zero subtotal', () => {
      processor.cart.subtotal = 0;
      const tax = processor.calculateTax('US');
      expect(tax).toBe(0);
    });

    test('should handle negative subtotal', () => {
      processor.cart.subtotal = -50;
      const tax = processor.calculateTax('US');
      expect(tax).toBe(-4); // -50 * 0.08
    });

    test('should handle very large subtotal', () => {
      processor.cart.subtotal = 999999.99;
      const tax = processor.calculateTax('US');
      expect(tax).toBeCloseTo(79999.9992); // 999999.99 * 0.08
    });
  });

  describe('getCurrency', () => {
    test('should return correct currency for US', () => {
      expect(processor.getCurrency('US')).toBe('USD');
    });

    test('should return correct currency for Canada', () => {
      expect(processor.getCurrency('CA')).toBe('CAD');
    });

    test('should return correct currency for Great Britain', () => {
      expect(processor.getCurrency('GB')).toBe('GBP');
    });

    test('should return EUR for Germany', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
    });

    test('should return EUR for France', () => {
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should default to USD for unknown region', () => {
      expect(processor.getCurrency('XX')).toBe('USD');
    });

    test('should default to USD for null region', () => {
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country select element', () => {
      const selectElement = document.getElementById('country-select');
      selectElement.value = 'CA';
      expect(processor.getUserRegion()).toBe('CA');
    });

    test('should handle missing element gracefully', () => {
      document.body.innerHTML = '';
      expect(() => processor.getUserRegion()).toThrow();
    });
  });

  describe('submitPayment', () => {
    test('should make POST request to payment API', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: mockCart.items
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await processor.submitPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    test('should process payment successfully for US region', async () => {
      document.getElementById('country-select').value = 'US';
      
      const result = await processor.processPayment();

      expect(processor.cart.total).toBe(108); // 100 + 8
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

    test('should process payment successfully for Canada', async () => {
      document.getElementById('country-select').value = 'CA';
      
      const result = await processor.processPayment();

      expect(processor.cart.total).toBe(113); // 100 + 13
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: mockCart.items
        })
      });
    });

    test('should demonstrate the NaN bug for regions without tax rates', async () => {
      document.getElementById('country-select').value = 'GB';
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await processor.processPayment();
      
      // The bug: cart.total becomes NaN, resulting in invalid payment data
      expect(processor.cart.total).toBeNaN();
      
      // Verify that the API was called with invalid amount "NaN"
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug!
          currency: 'GBP',
          items: mockCart.items
        })
      });
    });

    test('should demonstrate the NaN bug for EU regions', async () => {
      document.getElementById('country-select').value = 'DE';
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await processor.processPayment();
      
      // The bug: cart.total becomes NaN, resulting in invalid payment data
      expect(processor.cart.total).toBeNaN();
      
      // Verify that the API was called with invalid amount "NaN"
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug!
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, transactionId: '12345' })
      });
    });

    test('should complete full payment flow for supported regions', async () => {
      document.getElementById('country-select').value = 'US';
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBe(108);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    test('should handle network errors properly', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      document.getElementById('country-select').value = 'US';
      
      await expect(processor.processPayment()).rejects.toThrow('Network error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty cart items', async () => {
      processor.cart.items = [];
      document.getElementById('country-select').value = 'US';
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await processor.processPayment();
      
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: []
        })
      });
    });

    test('should handle zero subtotal cart', () => {
      processor.cart.subtotal = 0;
      document.getElementById('country-select').value = 'US';
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(0);
      
      processor.cart.total = processor.cart.subtotal + tax;
      expect(processor.cart.total).toBe(0);
    });

    test('should handle invalid regions gracefully in getCurrency', () => {
      expect(processor.getCurrency(undefined)).toBe('USD');
      expect(processor.getCurrency('')).toBe('USD');
      expect(processor.getCurrency('INVALID')).toBe('USD');
    });
  });

  describe('Bug Documentation', () => {
    test('DOCUMENTED BUG: Tax calculation returns NaN for unsupported regions', () => {
      // This test documents the existing bug where regions not in taxRates
      // cause calculateTax to return NaN (undefined * number = NaN)
      const unsupportedRegions = ['GB', 'DE', 'FR', 'IT', 'ES'];
      
      unsupportedRegions.forEach(region => {
        const tax = processor.calculateTax(region);
        expect(tax).toBeNaN();
      });
    });

    test('DOCUMENTED BUG: processPayment sends invalid amount when cart.total is NaN', async () => {
      // This test documents the cascade failure where NaN tax calculation
      // leads to NaN cart.total, which becomes "NaN" string in the payment request
      document.getElementById('country-select').value = 'GB';
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await processor.processPayment();
      
      expect(processor.cart.total).toBeNaN();
      expect(fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        body: expect.stringContaining('"amount":"NaN"')
      }));
    });
  });
});