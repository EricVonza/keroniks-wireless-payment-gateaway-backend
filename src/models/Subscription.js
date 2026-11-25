
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({

    // Customer who owns this subscription
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    // Payment that funded this subscription
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        unique: true
    },

    // Subscription package
    planName: {
        type: String,
        default: '30-Day Internet'
    },

    amount: {
        type: Number,
        required: true,
        min: 1
    },

    durationDays: {
        type: Number,
        required: true,
        default: 30,
        min: 1
    },

    // Subscription period
    startDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date,
        required: true
    },

    // Subscription lifecycle
    status: {
        type: String,
        enum: ['SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
        default: 'ACTIVE'
    }

}, {
    timestamps: true
});

// Find subscriptions belonging to a customer
subscriptionSchema.index({
    customer: 1,
    expiryDate: -1
});

// Export Subscription model
module.exports = mongoose.models.Subscription ||
    mongoose.model('Subscription', subscriptionSchema);
