// Test setup for DOM mocking
global.fetch = jest.fn();

// Mock DOM elements that the checkout.js relies on
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

// Setup for mocking document elements
global.document = {
  getElementById: jest.fn()
};