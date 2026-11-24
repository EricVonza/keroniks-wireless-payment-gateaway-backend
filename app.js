
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/database');

const paymentRoutes = require('./src/routes/paymentRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Internet Billing API is running'
    });
});

app.use('/api/payments', paymentRoutes);
app.use('/api/payhero', webhookRoutes);

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
