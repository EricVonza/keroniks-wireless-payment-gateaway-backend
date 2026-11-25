require('dotenv').config();

const connectDB = require('../config/database');
const Customer = require('../models/Customer');

const accounts = [
    { accountNumber: 'BBF212-13', amount: 2000, ipAddress: '192.168.1.13' },
    { accountNumber: 'BBF212-12', amount: 1500, ipAddress: '192.168.1.12' },
    { accountNumber: 'BBF212-7', amount: 1500, ipAddress: '192.168.1.7' },
    { accountNumber: 'BBF212-5', amount: 1500, ipAddress: '192.168.1.5' },
    { accountNumber: 'BBF212-4', amount: 2000, ipAddress: '192.168.1.4' },
    { accountNumber: 'BBF214-11', amount: 2000, ipAddress: '192.168.1.99' }
];

const importAccounts = async () => {
    try {
        await connectDB();

        for (const record of accounts) {
            const accountNumber = record.accountNumber.trim().toUpperCase();

            await Customer.findOneAndUpdate(
                { accountNumber },
                {
                    $set: {
                        renewalAmount: record.amount,
                        renewalPlanName: '30-Day Internet',
                        renewalDurationDays: 30,
                        ipAddress: record.ipAddress
                    },
                    $setOnInsert: {
                        accountNumber,
                        customerName: accountNumber,
                        phoneNumber: '254700000000',
                        pppoeUsername: accountNumber.toLowerCase(),
                        status: 'EXPIRED'
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );
        }

        console.log(`Imported ${accounts.length} account renewal records.`);
    } catch (error) {
        console.error('Account import failed:', error.message);
        process.exitCode = 1;
    } finally {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
};

importAccounts();
