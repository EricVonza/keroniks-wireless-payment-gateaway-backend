const crypto = require('crypto');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const { activateCustomerNetwork } = require('../services/networkActivationService');

// Constant-time comparison of the secret in the callback URL
const secretsMatch = (provided, expected) => {
    if (!provided || !expected) return false;
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Pull the fields we need out of PayHero's payload
const parseCallback = (body) => {
    const r = body.response || body;
    const resultCode = Number(r.ResultCode ?? r.result_code);
    const amount = Number(r.Amount ?? r.amount);

    return {
        externalReference: r.ExternalReference || r.external_reference || null,
        resultCode: Number.isNaN(resultCode) ? null : resultCode,
        statusText: String(r.Status ?? r.status ?? '').toUpperCase(),
        amount: Number.isNaN(amount) ? null : amount,
        receipt: r.MpesaReceiptNumber || r.mpesa_receipt_number || null,
        checkoutRequestId: r.CheckoutRequestID || r.checkout_request_id || null,
        resultDesc: r.ResultDesc || r.result_description || null
    };
};

const mapStatus = ({ resultCode, statusText }) => {
    if (resultCode === 0 || statusText === 'SUCCESS' || statusText === 'SUCCESSFUL') return 'SUCCESS';
    if (statusText === 'CANCELLED' || statusText === 'CANCELED') return 'CANCELLED';
    return 'FAILED';
};

// Safe to run more than once for the same payment
const renewSubscription = async (payment, customer) => {
    let subscription = await Subscription.findOne({ payment: payment._id });

    if (!subscription) {
        const durationDays = customer.renewalDurationDays || 30;
        const now = new Date();
        const currentExpiry = customer.subscriptionExpiry;
        const startDate = currentExpiry && currentExpiry > now ? new Date(currentExpiry) : now;

        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        subscription = await Subscription.create({
            customer: customer._id,
            payment: payment._id,
            planName: customer.renewalPlanName || '30-Day Internet',
            amount: payment.amount,
            durationDays,
            startDate,
            expiryDate,
            status: 'ACTIVE'
        });
    }

    // Always make sure the customer record matches (covers a failed earlier attempt)
    await Customer.findByIdAndUpdate(customer._id, {
        $set: { subscriptionExpiry: subscription.expiryDate, status: 'ACTIVE' }
    });

    return subscription;
};

const activateNetwork = async (payment, customer, subscription) => {
    try {
        const activation = await activateCustomerNetwork({
            accountNumber: customer.accountNumber,
            ipAddress: customer.ipAddress,
            expiryDate: subscription.expiryDate,
            durationDays: subscription.durationDays,
            externalReference: payment.externalReference
        });

        if (activation.activated && activation.configured) {
            payment.networkActivated = true;
            payment.networkActivatedAt = new Date();
            payment.networkActivationError = null;
        } else {
            payment.networkActivationError =
                activation.message || 'Network activation was rejected';
        }
    } catch (err) {
        console.error('Network activation error:', err.message);
        payment.networkActivationError = err.message;
    }
    await payment.save();
};

const finalizeSuccess = async (payment) => {
    const customer = await Customer.findById(payment.customer);
    if (!customer) {
        console.error('Payment customer not found:', payment.customer);
        return;
    }

    const subscription = await renewSubscription(payment, customer);

    if (!payment.networkActivated) {
        await activateNetwork(payment, customer, subscription);
    }
};

const handlePayheroCallback = async (req, res) => {
    // Only PayHero knows the secret in the URL
    if (!secretsMatch(req.params.secret, process.env.PAYHERO_CALLBACK_SECRET)) {
        return res.sendStatus(404);
    }

    try {
        const body = req.body || {};
        const cb = parseCallback(body);

        if (!cb.externalReference) {
            console.error('PayHero callback missing external reference');
            return res.status(200).json({ success: false });
        }

        const payment = await Payment.findOne({ externalReference: cb.externalReference });
        if (!payment) {
            console.error(`PayHero callback for unknown payment: ${cb.externalReference}`);
            return res.status(200).json({ success: true });
        }

        // Already processed: never change the final status again.
        // If it succeeded but the network step failed earlier, retry that step.
        if (payment.status !== 'PENDING') {
            if (payment.status === 'SUCCESS' && !payment.networkActivated) {
                await finalizeSuccess(payment);
            }
            return res.status(200).json({ success: true });
        }

        let status = mapStatus(cb);
        let description = cb.resultDesc;

        // A success must carry the exact amount we asked for
        if (status === 'SUCCESS' && cb.amount !== payment.amount) {
            console.error('PayHero callback amount mismatch:', {
                expected: payment.amount,
                received: cb.amount,
                externalReference: cb.externalReference
            });
            status = 'FAILED';
            description = 'Callback amount did not match the initiated payment (review manually)';
        }

        const update = {
            status,
            resultCode: cb.resultCode,
            resultDescription: description,
            payheroResponse: body,
            processedAt: new Date()
        };
        if (cb.checkoutRequestId) update.checkoutRequestId = cb.checkoutRequestId;
        // Only set the receipt when there is one (a null value breaks the unique index)
        if (status === 'SUCCESS' && cb.receipt) update.mpesaReceiptNumber = cb.receipt;

        // Atomic claim: only one callback can move PENDING to a final status
        const claimed = await Payment.findOneAndUpdate(
            { _id: payment._id, status: 'PENDING' },
            { $set: update },
            { new: true }
        );
        if (!claimed) return res.status(200).json({ success: true });

        if (status === 'SUCCESS') {
            await finalizeSuccess(claimed);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        return res.status(500).json({ success: false });
    }
};

module.exports = { handlePayheroCallback };