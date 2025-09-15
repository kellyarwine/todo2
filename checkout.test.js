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
      const mockElement = { value: 'US' };
      document.getElementById.mockReturnValue(mockElement);
      
      const region = processor.getUserRegion();
      
      expect(document.getElementById).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
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
      // Mock getUserRegion to return 'US'
      document.getElementById.mockReturnValue({ value: 'US' });
      
      // Mock fetch for submitPayment
      fetch.mockReturnValue(Promise.resolve({ ok: true }));
      
      const result = processor.processPayment();
      
      // Verify cart.total was calculated correctly
      expect(processor.cart.total).toBe(108); // 100 + 8 (US tax)
      
      // Verify payment was submitted
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '108.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
      
      return result;
    });

    test('should fail for unsupported region due to NaN total (bug demonstration)', () => {
      // Mock getUserRegion to return unsupported region
      document.getElementById.mockReturnValue({ value: 'GB' });
      
      expect(() => {
        processor.processPayment();
      }).toThrow(); // This will throw because NaN.toFixed(2) throws TypeError
    });

    test('should process payment with different cart subtotal', () => {
      processor.cart.subtotal = 50;
      document.getElementById.mockReturnValue({ value: 'US' });
      fetch.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(54); // 50 + 4 (US tax)
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '54.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
    });

    test('should use correct currency for CA region', () => {
      document.getElementById.mockReturnValue({ value: 'CA' });
      fetch.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(113); // 100 + 13 (CA tax)
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
  });

  describe('Edge cases and error scenarios', () => {
    test('should handle missing country-select element gracefully', () => {
      document.getElementById.mockReturnValue(null);
      
      expect(() => {
        processor.getUserRegion();
      }).toThrow(); // This will throw because null.value throws TypeError
    });

    test('should handle cart with zero subtotal', () => {
      processor.cart.subtotal = 0;
      document.getElementById.mockReturnValue({ value: 'US' });
      fetch.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(0); // 0 + 0 (US tax)
    });

    test('should handle negative subtotal', () => {
      processor.cart.subtotal = -50;
      document.getElementById.mockReturnValue({ value: 'US' });
      fetch.mockReturnValue(Promise.resolve({ ok: true }));
      
      processor.processPayment();
      
      expect(processor.cart.total).toBe(-54); // -50 + (-4) (US tax)
    });
  });
});