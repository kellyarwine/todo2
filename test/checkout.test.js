const CheckoutProcessor = require('../checkout.js');

// Mock fetch for testing
global.fetch = jest.fn();

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    mockCart = {
      subtotal: 100,
      items: ['item1', 'item2'],
      total: null
    };
    processor = new CheckoutProcessor(mockCart);
    
    // Reset fetch mock
    fetch.mockReset();
  });

  describe('calculateTax', () => {
    test('should calculate tax correctly for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate tax correctly for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should return NaN for unsupported regions (exposes the bug)', () => {
      const tax = processor.calculateTax('GB'); // Not in taxRates
      expect(tax).toBeNaN(); // This will be NaN because undefined * 100 = NaN
    });

    test('should return NaN for null region', () => {
      const tax = processor.calculateTax(null);
      expect(tax).toBeNaN();
    });

    test('should return NaN for undefined region', () => {
      const tax = processor.calculateTax(undefined);
      expect(tax).toBeNaN();
    });
  });

  describe('getCurrency', () => {
    test('should return correct currency for US', () => {
      expect(processor.getCurrency('US')).toBe('USD');
    });

    test('should return correct currency for CA', () => {
      expect(processor.getCurrency('CA')).toBe('CAD');
    });

    test('should return correct currency for GB', () => {
      expect(processor.getCurrency('GB')).toBe('GBP');
    });

    test('should return correct currency for DE', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
    });

    test('should return correct currency for FR', () => {
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return default USD for unsupported regions', () => {
      expect(processor.getCurrency('JP')).toBe('USD');
    });

    test('should return default USD for null region', () => {
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      // Mock getUserRegion to avoid DOM dependency
      processor.getUserRegion = jest.fn();
      // Mock fetch response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    test('should process payment successfully for US region', async () => {
      processor.getUserRegion.mockReturnValue('US');
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBe(108); // 100 + 8 (tax)
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
    });

    test('should process payment successfully for CA region', async () => {
      processor.getUserRegion.mockReturnValue('CA');
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBe(113); // 100 + 13 (tax)
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: ['item1', 'item2']
        })
      });
    });

    test('should result in NaN amount for unsupported regions (exposes the bug)', async () => {
      processor.getUserRegion.mockReturnValue('GB'); // Not in taxRates
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBeNaN(); // This will be NaN
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - amount becomes "NaN"
          currency: 'GBP',
          items: ['item1', 'item2']
        })
      });
    });

    test('should result in NaN amount for null region', async () => {
      processor.getUserRegion.mockReturnValue(null);
      
      const result = await processor.processPayment();
      
      expect(processor.cart.total).toBeNaN(); // This will be NaN
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - amount becomes "NaN"
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
    });
  });

  describe('submitPayment', () => {
    test('should make correct API call', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await processor.submitPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });

    test('should handle API error response', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };
      
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid payment data' })
      });

      const result = await processor.submitPayment(paymentData);
      
      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    });

    test('should handle network failure', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };
      
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(processor.submitPayment(paymentData)).rejects.toThrow('Network error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty cart items array', () => {
      const emptyCartProcessor = new CheckoutProcessor({
        subtotal: 100,
        items: [],
        total: null
      });

      const tax = emptyCartProcessor.calculateTax('US');
      expect(tax).toBe(8);
      expect(emptyCartProcessor.cart.items).toEqual([]);
    });

    test('should handle zero subtotal', () => {
      const zeroCartProcessor = new CheckoutProcessor({
        subtotal: 0,
        items: ['free-item'],
        total: null
      });

      const tax = zeroCartProcessor.calculateTax('US');
      expect(tax).toBe(0); // 0 * 0.08 = 0
    });

    test('should handle negative subtotal (edge case)', () => {
      const negativeCartProcessor = new CheckoutProcessor({
        subtotal: -50,
        items: ['refund-item'],
        total: null
      });

      const tax = negativeCartProcessor.calculateTax('CA');
      expect(tax).toBe(-6.5); // -50 * 0.13 = -6.5
    });

    test('should handle large subtotal amounts', () => {
      const largeCartProcessor = new CheckoutProcessor({
        subtotal: 999999.99,
        items: ['expensive-item'],
        total: null
      });

      const tax = largeCartProcessor.calculateTax('US');
      expect(tax).toBe(79999.9992); // 999999.99 * 0.08
    });

    test('should handle decimal precision in tax calculation', () => {
      const precisionCartProcessor = new CheckoutProcessor({
        subtotal: 123.45,
        items: ['precision-test'],
        total: null
      });

      const tax = precisionCartProcessor.calculateTax('CA');
      expect(tax).toBeCloseTo(16.0485, 4); // 123.45 * 0.13
    });

    test('should handle case-sensitive region codes', () => {
      // This test exposes that the implementation is case-sensitive
      const tax1 = processor.calculateTax('us'); // lowercase
      const tax2 = processor.calculateTax('US'); // uppercase
      
      expect(tax1).toBeNaN(); // Will be NaN because 'us' is not in taxRates
      expect(tax2).toBe(8);   // Will work because 'US' is in taxRates
    });
  });
});