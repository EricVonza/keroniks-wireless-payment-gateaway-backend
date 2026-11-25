
const axios = require('axios');
const payhero = require('../config/payhero');

const initiateSTKPush = async ({
    amount,
    phoneNumber,
    externalReference,
    customerName
}) => {
    try {
        if (!payhero.authToken || !payhero.channelId || !payhero.callbackURL) {
            throw new Error('PayHero configuration is incomplete');
        }

        const baseURL = payhero.baseURL.replace(/\/+$/, '');

        // Accept either a raw token or a complete Basic header
        const authorization = payhero.authToken.startsWith('Basic ')
            ? payhero.authToken
            : `Basic ${payhero.authToken}`;

        const payload = {
            amount: Number(amount),
            phone_number: phoneNumber,
            channel_id: Number(payhero.channelId),
            provider: 'm-pesa',
            external_reference: externalReference,
            callback_url: payhero.callbackURL
        };

        if (customerName) {
            payload.customer_name = customerName;
        }

        const response = await axios.post(
            `${baseURL}/api/v2/payments`,
            payload,
            {
                headers: {
                    Authorization: authorization,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (!response.data?.success) {
            throw new Error('PayHero did not accept the payment request');
        }

        return response.data;

    } catch (error) {
        console.error(
            'PayHero API Error:',
            error.response?.data || error.message
        );

        const paymentError = new Error(
            error.response?.data?.message ||
            error.message ||
            'Unable to initiate payment'
        );

        paymentError.statusCode = 502;
        throw paymentError;
    }
};

module.exports = {
    initiateSTKPush
};
