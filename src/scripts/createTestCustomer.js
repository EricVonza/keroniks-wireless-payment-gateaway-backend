
require('dotenv').config();

const connectDB = require('../config/database');
const Customer = require('../models/Customer');

const createTestCustomer = async () => {
    try {
        await connectDB();

        const testCustomer = {
            accountNumber: 'KW-TEST-001',
            customerName: 'Test Customer',
            phoneNumber: '254700000000',
            pppoeUsername: 'testuser001',
            macAddress: 'AA:BB:CC:DD:EE:01',
            ipAddress: null,
            status: 'EXPIRED'
        };

        // Avoid creating the same test customer twice
        const customer = await Customer.findOneAndUpdate(
            { accountNumber: testCustomer.accountNumber },
            { $setOnInsert: testCustomer },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        console.log('Test customer saved successfully:');
        console.log(customer);

    } catch (error) {
        console.error('Error creating test customer:', error.message);
        process.exitCode = 1;

    } finally {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
};

createTestCustomer();
