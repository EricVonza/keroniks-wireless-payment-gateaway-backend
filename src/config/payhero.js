
require('dotenv').config();

const payheroConfig = {
    baseURL: process.env.PAYHERO_BASE_URL,
    authToken: process.env.PAYHERO_AUTH_TOKEN,
    channelId: Number(process.env.PAYHERO_CHANNEL_ID),
    callbackURL: process.env.PAYHERO_CALLBACK_URL
};

if (!payheroConfig.authToken) {
    console.warn('WARNING: PayHero API credentials are missing.');
}

module.exports = payheroConfig;
