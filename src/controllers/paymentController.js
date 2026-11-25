
const { initiateSTKPush } = require('../services/payheroService');
const { randomUUID } = require('crypto');

// Normalize Kenyan mobile numbers to 254 format
const normalizePhoneNumber = (phone) => {
    let number = String(phone).replace(/\D/g, '');

    if (number.startsWith('0') && number.length === 10) {
        number = '254' + number.slice(1);
    } else if (
        (number.startsWith('7') || number.startsWith('1')) &&
        number.length === 9
    ) {
        number = '254' + number;
    }

    if (!/^254[17]\d{8}$/.test(number)) {
        return null;
    }

    return number;
};

const initiatePayment = async (req, res) => {
    try {
        const {
            accountNumber,
            phoneNumber,
            amount,
            customerName
        } = req.body;

        // Validate required fields
        if (!accountNumber || !phoneNumber || amount === undefined) {
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

        // Normalize phone number
        const formattedPhone = normalizePhoneNumber(phoneNumber);

        if (!formattedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Kenyan phone number'
            });
        }

        // Generate unique reference
        const externalReference =
            `KW-${randomUUID()}`;

        // Initiate STK Push
        const payment = await initiateSTKPush({
            amount: Number(amount),
            phoneNumber: formattedPhone,
            externalReference,
            customerName: customerName || accountNumber
        });

        return res.status(202).json({
            success: true,
            message: 'STK Push successfully queued',
            accountNumber,
            externalReference,
            paymentStatus: payment.status,
            payheroReference: payment.reference,
            checkoutRequestID: payment.CheckoutRequestID
        });

    } catch (error) {
        console.error(
            'Payment Controller Error:',
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    initiatePayment
};
