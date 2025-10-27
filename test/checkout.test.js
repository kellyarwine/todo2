const CheckoutProcessor = require('../checkout.js');

// Mock DOM elements and fetch for testing
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
      total: 0,
      items: ['item1', 'item2']
    };
    processor = new CheckoutProcessor(mockCart);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with cart and tax rates', () => {
      expect(processor.cart).toBe(mockCart);
      expect(processor.taxRates).toEqual({
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    it('should calculate tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    it('should return NaN for unsupported regions', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN();
    });

    it('should return NaN for EU regions', () => {
      const taxDE = processor.calculateTax('DE');
      const taxFR = processor.calculateTax('FR');
      expect(taxDE).toBeNaN();
      expect(taxFR).toBeNaN();
    });

    it('should handle null region', () => {
      const tax = processor.calculateTax(null);
      expect(tax).toBeNaN();
    });

    it('should handle undefined region', () => {
      const tax = processor.calculateTax(undefined);
      expect(tax).toBeNaN();
    });
  });

  describe('getCurrency', () => {
    it('should return correct currency for supported regions', () => {
      expect(processor.getCurrency('US')).toBe('USD');
      expect(processor.getCurrency('CA')).toBe('CAD');
      expect(processor.getCurrency('GB')).toBe('GBP');
      expect(processor.getCurrency('DE')).toBe('EUR');
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    it('should return USD as default for unsupported regions', () => {
      expect(processor.getCurrency('AU')).toBe('USD');
      expect(processor.getCurrency('JP')).toBe('USD');
      expect(processor.getCurrency(null)).toBe('USD');
      expect(processor.getCurrency(undefined)).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    it('should get region from country-select element', () => {
      const mockElement = { value: 'US' };
      document.getElementById.mockReturnValue(mockElement);

      const region = processor.getUserRegion();
      
      expect(document.getElementById).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
    });
  });

  describe('submitPayment', () => {
    it('should make POST request to payments API', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ id: '123' }) };
      fetch.mockResolvedValue(mockResponse);

      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };

      const result = await processor.submitPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      // Mock getUserRegion to return a specific region
      processor.getUserRegion = jest.fn();
      processor.submitPayment = jest.fn();
    });

    it('should process payment successfully for US region', async () => {
      processor.getUserRegion.mockReturnValue('US');
      processor.submitPayment.mockResolvedValue({ ok: true });

      await processor.processPayment();

      expect(processor.cart.total).toBe(108); // 100 + 8 tax
      expect(processor.submitPayment).toHaveBeenCalledWith({
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      });
    });

    it('should process payment successfully for CA region', async () => {
      processor.getUserRegion.mockReturnValue('CA');
      processor.submitPayment.mockResolvedValue({ ok: true });

      await processor.processPayment();

      expect(processor.cart.total).toBe(113); // 100 + 13 tax
      expect(processor.submitPayment).toHaveBeenCalledWith({
        amount: '113.00',
        currency: 'CAD',
        items: ['item1', 'item2']
      });
    });

    it('should create invalid payment data for unsupported regions (demonstrates the bug)', async () => {
      processor.getUserRegion.mockReturnValue('GB');
      processor.submitPayment.mockResolvedValue({ ok: true });

      await processor.processPayment();

      // The bug: cart.total becomes NaN, resulting in invalid payment data
      expect(processor.cart.total).toBeNaN();
      expect(processor.submitPayment).toHaveBeenCalledWith({
        amount: 'NaN', // This is the bug - amount becomes "NaN"
        currency: 'GBP',
        items: ['item1', 'item2']
      });
    });

    it('should create invalid payment data for EU regions (demonstrates the bug)', async () => {
      processor.getUserRegion.mockReturnValue('DE');
      processor.submitPayment.mockResolvedValue({ ok: true });

      await processor.processPayment();

      // The bug: cart.total becomes NaN, resulting in invalid payment data
      expect(processor.cart.total).toBeNaN();
      expect(processor.submitPayment).toHaveBeenCalledWith({
        amount: 'NaN', // This is the bug - amount becomes "NaN"
        currency: 'EUR',
        items: ['item1', 'item2']
      });
    });
  });

  describe('Edge cases and error conditions', () => {
    beforeEach(() => {
      processor.getUserRegion = jest.fn();
      processor.submitPayment = jest.fn();
    });

    it('should handle zero subtotal', () => {
      mockCart.subtotal = 0;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(0);
    });

    it('should handle negative subtotal', () => {
      mockCart.subtotal = -100;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(-8);
    });

    it('should handle payment API errors', async () => {
      processor.getUserRegion.mockReturnValue('US');
      processor.submitPayment.mockRejectedValue(new Error('API Error'));

      await expect(processor.processPayment()).rejects.toThrow('API Error');
    });

    it('should handle cart with missing properties', () => {
      const incompleteCart = { subtotal: 50 }; // missing items and total
      processor = new CheckoutProcessor(incompleteCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(4); // 50 * 0.08
    });

    it('should handle very large subtotal amounts', () => {
      mockCart.subtotal = 999999.99;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBe(79999.9992); // 999999.99 * 0.08
    });

    it('should handle floating point precision', () => {
      mockCart.subtotal = 10.01;
      processor = new CheckoutProcessor(mockCart);
      
      const tax = processor.calculateTax('US');
      expect(tax).toBeCloseTo(0.8008); // 10.01 * 0.08
    });

    it('should handle empty cart items array', async () => {
      mockCart.items = [];
      processor.getUserRegion.mockReturnValue('US');
      processor.submitPayment.mockResolvedValue({ ok: true });

      await processor.processPayment();

      expect(processor.submitPayment).toHaveBeenCalledWith({
        amount: '108.00',
        currency: 'USD',
        items: []
      });
    });

    it('should handle missing country-select element', () => {
      document.getElementById.mockReturnValue(null);

      // This should return undefined when element is null
      const region = processor.getUserRegion();
      expect(region).toBeUndefined();
    });
  });
});