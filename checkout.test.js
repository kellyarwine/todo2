/**
 * Tests for CheckoutProcessor class
 * These tests validate the payment processing functionality and identify bugs
 */

const CheckoutProcessor = require('./checkout.js');

// Mock fetch for API calls
global.fetch = jest.fn();

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    // Setup mock cart
    mockCart = {
      subtotal: 100,
      items: [
        { id: 1, name: 'Product 1', price: 50 },
        { id: 2, name: 'Product 2', price: 50 }
      ]
    };

    processor = new CheckoutProcessor(mockCart);
  });

  describe('calculateTax', () => {
    test('calculates correct tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('calculates correct tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('returns NaN for unsupported regions (BUG)', () => {
      const tax = processor.calculateTax('DE'); // Germany - not in taxRates
      expect(tax).toBeNaN(); // This exposes the bug: undefined * number = NaN
    });

    test('returns NaN for null region', () => {
      const tax = processor.calculateTax(null);
      expect(tax).toBeNaN();
    });
  });

  describe('getCurrency', () => {
    test('returns correct currency for supported regions', () => {
      expect(processor.getCurrency('US')).toBe('USD');
      expect(processor.getCurrency('CA')).toBe('CAD');
      expect(processor.getCurrency('GB')).toBe('GBP');
      expect(processor.getCurrency('DE')).toBe('EUR');
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('returns USD for unsupported regions', () => {
      expect(processor.getCurrency('XX')).toBe('USD');
      expect(processor.getCurrency('')).toBe('USD');
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      // Mock getUserRegion method for each test
      jest.spyOn(processor, 'getUserRegion');
    });

    test('processes payment successfully for US region', async () => {
      processor.getUserRegion.mockReturnValue('US');
      
      const result = await processor.processPayment();
      
      expect(mockCart.total).toBe(108); // 100 + 8 tax
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

    test('processes payment successfully for CA region', async () => {
      processor.getUserRegion.mockReturnValue('CA');
      
      await processor.processPayment();
      
      expect(mockCart.total).toBe(113); // 100 + 13 tax
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

    test('FAILS for EU regions due to bug - cart.total becomes NaN', async () => {
      processor.getUserRegion.mockReturnValue('DE'); // Germany
      
      // This test demonstrates the bug that breaks for EU users
      // calculateTax('DE') returns NaN, cart.total becomes NaN
      await processor.processPayment();
      
      expect(mockCart.total).toBeNaN();
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // BUG: Invalid amount sent to payment API!
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });

    test('FAILS for unsupported regions due to bug', async () => {
      processor.getUserRegion.mockReturnValue('JP'); // Japan
      
      // This test also demonstrates the bug
      await processor.processPayment();
      
      expect(mockCart.total).toBeNaN();
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // BUG: Invalid amount sent to payment API!
          currency: 'USD', // Japan falls back to USD
          items: mockCart.items
        })
      });
    });

    test('handles API failures gracefully', async () => {
      processor.getUserRegion.mockReturnValue('US');
      fetch.mockRejectedValue(new Error('API Error'));
      
      await expect(processor.processPayment()).rejects.toThrow('API Error');
    });
  });

  describe('Edge cases', () => {
    test('handles zero subtotal', () => {
      mockCart.subtotal = 0;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(0);
    });

    test('handles negative subtotal', () => {
      mockCart.subtotal = -50;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(-4); // -50 * 0.08
    });

    test('handles missing cart items', async () => {
      mockCart.items = undefined;
      processor = new CheckoutProcessor(mockCart);
      jest.spyOn(processor, 'getUserRegion').mockReturnValue('US');
      
      await expect(processor.processPayment()).resolves.toBeDefined();
    });
  });

  describe('Bug demonstration - tax calculation', () => {
    test('shows the exact bug: undefined tax rate causes NaN', () => {
      // The bug: taxRates doesn't include EU countries
      expect(processor.taxRates['DE']).toBeUndefined();
      expect(processor.taxRates['FR']).toBeUndefined();
      expect(processor.taxRates['GB']).toBeUndefined();
      
      // When calculateTax is called with undefined rate
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN(); // undefined * 100 = NaN
      
      // This causes cart.total to become NaN
      const originalSubtotal = mockCart.subtotal;
      mockCart.total = originalSubtotal + tax;
      expect(mockCart.total).toBeNaN();
      
      // And NaN.toFixed(2) returns "NaN" string - THIS IS THE BUG!
      expect(mockCart.total.toFixed(2)).toBe('NaN');
    });
  });
});