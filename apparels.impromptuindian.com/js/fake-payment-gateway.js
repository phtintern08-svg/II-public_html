// ==========================================
// FAKE PAYMENT GATEWAY - Production Simulation
// ==========================================

class FakePaymentGateway {
    constructor() {
        this.processingDelay = 2000; // 2 seconds to simulate payment processing
        this.successRate = 95; // 95% success rate
    }

    /**
     * Process a fake card payment
     */
    async processCardPayment(cardDetails, amount) {
        console.log('Processing card payment:', { cardDetails, amount });

        // Validate card number (basic Luhn algorithm check)
        if (!this.validateCardNumber(cardDetails.number)) {
            throw new Error('Invalid card number');
        }

        // Validate expiry
        if (!this.validateExpiry(cardDetails.expiry)) {
            throw new Error('Card expired or invalid expiry date');
        }

        // Validate CVV
        if (cardDetails.cvv.length < 3) {
            throw new Error('Invalid CVV');
        }

        // Simulate payment processing
        await this.delay(this.processingDelay);

        // Random success/failure (95% success rate)
        if (Math.random() * 100 > this.successRate) {
            throw new Error('Payment declined by bank');
        }

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            method: 'card',
            amount: amount,
            timestamp: new Date().toISOString(),
            cardLast4: cardDetails.number.slice(-4)
        };
    }

    /**
     * Process a fake UPI payment
     */
    async processUpiPayment(upiId, amount) {
        console.log('Processing UPI payment:', { upiId, amount });

        // Validate UPI ID format
        if (!upiId.includes('@')) {
            throw new Error('Invalid UPI ID format');
        }

        // Simulate payment processing
        await this.delay(this.processingDelay);

        // Random success/failure
        if (Math.random() * 100 > this.successRate) {
            throw new Error('UPI transaction failed');
        }

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            method: 'upi',
            amount: amount,
            timestamp: new Date().toISOString(),
            upiId: upiId
        };
    }

    /**
     * Process a fake Net Banking payment
     */
    async processNetBankingPayment(bank, amount) {
        console.log('Processing Net Banking payment:', { bank, amount });

        if (!bank) {
            throw new Error('Please select a bank');
        }

        // Simulate payment processing
        await this.delay(this.processingDelay);

        // Random success/failure
        if (Math.random() * 100 > this.successRate) {
            throw new Error('Net banking transaction failed');
        }

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            method: 'netbanking',
            amount: amount,
            timestamp: new Date().toISOString(),
            bank: bank
        };
    }

    /**
     * Process Cash on Delivery (no actual payment, just record)
     */
    async processCOD(amount) {
        console.log('Processing COD:', { amount });

        // Simulate processing
        await this.delay(1000);

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            method: 'cod',
            amount: amount,
            timestamp: new Date().toISOString(),
            status: 'pending' // COD is pending until delivery
        };
    }

    /**
     * Validate card number using Luhn algorithm
     */
    validateCardNumber(cardNumber) {
        const num = cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(num)) return false;

        let sum = 0;
        let isEven = false;

        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    /**
     * Validate card expiry date
     */
    validateExpiry(expiry) {
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;

        const month = parseInt(match[1]);
        const year = parseInt('20' + match[2]);

        if (month < 1 || month > 12) return false;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    }

    /**
     * Generate a unique transaction ID
     */
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 9999);
        return `TXN${timestamp}${random}`;
    }

    /**
     * Delay helper function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get card type from card number
     */
    getCardType(cardNumber) {
        const num = cardNumber.replace(/\s/g, '');

        if (/^4/.test(num)) return 'Visa';
        if (/^5[1-5]/.test(num)) return 'Mastercard';
        if (/^3[47]/.test(num)) return 'American Express';
        if (/^6(?:011|5)/.test(num)) return 'Discover';
        if (/^35/.test(num)) return 'JCB';
        if (/^(6304|6706|6709|6771)/.test(num)) return 'RuPay';

        return 'Unknown';
    }

    /**
     * Verify payment status (for backend confirmation)
     */
    async verifyPayment(transactionId) {
        // Simulate verification API call
        await this.delay(500);

        return {
            verified: true,
            transactionId: transactionId,
            status: 'success'
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FakePaymentGateway;
}
