// test-setup.js - Jest setup for DOM mocking
// Mock DOM elements that checkout.js depends on
global.document = {
  getElementById: jest.fn((id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default to US for tests
    }
    if (id === 'pay-button') {
      return { addEventListener: jest.fn() };
    }
    return null;
  })
};

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

// Mock window object
global.window = {
  cart: {
    subtotal: 100,
    items: ['item1', 'item2'],
    total: null
  },
  location: {
    href: ''
  }
};