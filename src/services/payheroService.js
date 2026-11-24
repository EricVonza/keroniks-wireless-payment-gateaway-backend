
const axios = require('axios');
const payhero = require('../config/payhero');

const initiateSTKPush = async ({
    amount,
    phoneNumber,
    externalReference,
    customerName
}) => {

    try {
        const response = await axios.post(
            `${payhero.baseURL}/api/v2/payments`,
            {
                amount: Number(amount),
                phone_number: phoneNumber,
                channel_id: payhero.channelId,
                provider: 'm-pesa',
                external_reference: externalReference,
                customer_name: customerName,
                callback_url: payhero.callbackURL
            },
            {
                headers: {
                    Authorization: payhero.authToken,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            'PayHero API Error:',
            error.response?.data || error.message
        );

        throw new Error(
            error.response?.data?.message ||
            'Unable to initiate payment'
        );
    }
};

module.exports = {
    initiateSTKPush
};
