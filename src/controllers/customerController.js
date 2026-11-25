const Customer = require('../models/Customer');
const { getRenewalDetails } = require('../services/pricingService');

// "John Kamau Mwangi" -> "John K*** M***"
const maskName = (name = '') =>
    String(name)
        .trim()
        .split(/\s+/)
        .map((part, i) => (i === 0 ? part : `${part[0]}***`))
        .join(' ');

const getCustomerByAccount = async (req, res) => {
    try {
        const accountNumber = String(req.params.accountNumber).trim().toUpperCase();

        const customer = await Customer.findOne({ accountNumber });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const { amount, durationDays, packageName } = await getRenewalDetails(customer);

        if (!Number.isInteger(amount) || amount <= 0) {
            console.error(`No valid amount configured for account ${customer.accountNumber}`);
            return res.status(422).json({
                success: false,
                message: 'We could not determine the amount due. Please contact support.'
            });
        }

        // Only what the renewal page needs. No phone number, IP address, or expiry.
        return res.status(200).json({
            accountNumber: customer.accountNumber,
            name: maskName(customer.customerName),
            packageName,
            duration: `${durationDays} days`,
            amount
        });
    } catch (error) {
        console.error('Customer lookup error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve account information'
        });
    }
};

module.exports = { getCustomerByAccount };