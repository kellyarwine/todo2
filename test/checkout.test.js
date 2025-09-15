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
  });
});