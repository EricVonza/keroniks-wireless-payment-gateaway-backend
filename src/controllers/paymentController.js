const { initiateSTKPush } = require('../services/payheroService');
const { randomUUID } = require('crypto');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const { getRenewalDetails } = require('../services/pricingService');

const normalizePhoneNumber = (phone) => {
    let number = String(phone).replace(/\D/g, '');

    if (number.startsWith('0') && number.length === 10) {
        number = '254' + number.slice(1);
    } else if ((number.startsWith('7') || number.startsWith('1')) && number.length === 9) {
        number = '254' + number;
    }

    return /^254[17]\d{8}$/.test(number) ? number : null;
};

const initiatePayment = async (req, res) => {
    try {
        const { accountNumber, phoneNumber } = req.body;

        if (!accountNumber || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Account number and phone number are required'
            });
        }

        const formattedPhone = normalizePhoneNumber(phoneNumber);
        if (!formattedPhone) {
            return res.status(400).json({ success: false, message: 'Invalid Kenyan phone number' });
        }

        const customer = await Customer.findOne({
            accountNumber: String(accountNumber).trim().toUpperCase()
        });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Billing account number not found' });
        }

        // Block duplicate STK prompts (e.g. double-click) within 2 minutes
        const recentPending = await Payment.findOne({
            customer: customer._id,
            status: 'PENDING',
            createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) }
        });
        if (recentPending) {
            return res.status(409).json({
                success: false,
                message: 'A payment is already in progress. Please check your phone.'
            });
        }

        const subscription = await Subscription.findOne({ customer: customer._id })
            .sort({ expiryDate: -1 });

        // The server alone decides the price
        const paymentAmount = customer.renewalAmount || subscription?.amount;

        if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
            console.error(`No valid amount configured for account ${customer.accountNumber}`);
            return res.status(400).json({
                success: false,
                message: 'We could not determine the amount due. Please contact support.'
            });
        }

        const externalReference = `KW-${randomUUID()}`;

        // Save the record BEFORE calling PayHero so the callback can always find it
        const payment = await Payment.create({
            customer: customer._id,
            accountNumber: customer.accountNumber,
            externalReference,
            amount: paymentAmount,
            currency: 'KES',
            phoneNumber: formattedPhone,
            provider: 'M-PESA',
            status: 'PENDING'
        });

        try {
            const response = await initiateSTKPush({
                amount: paymentAmount,
                phoneNumber: formattedPhone,
                externalReference,
                customerName: customer.customerName
            });

            payment.checkoutRequestId = response.CheckoutRequestID || null;
            payment.payheroReference = response.reference || null;
            payment.payheroResponse = response;
            await payment.save();
        } catch (pushError) {
            payment.status = 'FAILED';
            await payment.save();
            throw pushError;
        }

        return res.status(202).json({
            success: true,
            paymentId: externalReference // what the frontend polls with
        });
    } catch (error) {
        console.error('Payment Controller Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Payment could not be started. Please try again.'
        });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            externalReference: req.params.externalReference
        }).select('status failureReason');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Only what the frontend needs
        return res.status(200).json({
            status: payment.status, // 'PENDING' | 'SUCCESS' | 'FAILED'
            reason: payment.failureReason || undefined
        });
    } catch (error) {
        console.error('Payment Status Error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to retrieve payment status' });
    }
};

module.exports = { initiatePayment, getPaymentStatus };