// test.js - Node.js tests for CheckoutProcessor
// Run with: node test.js

// Mock DOM environment for Node.js
global.document = {
    getElementById: function(id) {
        if (id === 'country-select') {
            return { value: 'US' }; // Default test value
        }
        return null;
    }
};

global.fetch = function(url, options) {
    return Promise.resolve({
        json: () => Promise.resolve({ success: true })
    });
};

// Simple test for Node.js - just copy the CheckoutProcessor class directly
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
    return global.document.getElementById('country-select').value;
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
    return global.fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// Simple test framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.failed++;
        }
    }

    async testAsync(name, testFn) {
        try {
            await testFn();
            console.log(`✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.failed++;
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    summary() {
        const total = this.passed + this.failed;
        console.log(`\n📊 Test Summary: ${this.passed}/${total} passed`);
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`💥 ${this.failed} tests failed`);
        }
        return this.failed === 0;
    }
}

// Helper function to create mock cart
function createMockCart(subtotal = 100, items = ['item1', 'item2']) {
    return {
        subtotal: subtotal,
        items: items,
        total: null
    };
}

// Run tests
async function runTests() {
    const test = new TestFramework();
    
    console.log('🧪 Running CheckoutProcessor Tests\n');

    test.test('CheckoutProcessor constructor initializes correctly', () => {
        const cart = createMockCart();
        const processor = new CheckoutProcessor(cart);
        
        test.assert(processor.cart === cart, 'Cart should be stored');
        test.assert(processor.taxRates.US === 0.08, 'US tax rate should be 0.08');
        test.assert(processor.taxRates.CA === 0.13, 'CA tax rate should be 0.13');
    });

    test.test('calculateTax works for supported regions', () => {
        const cart = createMockCart(100);
        const processor = new CheckoutProcessor(cart);
        
        const usTax = processor.calculateTax('US');
        test.assertEqual(usTax, 8, 'US tax should be 8 for subtotal of 100');
        
        const caTax = processor.calculateTax('CA');
        test.assertEqual(caTax, 13, 'CA tax should be 13 for subtotal of 100');
    });

    test.test('calculateTax returns NaN for unsupported regions (demonstrates bug)', () => {
        const cart = createMockCart(100);
        const processor = new CheckoutProcessor(cart);
        
        const deTax = processor.calculateTax('DE');
        test.assert(isNaN(deTax), 'DE tax should be NaN (this demonstrates the bug)');
        
        const gbTax = processor.calculateTax('GB');
        test.assert(isNaN(gbTax), 'GB tax should be NaN (this demonstrates the bug)');
    });

    test.test('getCurrency works for all regions', () => {
        const cart = createMockCart();
        const processor = new CheckoutProcessor(cart);
        
        test.assertEqual(processor.getCurrency('US'), 'USD', 'US currency should be USD');
        test.assertEqual(processor.getCurrency('CA'), 'CAD', 'CA currency should be CAD');
        test.assertEqual(processor.getCurrency('GB'), 'GBP', 'GB currency should be GBP');
        test.assertEqual(processor.getCurrency('DE'), 'EUR', 'DE currency should be EUR');
        test.assertEqual(processor.getCurrency('FR'), 'EUR', 'FR currency should be EUR');
        test.assertEqual(processor.getCurrency('UNKNOWN'), 'USD', 'Unknown region should default to USD');
    });

    await test.testAsync('processPayment works for supported regions', async () => {
        const cart = createMockCart(100);
        const processor = new CheckoutProcessor(cart);
        
        // Mock getUserRegion to return US
        processor.getUserRegion = () => 'US';
        
        await processor.processPayment();
        test.assertEqual(cart.total, 108, 'Cart total should be 108 (100 + 8 tax)');
    });

    await test.testAsync('processPayment fails for unsupported regions (demonstrates bug)', async () => {
        const cart = createMockCart(100);
        const processor = new CheckoutProcessor(cart);
        
        // Mock getUserRegion to return DE (unsupported region)
        processor.getUserRegion = () => 'DE';
        
        let errorThrown = false;
        try {
            await processor.processPayment();
        } catch (error) {
            errorThrown = true;
            test.assert(error.message.includes('toFixed') || error.name === 'TypeError', 
                'Should fail due to calling toFixed on NaN/undefined');
        }
        
        if (!errorThrown) {
            // If no error was thrown, check if cart.total is NaN (which would cause the bug)
            test.assert(isNaN(cart.total), 'Cart total should be NaN due to the bug');
        }
    });

    await test.testAsync('submitPayment makes correct API call', async () => {
        const cart = createMockCart();
        const processor = new CheckoutProcessor(cart);
        
        const paymentData = {
            amount: '108.00',
            currency: 'USD',
            items: ['item1', 'item2']
        };
        
        const result = await processor.submitPayment(paymentData);
        test.assert(result, 'submitPayment should return a result');
    });

    return test.summary();
}

// Run the tests if this file is executed directly
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runTests, createMockCart, CheckoutProcessor };