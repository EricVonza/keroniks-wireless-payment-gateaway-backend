const axios = require('axios');

const activateCustomerNetwork = async ({
    accountNumber,
    ipAddress,
    expiryDate,
    durationDays,
    externalReference
}) => {
    if (!ipAddress) {
        return {
            activated: false,
            configured: false,
            message: 'Customer IP address is missing'
        };
    }

    const activationURL = process.env.MIKROTIK_ACTIVATE_URL;

    if (!activationURL) {
        return {
            activated: false,
            configured: false,
            message: 'Network activation bridge is not configured'
        };
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    if (process.env.MIKROTIK_ACTIVATE_SECRET) {
        headers['X-Activation-Secret'] = process.env.MIKROTIK_ACTIVATE_SECRET;
    }

    const response = await axios.post(
        activationURL,
        {
            accountNumber,
            ipAddress,
            expiryDate,
            durationDays,
            externalReference,
            action: 'ACTIVATE'
        },
        { headers, timeout: 15000 }
    );

    return {
        activated: response.data?.success !== false,
        configured: true,
        response: response.data
    };
};

module.exports = { activateCustomerNetwork };
