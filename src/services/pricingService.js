const Subscription = require('../models/Subscription');

// One place that decides what a customer owes, used by BOTH the lookup and
// the payment routes so the amount shown is always the amount charged.
const getRenewalDetails = async (customer) => {
    const subscription = await Subscription.findOne({ customer: customer._id })
        .sort({ expiryDate: -1 });

    const amount =
        customer.renewalAmount ||
        subscription?.amount ||
        Number(process.env.RENEWAL_AMOUNT) ||
        null;

    const durationDays = customer.renewalDurationDays || subscription?.durationDays || 30;

    return {
        amount,
        durationDays,
        packageName: customer.renewalPlanName || subscription?.planName || '30-Day Internet'
    };
};

module.exports = { getRenewalDetails };