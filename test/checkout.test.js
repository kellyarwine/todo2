// Import the CheckoutProcessor class
const CheckoutProcessor = require('../checkout.js');

describe('CheckoutProcessor', () => {
  let processor;
  let mockCart;

  beforeEach(() => {
    // Reset cart for each test
    mockCart = {
      subtotal: 100,
      items: [
        { id: 1, name: 'Test Item', price: 100 }
      ],
      total: null
    };
    
    processor = new CheckoutProcessor(mockCart);
    
    // Reset fetch mock
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
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
    test('should calculate tax correctly for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate tax correctly for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should return NaN for EU regions (BUG)', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN();
    });

    test('should return NaN for Germany (BUG)', () => {
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN();
    });

    test('should return NaN for France (BUG)', () => {
      const tax = processor.calculateTax('FR');
      expect(tax).toBeNaN();
    });

    test('should return NaN for unknown regions', () => {
      const tax = processor.calculateTax('XX');
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

    test('should return USD as default for unknown regions', () => {
      expect(processor.getCurrency('XX')).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country-select dropdown', () => {
      document.getElementById('country-select').value = 'US';
      expect(processor.getUserRegion()).toBe('US');
    });

    test('should get different region values', () => {
      document.getElementById('country-select').value = 'GB';
      expect(processor.getUserRegion()).toBe('GB');
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for US region', async () => {
      document.getElementById('country-select').value = 'US';
      
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

    test('should process payment successfully for CA region', async () => {
      document.getElementById('country-select').value = 'CA';
      
      const result = await processor.processPayment();
      
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

    test('should process payment with NaN total for GB region (BUG)', async () => {
      document.getElementById('country-select').value = 'GB';
      
      const result = await processor.processPayment();
      
      // The bug: cart.total becomes NaN, leading to invalid payment data
      expect(mockCart.total).toBeNaN(); // 100 + NaN = NaN
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - invalid amount
          currency: 'GBP',
          items: mockCart.items
        })
      });
    });

    test('should process payment with NaN total for DE region (BUG)', async () => {
      document.getElementById('country-select').value = 'DE';
      
      const result = await processor.processPayment();
      
      // The bug: cart.total becomes NaN, leading to invalid payment data
      expect(mockCart.total).toBeNaN(); // 100 + NaN = NaN
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - invalid amount
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });

    test('should process payment with NaN total for FR region (BUG)', async () => {
      document.getElementById('country-select').value = 'FR';
      
      const result = await processor.processPayment();
      
      // The bug: cart.total becomes NaN, leading to invalid payment data
      expect(mockCart.total).toBeNaN(); // 100 + NaN = NaN
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - invalid amount
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });
  });

  describe('submitPayment', () => {
    test('should call fetch with correct parameters', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: mockCart.items
      };

      await processor.submitPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });

    test('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const paymentData = { amount: '100.00', currency: 'USD', items: [] };
      
      await expect(processor.submitPayment(paymentData)).rejects.toThrow('Network error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero subtotal', () => {
      const zeroCart = { subtotal: 0, items: [], total: null };
      const zeroProcessor = new CheckoutProcessor(zeroCart);
      
      const tax = zeroProcessor.calculateTax('US');
      expect(tax).toBe(0);
    });

    test('should handle negative subtotal', () => {
      const negativeCart = { subtotal: -50, items: [], total: null };
      const negativeProcessor = new CheckoutProcessor(negativeCart);
      
      const tax = negativeProcessor.calculateTax('US');
      expect(tax).toBe(-4); // -50 * 0.08
    });

    test('should handle large subtotal amounts', () => {
      const largeCart = { subtotal: 10000, items: [], total: null };
      const largeProcessor = new CheckoutProcessor(largeCart);
      
      const tax = largeProcessor.calculateTax('US');
      expect(tax).toBe(800); // 10000 * 0.08
    });
  });
});