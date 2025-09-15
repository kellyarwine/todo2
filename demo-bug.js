#!/usr/bin/env node

// Demo script to show the checkout bug in action
const CheckoutProcessor = require('./checkout.js');

console.log('=== CheckoutProcessor Bug Demonstration ===\n');

// Mock cart
const cart = {
  subtotal: 100,
  items: [{ id: 1, name: 'Test Item', price: 100 }],
  total: null
};

// Test working regions
console.log('✅ Working regions:');
const processor = new CheckoutProcessor(cart);

console.log('US Tax:', processor.calculateTax('US'), '(Expected: 8)');
console.log('CA Tax:', processor.calculateTax('CA'), '(Expected: 13)');

// Test broken regions
console.log('\n❌ Broken regions (EU users):');
console.log('GB Tax:', processor.calculateTax('GB'), '(Expected: valid number, got NaN)');
console.log('DE Tax:', processor.calculateTax('DE'), '(Expected: valid number, got NaN)');
console.log('FR Tax:', processor.calculateTax('FR'), '(Expected: valid number, got NaN)');

// Show the payment processing bug
console.log('\n=== Payment Processing Bug ===');
console.log('When EU users try to pay, cart.total becomes NaN:');
console.log('cart.subtotal + NaN =', cart.subtotal + processor.calculateTax('GB'));
console.log('This would cause toFixed(2) to return "NaN" as the payment amount!');

console.log('\n=== Currency Support ===');
console.log('✅ Currencies are correctly configured for EU:');
console.log('GB Currency:', processor.getCurrency('GB'));
console.log('DE Currency:', processor.getCurrency('DE'));
console.log('FR Currency:', processor.getCurrency('FR'));

console.log('\n=== Summary ===');
console.log('The bug: Missing tax rates for EU countries causes NaN tax calculations');
console.log('Impact: EU users cannot complete payments due to invalid amounts');
console.log('Solution: Add tax rates for GB, DE, FR and other EU countries');