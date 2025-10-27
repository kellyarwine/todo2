// checkout.js - Payment processing with tax calculation
// Deployed this morning - breaks for EU users

class CheckoutProcessor {
  constructor(cart) {
    this.cart = cart;
    this.taxRates = {
      'US': 0.08,
      'CA': 0.13
    };
  }

  // Handle long threads (arrays of numbers) - can process more than 20 elements
  processLongThread(numbers) {
    if (!Array.isArray(numbers)) {
      throw new Error('Input must be an array of numbers');
    }
    
    // Filter out non-numeric values and process the thread
    const validNumbers = numbers.filter(num => typeof num === 'number' && !isNaN(num));
    
    return {
      length: validNumbers.length,
      sum: validNumbers.reduce((acc, num) => acc + num, 0),
      canHandleLongThreads: validNumbers.length > 20,
      processedNumbers: validNumbers
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

// Event handler for payment button
document.getElementById('pay-button').addEventListener('click', () => {
  const processor = new CheckoutProcessor(window.cart);
  processor.processPayment()
    .then(result => {
      window.location.href = '/success';
    })
    .catch(error => {
      console.error('Payment failed:', error);
    });
});

// Test function for sum of specified numbers
function testSumOfNumbers() {
  const processor = new CheckoutProcessor({});
  
  // Numbers from the problem statement: 12,13,14,15,16,17,19,18,20,21,22,23,24,25,26,27,28,29,30
  const testNumbers = [12, 13, 14, 15, 16, 17, 19, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  
  const result = processor.processLongThread(testNumbers);
  
  console.log('Test Results:');
  console.log('Numbers processed:', result.processedNumbers);
  console.log('Length:', result.length);
  console.log('Sum:', result.sum);
  console.log('Can handle long threads (>20):', result.canHandleLongThreads);
  
  // Expected sum: 12+13+14+15+16+17+19+18+20+21+22+23+24+25+26+27+28+29+30 = 399
  const expectedSum = 399;
  const testPassed = result.sum === expectedSum && result.length === testNumbers.length;
  
  console.log('Expected sum:', expectedSum);
  console.log('Test passed:', testPassed);
  
  // Additional test with more than 20 numbers to verify long thread handling
  const longNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const longResult = processor.processLongThread(longNumbers);
  
  console.log('\nLong thread test (25 numbers):');
  console.log('Length:', longResult.length);
  console.log('Can handle long threads (>20):', longResult.canHandleLongThreads);
  console.log('Sum:', longResult.sum);
  
  return {
    passed: testPassed && longResult.canHandleLongThreads,
    actualSum: result.sum,
    expectedSum: expectedSum,
    canHandleLongThreads: longResult.canHandleLongThreads,
    longThreadTest: {
      length: longResult.length,
      sum: longResult.sum
    }
  };
}

// Run the test automatically
console.log('Running sum test...');
testSumOfNumbers();
