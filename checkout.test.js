// checkout.test.js - Tests for CheckoutProcessor class

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('Running tests...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Mock DOM and fetch for testing
global.document = {
  getElementById: (id) => {
    if (id === 'country-select') {
      return { value: 'US' }; // Default test value
    }
    return null;
  }
};

global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true, transactionId: 'test123' })
  };
};

// CheckoutProcessor class definition (copied for testing)
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

// Test setup
const runner = new TestRunner();

// Mock cart data
const mockCart = {
  subtotal: 100,
  items: ['item1', 'item2'],
  total: null
};

// Test cases
runner.test('CheckoutProcessor constructor initializes correctly', () => {
  const processor = new CheckoutProcessor(mockCart);
  
  if (!processor.cart) throw new Error('Cart not set');
  if (!processor.taxRates) throw new Error('Tax rates not initialized');
  if (processor.taxRates.US !== 0.08) throw new Error('US tax rate incorrect');
  if (processor.taxRates.CA !== 0.13) throw new Error('CA tax rate incorrect');
});

runner.test('calculateTax works for US region', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('US');
  
  if (tax !== 8) throw new Error(`Expected 8, got ${tax}`);
});

runner.test('calculateTax works for CA region', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('CA');
  
  if (tax !== 13) throw new Error(`Expected 13, got ${tax}`);
});

runner.test('calculateTax returns NaN for unknown region (BUG)', () => {
  const processor = new CheckoutProcessor(mockCart);
  const tax = processor.calculateTax('DE'); // Germany not in taxRates
  
  // This test documents the existing bug
  if (!isNaN(tax)) throw new Error(`Expected NaN due to bug, got ${tax}`);
});

runner.test('getCurrency returns correct currency for US', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('US');
  
  if (currency !== 'USD') throw new Error(`Expected USD, got ${currency}`);
});

runner.test('getCurrency returns correct currency for GB', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('GB');
  
  if (currency !== 'GBP') throw new Error(`Expected GBP, got ${currency}`);
});

runner.test('getCurrency returns default USD for unknown region', () => {
  const processor = new CheckoutProcessor(mockCart);
  const currency = processor.getCurrency('XX');
  
  if (currency !== 'USD') throw new Error(`Expected USD, got ${currency}`);
});

runner.test('getUserRegion returns mocked country-select value', () => {
  const processor = new CheckoutProcessor(mockCart);
  const region = processor.getUserRegion();
  
  if (region !== 'US') throw new Error(`Expected US, got ${region}`);
});

runner.test('processPayment works for US region', async () => {
  // Mock the country selector for US
  global.document.getElementById = () => ({ value: 'US' });
  
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  const result = await processor.processPayment();
  
  if (!result.ok) throw new Error('Payment failed');
  if (testCart.total !== 108) throw new Error(`Expected total 108, got ${testCart.total}`);
});

runner.test('processPayment fails for EU region due to NaN bug', async () => {
  // Mock the country selector for Germany (EU)
  global.document.getElementById = () => ({ value: 'DE' });
  
  const testCart = { ...mockCart, total: null };
  const processor = new CheckoutProcessor(testCart);
  
  await processor.processPayment();
  
  // This documents the existing bug - cart.total becomes NaN
  if (!isNaN(testCart.total)) {
    throw new Error(`Expected cart.total to be NaN due to bug, got ${testCart.total}`);
  }
  
  // The payment "succeeds" but with invalid amount "NaN"
  console.log('  Note: Payment processes with amount "NaN" - this is the bug!');
});

runner.test('submitPayment makes correct API call', async () => {
  const processor = new CheckoutProcessor(mockCart);
  
  // Mock fetch to capture the request
  let capturedUrl, capturedOptions;
  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return { ok: true, json: async () => ({ success: true }) };
  };
  
  const paymentData = {
    amount: '108.00',
    currency: 'USD',
    items: ['item1', 'item2']
  };
  
  await processor.submitPayment(paymentData);
  
  if (capturedUrl !== '/api/payments') throw new Error(`Wrong URL: ${capturedUrl}`);
  if (capturedOptions.method !== 'POST') throw new Error('Wrong method');
  if (!capturedOptions.headers['Content-Type'].includes('application/json')) {
    throw new Error('Wrong content type');
  }
  
  const sentData = JSON.parse(capturedOptions.body);
  if (sentData.amount !== '108.00') throw new Error('Wrong amount sent');
});

// Run the tests
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});