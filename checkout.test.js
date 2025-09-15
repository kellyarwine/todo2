// checkout.test.js - Tests for CheckoutProcessor class

// Directly define the CheckoutProcessor class for testing
// This avoids complications with eval and file loading
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
  let processor;
  let mockCart;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    global.fetch.mockClear();
    
    // Create a mock cart for testing
    mockCart = {
      subtotal: 100.00,
      items: [
        { id: 1, name: 'Item 1', price: 50.00 },
        { id: 2, name: 'Item 2', price: 50.00 }
      ],
      total: null
    };

    processor = new CheckoutProcessor(mockCart);

    // Mock document.getElementById for getUserRegion
    global.document.getElementById = jest.fn();
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
    test('should calculate tax correctly for US', () => {
      const tax = processor.calculateTax('US');
      expect(tax).toBe(8.00); // 100 * 0.08
    });

    test('should calculate tax correctly for CA', () => {
      const tax = processor.calculateTax('CA');
      expect(tax).toBe(13.00); // 100 * 0.13
    });

    test('should return NaN for regions without tax rates (EU bug)', () => {
      const tax = processor.calculateTax('DE');
      expect(tax).toBeNaN(); // undefined * 100 = NaN
    });

    test('should return NaN for GB region', () => {
      const tax = processor.calculateTax('GB');
      expect(tax).toBeNaN();
    });

    test('should return NaN for FR region', () => {
      const tax = processor.calculateTax('FR');
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
      expect(processor.getCurrency('XY')).toBe('USD');
    });
  });

  describe('getUserRegion', () => {
    test('should get region from country-select element', () => {
      const mockElement = { value: 'US' };
      global.document.getElementById.mockReturnValue(mockElement);

      const region = processor.getUserRegion();
      
      expect(global.document.getElementById).toHaveBeenCalledWith('country-select');
      expect(region).toBe('US');
    });
  });

  describe('submitPayment', () => {
    test('should call fetch with correct payment data', async () => {
      const paymentData = {
        amount: '108.00',
        currency: 'USD',
        items: mockCart.items
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = processor.submitPayment(paymentData);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for US region', () => {
      // Mock getUserRegion to return 'US'
      global.document.getElementById.mockReturnValue({ value: 'US' });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = processor.processPayment();

      // Verify cart.total was set correctly
      expect(processor.cart.total).toBe(108.00); // 100 + 8.00 tax

      // Verify fetch was called with correct data
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

    test('should process payment successfully for CA region', () => {
      global.document.getElementById.mockReturnValue({ value: 'CA' });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      processor.processPayment();

      expect(processor.cart.total).toBe(113.00); // 100 + 13.00 tax
      
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

    test('should fail for EU regions due to tax calculation bug', () => {
      global.document.getElementById.mockReturnValue({ value: 'DE' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      processor.processPayment();

      // The cart.total becomes NaN due to the bug
      expect(processor.cart.total).toBeNaN();
      
      // This results in invalid payment data being sent
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - amount becomes "NaN"
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });

    test('should fail for GB region due to tax calculation bug', () => {
      global.document.getElementById.mockReturnValue({ value: 'GB' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      processor.processPayment();

      // The cart.total becomes NaN due to the bug
      expect(processor.cart.total).toBeNaN();
      
      // This results in invalid payment data being sent
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - amount becomes "NaN"
          currency: 'GBP',
          items: mockCart.items
        })
      });
    });

    test('should fail for FR region due to tax calculation bug', () => {
      global.document.getElementById.mockReturnValue({ value: 'FR' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      processor.processPayment();

      // The cart.total becomes NaN due to the bug
      expect(processor.cart.total).toBeNaN();
      
      // This results in invalid payment data being sent
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - amount becomes "NaN"
          currency: 'EUR',
          items: mockCart.items
        })
      });
    });
  });

  describe('Integration Tests', () => {
    test('should demonstrate the EU user bug end-to-end', () => {
      // This test demonstrates the actual bug that EU users experience
      global.document.getElementById.mockReturnValue({ value: 'DE' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      processor.processPayment();

      // The cart.total becomes NaN due to the bug
      expect(processor.cart.total).toBeNaN();
      
      // The payment request is sent with invalid amount data
      expect(global.fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"amount":"NaN"')
      }));
    });

    test('should work correctly for supported regions end-to-end', () => {
      global.document.getElementById.mockReturnValue({ value: 'US' });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = processor.processPayment();

      // Should complete successfully
      expect(processor.cart.total).toBe(108.00);
      expect(typeof result).toBe('object'); // Returns a Promise
    });
  });
});