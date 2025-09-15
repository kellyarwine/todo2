// checkout.test.js - Tests for CheckoutProcessor
// Tests the payment processing functionality including the tax calculation bug

// Mock DOM methods that the CheckoutProcessor relies on
global.document = {
  getElementById: jest.fn().mockReturnValue(null) // Default to null to prevent errors
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window object
global.window = {
  location: { href: '' }
};

// Import the class for testing (we'll need to export it first)
const CheckoutProcessor = require('./checkout.js');

describe('CheckoutProcessor', () => {
  let processor;
  let mockCart;

  beforeEach(() => {
    // Setup a mock cart for each test
    mockCart = {
      subtotal: 100,
      total: 0,
      items: ['item1', 'item2']
    };
    
    processor = new CheckoutProcessor(mockCart);
    
    // Reset mocks
    jest.clearAllMocks();
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
      expect(processor.getCurrency('')).toBe('USD');
      expect(processor.getCurrency(null)).toBe('USD');
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax correctly for supported regions', () => {
      expect(processor.calculateTax('US')).toBe(8); // 100 * 0.08
      expect(processor.calculateTax('CA')).toBe(13); // 100 * 0.13
    });

    test('should return NaN for unsupported regions (demonstrates the bug)', () => {
      // This test demonstrates the bug - tax calculation fails for unsupported regions
      expect(processor.calculateTax('GB')).toBeNaN(); // rate is undefined, 100 * undefined = NaN
      expect(processor.calculateTax('DE')).toBeNaN();
      expect(processor.calculateTax('FR')).toBeNaN();
    });
  });

  describe('getUserRegion', () => {
    test('should return value from country-select element', () => {
      const mockElement = { value: 'US' };
      document.getElementById.mockReturnValue(mockElement);

      expect(processor.getUserRegion()).toBe('US');
      expect(document.getElementById).toHaveBeenCalledWith('country-select');
    });
  });

  describe('submitPayment', () => {
    test('should call fetch with correct parameters', async () => {
      const mockPaymentData = {
        amount: '108.00',
        currency: 'USD',
        items: ['item1', 'item2']
      };

      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      await processor.submitPayment(mockPaymentData);

      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPaymentData)
      });
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for supported regions', async () => {
      // Mock DOM element to return US region
      const mockElement = { value: 'US' };
      document.getElementById.mockReturnValue(mockElement);

      // Mock successful API response
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      const result = await processor.processPayment();

      // Verify cart total was calculated correctly
      expect(mockCart.total).toBe(108); // 100 + 8 tax

      // Verify fetch was called with correct data
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

    test('should produce invalid payment data for unsupported regions (demonstrates the bug)', async () => {
      // Mock DOM element to return unsupported region
      const mockElement = { value: 'GB' };
      document.getElementById.mockReturnValue(mockElement);

      // Mock successful API response
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      await processor.processPayment();

      // The bug: cart.total becomes NaN, leading to invalid payment data
      expect(mockCart.total).toBeNaN(); // 100 + NaN = NaN

      // Verify fetch was called with invalid amount
      expect(fetch).toHaveBeenCalledWith('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 'NaN', // This is the bug - invalid amount
          currency: 'GBP',
          items: ['item1', 'item2']
        })
      });
    });
  });
});
