// Test file to reproduce and verify the checkout bug fix
const { JSDOM } = require('jsdom');

// Mock DOM environment
const dom = new JSDOM(`
  <html>
    <body>
      <select id="country-select">
        <option value="US">United States</option>
        <option value="GB">United Kingdom</option>
        <option value="DE">Germany</option>
        <option value="FR">France</option>
      </select>
      <button id="pay-button">Pay Now</button>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;
global.fetch = () => Promise.resolve({ ok: true });

// Load and execute the checkout module (without the event listener)
const fs = require('fs');
const checkoutCode = fs.readFileSync('./checkout.js', 'utf8');
// Extract just the CheckoutProcessor class (everything before the event handler)
const classCode = checkoutCode.split('// Event handler')[0];
// Make CheckoutProcessor globally available
global.CheckoutProcessor = eval(`(function() { ${classCode} return CheckoutProcessor; })()`);

// Test cases
function testCheckout() {
  console.log('Testing checkout functionality...\n');

  // Test data
  const mockCart = {
    subtotal: 100.00,
    items: [{ name: 'Test Item', price: 100.00 }],
    total: null
  };

  // Test US (should work)
  console.log('=== Testing US Region (should work) ===');
  try {
    document.getElementById('country-select').value = 'US';
    const processor = new CheckoutProcessor(mockCart);
    processor.processPayment();
    console.log('✅ US region works fine');
    console.log('   Cart total:', mockCart.total);
    console.log('   Tax calculated:', mockCart.total - mockCart.subtotal);
  } catch (error) {
    console.log('❌ US region failed:', error.message);
  }

  // Reset cart
  mockCart.total = null;

  // Test GB (should fail with original code)
  console.log('\n=== Testing GB Region (currently broken) ===');
  try {
    document.getElementById('country-select').value = 'GB';
    const processor = new CheckoutProcessor(mockCart);
    processor.processPayment();
    console.log('Cart total after processPayment:', mockCart.total);
    if (isNaN(mockCart.total)) {
      console.log('❌ GB region failed: cart.total is NaN, would break toFixed(2)');
    } else {
      console.log('✅ GB region works');
      console.log('   Cart total:', mockCart.total);
      console.log('   Tax calculated:', mockCart.total - mockCart.subtotal);
      console.log('   toFixed(2) works:', mockCart.total.toFixed(2));
    }
  } catch (error) {
    console.log('❌ GB region failed:', error.message);
  }

  // Reset cart
  mockCart.total = null;

  // Test unknown region (should work with fallback)
  console.log('\n=== Testing Unknown Region (fallback to 0% tax) ===');
  try {
    document.getElementById('country-select').value = 'ZZ';
    const processor = new CheckoutProcessor(mockCart);
    processor.processPayment();
    console.log('Cart total after processPayment:', mockCart.total);
    if (isNaN(mockCart.total)) {
      console.log('❌ Unknown region failed: cart.total is NaN');
    } else {
      console.log('✅ Unknown region works with fallback');
      console.log('   Cart total:', mockCart.total);
      console.log('   Tax calculated:', mockCart.total - mockCart.subtotal);
    }
  } catch (error) {
    console.log('❌ Unknown region failed:', error.message);
  }

  // Reset cart
  mockCart.total = null;

  // Test DE (should fail with original code)
  console.log('\n=== Testing DE Region (currently broken) ===');
  try {
    document.getElementById('country-select').value = 'DE';
    const processor = new CheckoutProcessor(mockCart);
    processor.processPayment();
    console.log('Cart total after processPayment:', mockCart.total);
    if (isNaN(mockCart.total)) {
      console.log('❌ DE region failed: cart.total is NaN, would break toFixed(2)');
    } else {
      console.log('✅ DE region works');
      console.log('   Cart total:', mockCart.total);
      console.log('   Tax calculated:', mockCart.total - mockCart.subtotal);
      console.log('   toFixed(2) works:', mockCart.total.toFixed(2));
    }
  } catch (error) {
    console.log('❌ DE region failed:', error.message);
  }
}

if (require.main === module) {
  testCheckout();
}

module.exports = { testCheckout };