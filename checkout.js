// Cart and Tax Calculator
class TaxCalculator {
    static calculateTax(subtotal, region) {
        if (region === 'US') {
            return subtotal * 0.08; // 8% US tax
        } else if (region === 'EU') {
            // FIXED: Use subtotal instead of non-existent euTaxRates.amount
            const euTaxRates = {
                VAT: 0.20, // 20% VAT
                digitalServicesTax: 0.03 // 3% digital services tax
            };
            
            // Fixed: Use subtotal for tax calculation instead of undefined .amount property
            let vatAmount = subtotal * euTaxRates.VAT;
            let digitalTax = subtotal * euTaxRates.digitalServicesTax;
            
            return vatAmount + digitalTax;
        }
        return 0;
    }
}

class Cart {
    constructor() {
        this.items = [
            { name: 'Todo App Pro License', price: 29.99 },
            { name: 'Premium Support', price: 19.99 }
        ];
        this.region = 'US';
        this.total = null;
    }

    calculateTotal() {
        try {
            const subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
            const tax = TaxCalculator.calculateTax(subtotal, this.region);
            this.total = subtotal + tax;
            return this.total;
        } catch (error) {
            console.error('Error calculating total:', error);
            // BUG: When tax calculation fails, total becomes null
            this.total = null;
            return null;
        }
    }

    setRegion(region) {
        this.region = region;
        this.calculateTotal();
        this.updateDisplay();
    }

    updateDisplay() {
        const totalElement = document.getElementById('total-display');
        const errorElement = document.getElementById('error-message');
        
        if (this.total === null || isNaN(this.total)) {
            totalElement.textContent = 'Total: Error calculating total';
            errorElement.textContent = 'Cannot read property \'amount\' of undefined';
            errorElement.style.display = 'block';
            document.getElementById('pay-button').disabled = true;
        } else {
            totalElement.textContent = `Total: $${this.total.toFixed(2)}`;
            errorElement.style.display = 'none';
            document.getElementById('pay-button').disabled = false;
        }
    }
}

// Initialize cart
const cart = new Cart();

// Set up region change handlers
document.addEventListener('DOMContentLoaded', function() {
    const regionRadios = document.querySelectorAll('input[name="region"]');
    
    regionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            cart.setRegion(this.value);
        });
    });

    // Initial calculation
    cart.calculateTotal();
    cart.updateDisplay();
});

// Payment processing function
function processPayment() {
    const errorElement = document.getElementById('error-message');
    
    if (cart.total === null) {
        errorElement.textContent = 'Cannot process payment: Total calculation failed';
        errorElement.style.display = 'block';
        return;
    }

    // This is where the "Cannot read property 'amount' of undefined" error
    // would prevent payment processing for EU users
    try {
        // Simulate payment processing
        alert(`Payment processed successfully for $${cart.total.toFixed(2)}`);
    } catch (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}