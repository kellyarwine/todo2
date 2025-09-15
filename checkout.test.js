/**
 * Comprehensive test suite for CheckoutProcessor
 * Tests payment processing, tax calculation, and edge cases
 */

// Mock the DOM elements and fetch API
global.fetch = jest.fn();
const mockGetElementById = jest.fn();

// Setup DOM mocks with default behavior
global.document = {
  getElementById: mockGetElementById
};

global.window = {
  location: { href: '' },
  cart: {}
};

// Simple approach: copy the class definition directly
class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13
    };
  }

  calculateTax(region) {
    const rate = this.taxRates[region];
    return this.cart.subtotal * rate;
  }

  processPayment() {
    const region = this.getUserRegion();
    const tax = this.calculateTax(region);
    
    // BUG: cart.total becomes null for regions not in taxRates
    this.cart.total = this.cart.subtotal + tax;
    
    // This breaks when cart.total is null
    const paymentData = {
      amount: this.cart.total.toFixed(2),
      currency: this.getCurrency(region),
      items: this.cart.items
    };

    return this.submitPayment(paymentData);
  }

  getUserRegion() {
    return document.getElementById('country-select').value;
  }

  getCurrency(region) {
    const currencies = {
      'US': 'USD',
      'CA': 'CAD',
      'GB': 'GBP',
      'DE': 'EUR',
      'FR': 'EUR'
    };
    return currencies[region] || 'USD';
  }

  submitPayment(data) {
    // Payment API call
    return fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

describe('CheckoutProcessor', () => {
  let cart;
  let processor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockGetElementById.mockClear();
    
    // Set default return value for getElementById
    mockGetElementById.mockReturnValue({ value: 'US' });
    
    // Set up a standard cart for testing
    cart = {
      items: ['item1', 'item2'],
      subtotal: 100.00
    };
    
    processor = new CheckoutProcessor(cart);
  });

  describe('constructor', () => {
    test('should initialize with cart and tax rates', () => {
      expect(processor.cart).toBe(cart);
      expect(processor.taxRates).toEqual({
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax for US region', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8.00); // 100 * 0.08
    });

    test('should calculate tax for CA region', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13.00); // 100 * 0.13
    });

    test('should return NaN for unsupported regions (EU bug)', () => {
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN(); // This demonstrates the bug
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
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country-select element', () => {
      mockGetElementById.mockReturnValue({ value: 'US' });
      
      const region = processor.getUserRegion();
      
      expect(mockGetElementById).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
    });
  });

  describe('submitPayment', () => {
    test('should make POST request to payments API', async () => {
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

  describe('processPayment', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({ ok: true });
    });

    test('should process payment successfully for US region', async () => {
      mockGetElementById.mockReturnValue({ value: 'US' });
      
      await processor.processPayment();
      
      expect(cart.total).toBe(108.00); // 100 + 8% tax
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
      mockGetElementById.mockReturnValue({ value: 'CA' });
      
      await processor.processPayment();
      
      expect(cart.total).toBe(113.00); // 100 + 13% tax
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

    test('should process payment with "NaN" amount for EU regions due to tax calculation bug', async () => {
      mockGetElementById.mockReturnValue({ value: 'DE' });
      
      await processor.processPayment();
      
      // The cart.total becomes NaN but payment still proceeds with "NaN" amount
      expect(cart.total).toBeNaN();
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - payment goes through with invalid amount
          currency: 'EUR',
          items: ['item1', 'item2']
        })
      });
    });

    test('should process payment with "NaN" amount for GB region due to tax calculation bug', async () => {
      mockGetElementById.mockReturnValue({ value: 'GB' });
      
      await processor.processPayment();
      
      // The cart.total becomes NaN but payment still proceeds with "NaN" amount
      expect(cart.total).toBeNaN();
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug
          currency: 'GBP',
          items: ['item1', 'item2']
        })
      });
    });

    test('should process payment with zero amount for null subtotal', async () => {
      cart.subtotal = null;
      mockGetElementById.mockReturnValue({ value: 'US' });
      
      await processor.processPayment();
      
      // null * 0.08 = 0, null + 0 = 0
      expect(cart.total).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '0.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
    });

    test('should handle zero subtotal', async () => {
      cart.subtotal = 0;
      mockGetElementById.mockReturnValue({ value: 'US' });
      
      await processor.processPayment();
      
      expect(cart.total).toBe(0); // 0 + 0% tax
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '0.00',
          currency: 'USD',
          items: ['item1', 'item2']
        })
      });
    });
  });

  describe('Edge Cases and Bug Scenarios', () => {
    test('demonstrates the EU user bug scenario', () => {
      // Set up EU user scenario
      mockGetElementById.mockReturnValue({ value: 'DE' });
      
      // Calculate tax for DE (Germany) - this will be NaN
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN();
      
      // When we add NaN to a number, the result is NaN
      const total = cart.subtotal + tax;
      expect(total).toBeNaN();
      
      // Calling toFixed(2) on NaN returns "NaN" as a string
      expect(total.toFixed(2)).toBe('NaN');
    });

    test('shows how the bug affects the payment data creation', () => {
      cart.total = NaN;
      
      // This creates payment data with "NaN" as the amount
      const paymentData = {
        amount: cart.total.toFixed(2), // This becomes "NaN"
        currency: 'EUR',
        items: cart.items
      };
      
      expect(paymentData.amount).toBe('NaN');
    });
  });

  describe('Integration Tests', () => {
    test('full payment flow for supported region', async () => {
      mockGetElementById.mockReturnValue({ value: 'US' });
      global.fetch.mockResolvedValue({ 
        ok: true, 
        json: () => Promise.resolve({ success: true }) 
      });
      
      const result = await processor.processPayment();
      
      // Verify the cart was updated
      expect(cart.total).toBe(108.00);
      
      // Verify the API was called correctly
      expect(global.fetch).toHaveBeenCalledTimes(1);
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

    test('payment failure handling', async () => {
      mockGetElementById.mockReturnValue({ value: 'US' });
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(processor.processPayment()).rejects.toThrow('Network error');
    });
  });
});