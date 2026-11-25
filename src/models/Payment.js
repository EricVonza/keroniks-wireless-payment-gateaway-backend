
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    accountNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },

    externalReference: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    amount: {
        type: Number,
        required: true,
        min: 1
    },

    currency: {
        type: String,
        default: 'KES'
    },

    phoneNumber: {
        type: String,
        required: true
    },

    provider: {
        type: String,
        default: 'M-PESA'
    },

    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },

    mpesaReceiptNumber: {
        type: String,
        default: undefined
    },

    checkoutRequestId: {
        type: String,
        default: null
    },

    payheroReference: {
        type: String,
        default: null
    },

    payheroResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    resultCode: {
        type: Number,
        default: null
    },

    resultDescription: {
        type: String,
        default: null
    },

    processedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Prevent duplicate M-Pesa receipt numbers.
paymentSchema.index(
    { mpesaReceiptNumber: 1 },
    {
        unique: true,
        sparse: true
    }
);

module.exports = mongoose.models.Payment ||
    mongoose.model('Payment', paymentSchema);
