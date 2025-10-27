import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CheckoutProcessor } from './checkout.js';

describe('CheckoutProcessor', () => {
  
  describe('constructor', () => {
    test('should initialize with cart and tax rates', () => {
      const cart = { subtotal: 100, items: [] };
      const processor = new CheckoutProcessor(cart);
      
      assert.strictEqual(processor.cart, cart);
      assert.deepStrictEqual(processor.taxRates, {
        'US': 0.08,
        'CA': 0.13
      });
    });
  });

  describe('calculateTax', () => {
    test('should calculate tax for US region', () => {
      const cart = { subtotal: 100 };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, 8); // 100 * 0.08
    });

    test('should calculate tax for CA region', () => {
      const cart = { subtotal: 100 };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('CA');
      assert.strictEqual(tax, 13); // 100 * 0.13
    });

    test('should return NaN for undefined region (demonstrates the bug)', () => {
      const cart = { subtotal: 100 };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('DE'); // Germany not in taxRates
      assert.ok(isNaN(tax)); // undefined * 100 = NaN
    });

    test('should handle zero subtotal', () => {
      const cart = { subtotal: 0 };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, 0);
    });
  });

  describe('getCurrency', () => {
    test('should return USD for US region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('US'), 'USD');
    });

    test('should return CAD for CA region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('CA'), 'CAD');
    });

    test('should return GBP for GB region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('GB'), 'GBP');
    });

    test('should return EUR for DE region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('DE'), 'EUR');
    });

    test('should return EUR for FR region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('FR'), 'EUR');
    });

    test('should return USD as default for unknown region', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getCurrency('XX'), 'USD');
    });
  });

  describe('getUserRegion', () => {
    test('should return default US region in test environment', () => {
      const processor = new CheckoutProcessor({});
      assert.strictEqual(processor.getUserRegion(), 'US');
    });
  });

  describe('submitPayment', () => {
    test('should return a promise in test environment', async () => {
      const processor = new CheckoutProcessor({});
      const data = { amount: '108.00', currency: 'USD' };
      
      const result = await processor.submitPayment(data);
      assert.ok(result.ok);
      assert.strictEqual(result.status, 200);
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully for US region', async () => {
      const cart = { 
        subtotal: 100, 
        items: [{ name: 'Test Item', price: 100 }] 
      };
      const processor = new CheckoutProcessor(cart);
      
      // Mock getUserRegion to return US
      processor.getUserRegion = () => 'US';
      
      const result = await processor.processPayment();
      
      // Check that cart.total was calculated correctly
      assert.strictEqual(cart.total, 108); // 100 + 8% tax
      assert.ok(result.ok);
    });

    test('should process payment successfully for CA region', async () => {
      const cart = { 
        subtotal: 100, 
        items: [{ name: 'Test Item', price: 100 }] 
      };
      const processor = new CheckoutProcessor(cart);
      
      // Mock getUserRegion to return CA
      processor.getUserRegion = () => 'CA';
      
      const result = await processor.processPayment();
      
      // Check that cart.total was calculated correctly
      assert.strictEqual(cart.total, 113); // 100 + 13% tax
      assert.ok(result.ok);
    });

    test('should demonstrate the bug for EU regions (DE)', async () => {
      const cart = { 
        subtotal: 100, 
        items: [{ name: 'Test Item', price: 100 }] 
      };
      const processor = new CheckoutProcessor(cart);
      
      // Mock getUserRegion to return DE (Germany)
      processor.getUserRegion = () => 'DE';
      
      try {
        await processor.processPayment();
        // Check that cart.total is NaN due to the bug
        assert.ok(isNaN(cart.total), 'cart.total should be NaN due to tax calculation bug');
      } catch (error) {
        // The bug might manifest as an error during toFixed() call
        assert.ok(error instanceof TypeError);
        assert.ok(error.message.includes('toFixed') || error.message.includes('NaN'));
      }
    });

    test('should demonstrate the bug for EU regions (FR)', async () => {
      const cart = { 
        subtotal: 100, 
        items: [{ name: 'Test Item', price: 100 }] 
      };
      const processor = new CheckoutProcessor(cart);
      
      // Mock getUserRegion to return FR (France)
      processor.getUserRegion = () => 'FR';
      
      try {
        await processor.processPayment();
        // Check that cart.total is NaN due to the bug
        assert.ok(isNaN(cart.total), 'cart.total should be NaN due to tax calculation bug');
      } catch (error) {
        // The bug might manifest as an error during toFixed() call
        assert.ok(error instanceof TypeError);
        assert.ok(error.message.includes('toFixed') || error.message.includes('NaN'));
      }
    });

    test('should handle zero subtotal correctly', async () => {
      const cart = { 
        subtotal: 0, 
        items: [] 
      };
      const processor = new CheckoutProcessor(cart);
      
      // Mock getUserRegion to return US
      processor.getUserRegion = () => 'US';
      
      const result = await processor.processPayment();
      
      // Check that cart.total was calculated correctly
      assert.strictEqual(cart.total, 0); // 0 + 0% tax
      assert.ok(result.ok);
    });

    test('should handle null/undefined cart values gracefully', () => {
      const cart = { subtotal: null, items: [] };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, 0); // null * 0.08 = 0
    });

    test('should handle negative subtotal', () => {
      const cart = { subtotal: -50, items: [] };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, -4); // -50 * 0.08 = -4
    });

    test('should handle large numbers correctly', () => {
      const cart = { subtotal: 999999.99, items: [] };
      const processor = new CheckoutProcessor(cart);
      
      const tax = processor.calculateTax('US');
      assert.strictEqual(tax, 79999.9992); // 999999.99 * 0.08
    });
  });
});
