const CheckoutProcessor = require('./checkout.js');

// Mock DOM elements for testing
global.document = {
  getElementById: jest.fn(() => ({
    value: 'DE' // Default to Germany (EU country not in taxRates)
  }))
};

// Mock fetch for testing
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

describe('CheckoutProcessor', () => {
  test('should handle tax calculation for EU regions not in taxRates without breaking payment processing', () => {
    // Arrange
    const mockCart = {
      subtotal: 100.00,
      items: ['item1', 'item2'],
      total: null
    };
    
    const processor = new CheckoutProcessor(mockCart);
    
    // Mock getUserRegion to return a European country not in taxRates
    jest.spyOn(processor, 'getUserRegion').mockReturnValue('DE'); // Germany
    
    // Act & Assert
    // This should not throw an error even though DE is not in taxRates
    // The bug causes cart.total to become NaN, which breaks toFixed(2)
    expect(() => {
      const tax = processor.calculateTax('DE');
      // Tax should be 0 or handled gracefully for unknown regions
      expect(tax).toBeDefined();
      
      // This is where the bug manifests - cart.total becomes NaN
      processor.cart.total = processor.cart.subtotal + tax;
      
      // This line would throw "Cannot read property 'toFixed' of null/undefined" 
      // or "NaN.toFixed is not a function" due to the bug
      const formattedAmount = processor.cart.total.toFixed(2);
      expect(formattedAmount).toBe('100.00'); // Should default to subtotal if no tax
    }).not.toThrow();
  });
});