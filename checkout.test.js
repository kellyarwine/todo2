// checkout.test.js - Comprehensive tests for CheckoutProcessor
const CheckoutProcessor = require('./checkout.js');

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    mockCart = {
      subtotal: 100,
      total: 0,
      items: [
        { id: 1, name: 'Item 1', price: 50 },
        { id: 2, name: 'Item 2', price: 50 }
      ]
    };
    processor = new CheckoutProcessor(mockCart);
  });

  describe('Tax Calculation', () => {
    test('should calculate correct tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate correct tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should return NaN for unsupported regions (exposes bug)', () => {
      const tax = processor.calculateTax('DE'); // Germany
      expect(tax).toBeNaN();
    });

    test('should return NaN for GB region (exposes bug)', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN();
    });

    test('should return NaN for FR region (exposes bug)', () => {
      const tax = processor.calculateTax('FR');
      expect(tax).toBeNaN();
    });

    // This test shows what the expected behavior should be
    test('EXPECTED: should default to 0 tax for unsupported regions (this fails with current bug)', () => {
      // This test demonstrates what the fix should accomplish
      // Currently fails because calculateTax returns NaN instead of 0
      const tax = processor.calculateTax('DE');
      expect(tax).toBe(0); // Expected behavior: default to 0% tax
    });
  });

  describe('Currency Mapping', () => {
    test('should return correct currency for supported regions', () => {
      expect(processor.getCurrency('US')).toBe('USD');
      expect(processor.getCurrency('CA')).toBe('CAD');
      expect(processor.getCurrency('GB')).toBe('GBP');
      expect(processor.getCurrency('DE')).toBe('EUR');
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return USD as default for unsupported regions', () => {
      expect(processor.getCurrency('JP')).toBe('USD');
      expect(processor.getCurrency('AU')).toBe('USD');
      expect(processor.getCurrency('')).toBe('USD');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      // Mock fetch for payment API
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should process payment successfully for US region', async () => {
      processor.testRegion = 'US';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await processor.processPayment();
      
      expect(mockCart.total).toBe(108); // 100 + 8 tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
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
      processor.testRegion = 'CA';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await processor.processPayment();
      
      expect(mockCart.total).toBe(113); // 100 + 13 tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: mockCart.items
        })
      });
    });

    test('should result in NaN total for EU regions due to NaN tax (demonstrates bug)', async () => {
      processor.testRegion = 'DE';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      // This should produce a payment with NaN amount
      await processor.processPayment();
      
      // Verify the cart.total is NaN due to NaN tax
      expect(isNaN(mockCart.total)).toBe(true);
      
      // Check that fetch was called with NaN amount
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN',
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });

    test('should result in NaN total for GB region due to NaN tax (demonstrates bug)', async () => {
      processor.testRegion = 'GB';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      
      await processor.processPayment();
      expect(isNaN(mockCart.total)).toBe(true);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN',
          currency: 'GBP',
          items: mockCart.items
        })
      });
    });

    test('should result in NaN total for FR region due to NaN tax (demonstrates bug)', async () => {
      processor.testRegion = 'FR';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      
      await processor.processPayment();
      expect(isNaN(mockCart.total)).toBe(true);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN',
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero subtotal', () => {
      mockCart.subtotal = 0;
      processor = new CheckoutProcessor(mockCart);
      
      expect(processor.calculateTax('US')).toBe(0);
      expect(processor.calculateTax('CA')).toBe(0);
    });

    test('should handle negative subtotal', () => {
      mockCart.subtotal = -50;
      processor = new CheckoutProcessor(mockCart);
      
      expect(processor.calculateTax('US')).toBe(-4);
      expect(processor.calculateTax('CA')).toBe(-6.5);
    });

    test('should handle empty region string', () => {
      expect(processor.calculateTax('')).toBeNaN();
      expect(processor.getCurrency('')).toBe('USD');
    });

    test('should handle null region', () => {
      expect(processor.calculateTax(null)).toBeNaN();
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('Constructor', () => {
    test('should initialize with provided cart', () => {
      const testCart = { subtotal: 200, items: [] };
      const testProcessor = new CheckoutProcessor(testCart);
      
      expect(testProcessor.cart).toBe(testCart);
      expect(testProcessor.taxRates).toEqual({
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should complete entire payment flow for supported regions', async () => {
      processor.testRegion = 'US';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, transactionId: 'tx_123' })
      });

      const initialSubtotal = mockCart.subtotal;
      const result = await processor.processPayment();
      
      // Verify tax calculation
      expect(processor.calculateTax('US')).toBe(8);
      
      // Verify total calculation
      expect(mockCart.total).toBe(108); // 100 + 8
      
      // Verify payment request
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: mockCart.items
        })
      });
      
      expect(result).toBeDefined();
    });

    test('should demonstrate bug in payment flow for EU regions', async () => {
      processor.testRegion = 'DE';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await processor.processPayment();
      
      // This demonstrates the bug:
      // 1. Tax calculation returns NaN
      expect(processor.calculateTax('DE')).toBeNaN();
      
      // 2. Cart total becomes NaN
      expect(isNaN(mockCart.total)).toBe(true);
      
      // 3. Payment API receives invalid data
      const fetchCall = global.fetch.mock.calls[0];
      const paymentData = JSON.parse(fetchCall[1].body);
      expect(paymentData.amount).toBe('NaN');
      expect(paymentData.currency).toBe('EUR');
      
      // This would cause payment failures in production
    });
  });
});