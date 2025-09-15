// checkout.test.js - Comprehensive tests for CheckoutProcessor
const CheckoutProcessor = require('./checkout.js');

describe('CheckoutProcessor', () => {
  let mockCart;
  let processor;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    mockCart = {
      subtotal: 100,
      items: ['item1', 'item2'],
      total: null
    };
    
    processor = new CheckoutProcessor(mockCart);

    // Mock DOM elements
    document.getElementById = jest.fn((id) => {
      if (id === 'country-select') {
        return { value: 'US' };
      }
      return { addEventListener: jest.fn() };
    });

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
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
    test('should calculate tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8); // 100 * 0.08
    });

    test('should calculate tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13); // 100 * 0.13
    });

    test('should return NaN for unsupported regions (EU bug)', () => {
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN(); // This exposes the bug
    });

    test('should return NaN for GB region (EU bug)', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN(); // This exposes the bug
    });

    test('should return NaN for undefined region', () => {
      const tax = processor.calculateTax(undefined);
      expect(tax).toBeNaN();
    });
  });

  describe('getCurrency', () => {
    test('should return USD for US', () => {
      expect(processor.getCurrency('US')).toBe('USD');
    });

    test('should return CAD for CA', () => {
      expect(processor.getCurrency('CA')).toBe('CAD');
    });

    test('should return GBP for GB', () => {
      expect(processor.getCurrency('GB')).toBe('GBP');
    });

    test('should return EUR for DE', () => {
      expect(processor.getCurrency('DE')).toBe('EUR');
    });

    test('should return EUR for FR', () => {
      expect(processor.getCurrency('FR')).toBe('EUR');
    });

    test('should return USD as default for unknown region', () => {
      expect(processor.getCurrency('XX')).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country-select element', () => {
      document.getElementById = jest.fn((id) => {
        if (id === 'country-select') {
          return { value: 'CA' };
        }
        return null;
      });

      const region = processor.getUserRegion();
      expect(region).toBe('CA');
      expect(document.getElementById).toHaveBeenCalledWith('country-select');
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for US region', async () => {
      document.getElementById = jest.fn((id) => {
        if (id === 'country-select') {
          return { value: 'US' };
        }
        return null;
      });

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
      document.getElementById = jest.fn((id) => {
        if (id === 'country-select') {
          return { value: 'CA' };
        }
        return null;
      });

      const result = await processor.processPayment();
      
      expect(mockCart.total).toBe(113); // 100 + 13 tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '113.00',
          currency: 'CAD',
          items: ['item1', 'item2']
        })
      });
    });

    test('should fail for EU regions due to tax calculation bug', async () => {
      document.getElementById = jest.fn((id) => {
        if (id === 'country-select') {
          return { value: 'DE' };
        }
        return null;
      });

      await processor.processPayment();
      
      // The bug: cart.total becomes NaN (100 + NaN = NaN)
      expect(mockCart.total).toBeNaN();
      
      // Verify the API call was made with NaN amount
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - sends "NaN" as amount
          currency: 'EUR',
          items: ['item1', 'item2']
        })
      });
    });

    test('should fail for GB region due to tax calculation bug', async () => {
      document.getElementById = jest.fn((id) => {
        if (id === 'country-select') {
          return { value: 'GB' };
        }
        return null;
      });

      await processor.processPayment();
      
      // The bug: cart.total becomes NaN (100 + NaN = NaN)  
      expect(mockCart.total).toBeNaN();
      
      // Verify the API call was made with NaN amount
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - sends "NaN" as amount
          currency: 'GBP',
          items: ['item1', 'item2']
        })
      });
    });
  });

  describe('submitPayment', () => {
    test('should make API call with correct data', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };

      await processor.submitPayment(paymentData);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });

    test('should handle API errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };

      await expect(processor.submitPayment(paymentData)).rejects.toThrow('Network error');
    });
  });
});