const CheckoutProcessor = require('./checkout');

// Mock global objects for browser environment
global.document = {
  getElementById: jest.fn()
};
global.fetch = jest.fn();

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    mockCart = {
      subtotal: 100,
      total: null,
      items: ['item1', 'item2']
    };
    processor = new CheckoutProcessor(mockCart);
    
    // Reset mocks
    global.document.getElementById.mockReset();
    global.fetch.mockReset();
  });

  describe('calculateTax', () => {
    test('should calculate tax correctly for US', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate tax correctly for CA', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should return NaN for regions without tax rates (EU bug)', () => {
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN();
    });

    test('should return NaN for null region', () => {
      const tax = processor.calculateTax(null);
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

    test('should return correct currency for EU countries', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return USD as default for unknown regions', () => {
      expect(processor.getCurrency('XX')).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country select element', () => {
      const mockElement = { value: 'US' };
      global.document.getElementById.mockReturnValue(mockElement);

      const region = processor.getUserRegion();
      
      expect(global.document.getElementById).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      // Mock successful fetch response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    test('should process payment successfully for US region', async () => {
      const mockElement = { value: 'US' };
      global.document.getElementById.mockReturnValue(mockElement);

      const result = await processor.processPayment();

      expect(mockCart.total).toBe(108); // 100 + 8 tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
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
      const mockElement = { value: 'CA' };
      global.document.getElementById.mockReturnValue(mockElement);

      await processor.processPayment();

      expect(mockCart.total).toBe(113); // 100 + 13 tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: ['item1', 'item2']
        })
      }));
    });

    test('should result in NaN total for EU regions due to undefined tax (demonstrates the bug)', async () => {
      const mockElement = { value: 'DE' };
      global.document.getElementById.mockReturnValue(mockElement);

      await processor.processPayment();

      // The bug: cart.total becomes NaN because tax is NaN
      expect(mockCart.total).toBeNaN();
      
      // The payment API call still succeeds but with invalid data
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        body: JSON.stringify({
          amount: 'NaN',
          currency: 'EUR',
          items: ['item1', 'item2']
        })
      }));
    });

    test('should result in NaN total for null region', async () => {
      const mockElement = { value: null };
      global.document.getElementById.mockReturnValue(mockElement);

      await processor.processPayment();

      expect(mockCart.total).toBeNaN();
    });
  });

  describe('submitPayment', () => {
    test('should make POST request to payment API', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };

      global.fetch.mockResolvedValue({ ok: true });

      await processor.submitPayment(paymentData);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });
  });

  describe('Edge cases and integration', () => {
    test('should handle cart with zero subtotal', () => {
      const zeroCart = { subtotal: 0, total: null, items: [] };
      const zeroProcessor = new CheckoutProcessor(zeroCart);
      
      const tax = zeroProcessor.calculateTax('US');
      expect(tax).toBe(0);
    });

    test('should handle negative subtotal', () => {
      const negativeCart = { subtotal: -50, total: null, items: [] };
      const negativeProcessor = new CheckoutProcessor(negativeCart);
      
      const tax = negativeProcessor.calculateTax('US');
      expect(tax).toBe(-4); // -50 * 0.08
    });

    test('should handle large subtotal amounts', () => {
      const largeCart = { subtotal: 999999.99, total: null, items: [] };
      const largeProcessor = new CheckoutProcessor(largeCart);
      
      const tax = largeProcessor.calculateTax('US');
      expect(tax).toBeCloseTo(79999.9992, 4);
    });
  });
});
