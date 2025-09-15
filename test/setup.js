// Test setup for DOM environment
// Mock DOM elements that the checkout.js relies on
document.body.innerHTML = `
  <select id="country-select">
    <option value="US">United States</option>
    <option value="CA">Canada</option>
    <option value="GB">United Kingdom</option>
    <option value="DE">Germany</option>
    <option value="FR">France</option>
  </select>
  <button id="pay-button">Pay Now</button>
`;

// Mock window.cart for testing
global.window = window;
window.cart = {
  subtotal: 100,
  items: [
    { id: 1, name: 'Test Item', price: 100 }
  ],
  total: null
};

// Mock fetch for API calls
global.fetch = jest.fn();