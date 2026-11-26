require('dotenv').config();

const express = require('express');

app.set("trust proxy", 1);   // <-- here

const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const customerRoutes = require('./src/routes/customerRoutes');

const app = express();

const allowedOrigins = [
    'https://keroniks-wireless-payment.lovable.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const lookupLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const paymentLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Internet Billing API is running'
    });
});

app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/payhero', webhookRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', lookupLimiter, customerRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Billing API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();
