
const { initiateSTKPush } = require('../services/payheroService');
const { randomUUID } = require('crypto');

const initiatePayment = async (req, res) => {
    try {
        const {
            accountNumber,
            phoneNumber,
            amount,
            customerName
        } = req.body;

        // Validate required fields
        if (!accountNumber || !phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Account number, phone number and amount are required'
            });
        }

        // Validate amount
        if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive whole number'
            });
        }

        // Generate unique payment reference
        const externalReference =
            `${accountNumber}-${randomUUID()}`;

        // Send request to PayHero
        const payment = await initiateSTKPush({
            amount,
            phoneNumber,
            externalReference,
            customerName: customerName || accountNumber
        });

        return res.status(200).json({
            success: true,
            message: 'Payment request submitted',
            accountNumber,
            externalReference,
            payhero: payment
        });

    } catch (error) {
        console.error('Payment Controller Error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    initiatePayment
};
