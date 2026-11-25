const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({

    // Customer's unique billing account number
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    // Customer's personal details
    customerName: {
        type: String,
        required: true,
        trim: true
    },

    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },

    // MikroTik PPPoE credentials
    pppoeUsername: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    macAddress: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        unique: true
    },

    ipAddress: {
        type: String,
        default: null
    },

    renewalAmount: {
        type: Number,
        min: 1,
        default: 150
    },

    renewalPlanName: {
        type: String,
        default: '30-Day Internet'
    },

    renewalDurationDays: {
        type: Number,
        min: 1,
        default: 30
    },

    // Subscription information
    subscriptionExpiry: {
        type: Date,
        default: null
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED'],
        default: 'EXPIRED'
    }

}, {
    timestamps: true
});

// Export Customer model
module.exports = mongoose.models.Customer ||
    mongoose.model('Customer', customerSchema);
