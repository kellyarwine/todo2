// checkout.test.js - Tests for CheckoutProcessor class

// Mock DOM and fetch before importing the module
global.document = {
  getElementById: jest.fn()
};
global.fetch = jest.fn();
global.window = {};

// Import the CheckoutProcessor class
const CheckoutProcessor = require('./checkout.js');

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock cart object
    mockCart = {
      subtotal: 100,
      total: 0,
      items: ['item1', 'item2']
    };
    
    processor = new CheckoutProcessor(mockCart);
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

    test('should return NaN for unsupported regions (bug validation)', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN(); // This validates the existing bug
    });

    test('should return NaN for undefined region', () => {
      const tax = processor.calculateTax(undefined);
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

    test('should return correct currency for DE', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
    });

    test('should return correct currency for FR', () => {
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return default USD for unsupported regions', () => {
      expect(processor.getCurrency('JP')).toBe('USD');
    });

    test('should return default USD for undefined region', () => {
      expect(processor.getCurrency(undefined)).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country-select element', () => {
      // Create a spy on the existing function and mock it
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const mockElement = { value: 'US' };
      getElementByIdSpy.mockReturnValue(mockElement);
      
      const region = processor.getUserRegion();
      
      expect(getElementByIdSpy).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
      
      // Restore the spy
      getElementByIdSpy.mockRestore();
    });
  });

  describe('submitPayment', () => {
    test('should make POST request to payments API', () => {
      const mockResponse = Promise.resolve({ ok: true });
      fetch.mockReturnValue(mockResponse);
      
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };
      
      processor.submitPayment(paymentData);
      
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for supported region', async () => {
      // Setup spies for DOM and fetch
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      getElementByIdSpy.mockReturnValue({ value: 'US' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      const result = processor.processPayment();
      
      // Verify cart.total was calculated correctly
      expect(processor.cart.total).toBe(108); // 100 + 8 (US tax)
      
      // Verify payment was submitted
      expect(fetchSpy).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
      
      // Cleanup
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
      
      return result;
    });

    test('should fail for unsupported region due to NaN total (bug demonstration)', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      getElementByIdSpy.mockReturnValue({ value: 'GB' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      // The bug: cart.total becomes NaN for unsupported regions
      expect(processor.cart.total).toBeNaN();
      
      // The payment data contains "NaN" as amount, which would fail at the payment processor
      expect(fetchSpy).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - invalid amount
          currency: 'GBP', // GB region maps to GBP currency
          items: ['item1', 'item2']
        })
      });
      
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
    });

    test('should process payment with different cart subtotal', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      processor.cart.subtotal = 50;
      getElementByIdSpy.mockReturnValue({ value: 'US' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(54); // 50 + 4 (US tax)
      expect(fetchSpy).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '54.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
      
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
    });

    test('should use correct currency for CA region', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      getElementByIdSpy.mockReturnValue({ value: 'CA' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(113); // 100 + 13 (CA tax)
      expect(fetchSpy).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: ['item1', 'item2']
        })
      });
      
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
    });
  });

  describe('Edge cases and error scenarios', () => {
    test('should handle missing country-select element gracefully', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      getElementByIdSpy.mockReturnValue(null);
      
      expect(() => {
        processor.getUserRegion();
      }).toThrow(); // This will throw because null.value throws TypeError
      
      getElementByIdSpy.mockRestore();
    });

    test('should handle cart with zero subtotal', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      processor.cart.subtotal = 0;
      getElementByIdSpy.mockReturnValue({ value: 'US' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(0); // 0 + 0 (US tax)
      
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
    });

    test('should handle negative subtotal', () => {
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      processor.cart.subtotal = -50;
      getElementByIdSpy.mockReturnValue({ value: 'US' });
      fetchSpy.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(-54); // -50 + (-4) (US tax)
      
      getElementByIdSpy.mockRestore();
      fetchSpy.mockRestore();
    });
  });
});