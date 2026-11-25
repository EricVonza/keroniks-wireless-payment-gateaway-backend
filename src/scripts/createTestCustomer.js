require('dotenv').config();

const connectDB = require('../config/database');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

const createCustomer = async () => {
    try {
        await connectDB();

        const customerData = {
            accountNumber: process.env.SEED_ACCOUNT_NUMBER || 'KW-TEST-001',
            customerName: process.env.SEED_CUSTOMER_NAME || 'Test Customer',
            phoneNumber: process.env.SEED_PHONE_NUMBER || '254700000000',
            pppoeUsername: process.env.SEED_PPPOE_USERNAME || 'testuser001',
            macAddress: process.env.SEED_MAC_ADDRESS || 'AA:BB:CC:DD:EE:01',
            ipAddress: process.env.SEED_IP_ADDRESS || null,
            status: process.env.SEED_CUSTOMER_STATUS || 'EXPIRED'
        };

        const customer = await Customer.findOneAndUpdate(
            { accountNumber: customerData.accountNumber.toUpperCase() },
            { $set: customerData },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        console.log('Customer saved successfully');
        console.log({
            accountNumber: customer.accountNumber,
            customerName: customer.customerName,
            phoneNumber: customer.phoneNumber,
            status: customer.status
        });

        // Seed payment data
        const renewalAmount = Number(process.env.SEED_RENEWAL_AMOUNT || 150);

        if (!Number.isInteger(renewalAmount) || renewalAmount <= 0) {
            throw new Error('SEED_RENEWAL_AMOUNT must be a positive whole number');
        }

        const externalReference = `SEED-${customer.accountNumber}`;

        const payment = await Payment.findOneAndUpdate(
            { externalReference },
            {
                $set: {
                    customer: customer._id,
                    accountNumber: customer.accountNumber,
                    externalReference,
                    amount: renewalAmount,
                    currency: 'KES',
                    phoneNumber: customer.phoneNumber,
                    provider: 'M-PESA',
                    status: 'SUCCESS',
                    mpesaReceiptNumber: process.env.SEED_MPESA_RECEIPT || `SEED-${customer.accountNumber}`,
                    resultCode: 0,
                    resultDescription: 'Seed test payment',
                    processedAt: new Date()
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        console.log('Payment saved successfully');
        console.log({
            transactionId: payment.transactionId,
            amount: payment.amount,
            status: payment.status
        });

        // Seed subscription data
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + 30);

        await Subscription.findOneAndUpdate(
            { payment: payment._id },
            {
                $set: {
                    customer: customer._id,
                    payment: payment._id,
                    planName: '30-Day Internet',
                    amount: renewalAmount,
                    durationDays: 30,
                    startDate: now,
                    expiryDate,
                    status: 'ACTIVE'
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        await Customer.findByIdAndUpdate(customer._id, {
            $set: {
                status: 'ACTIVE',
                subscriptionExpiry: expiryDate
            }
        });

        console.log('Subscription saved successfully');
        console.log({
            accountNumber: customer.accountNumber,
            plan: '30-Day Internet',
            status: 'ACTIVE',
            endDate: expiryDate
        });

    } catch (error) {
        console.error('Error creating customer:', error.message);
        process.exitCode = 1;

    } finally {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
};

createCustomer();
