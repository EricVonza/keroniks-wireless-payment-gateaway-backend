require('dotenv').config();

const payheroConfig = {
    // Host only, e.g. https://backend.payhero.co.ke (the service adds /api/v2/payments)
    baseURL: (process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke').replace(/\/+$/, ''),
    authToken: process.env.PAYHERO_AUTH_TOKEN,
    channelId: Number(process.env.PAYHERO_CHANNEL_ID),
    callbackURL: process.env.PAYHERO_CALLBACK_URL
};

if (!payheroConfig.authToken) {
    console.warn('WARNING: PayHero API credentials are missing.');
}

// The webhook returns 404 unless the callback URL ends with the secret. If the two
// ever drift apart, payments would stay PENDING forever with no error, so fail at startup.
const secret = process.env.PAYHERO_CALLBACK_SECRET;

if (!secret) {
    throw new Error('PAYHERO_CALLBACK_SECRET is not set');
}

if (!payheroConfig.callbackURL || !payheroConfig.callbackURL.endsWith(`/callback/${secret}`)) {
    throw new Error(
        'PAYHERO_CALLBACK_URL must end with /callback/<PAYHERO_CALLBACK_SECRET>'
    );
}

module.exports = payheroConfig;