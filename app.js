
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./src/routes/paymentRoutes');


const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Internet Billing API is running'
    });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Billing API running on port ${PORT}`);
});
