
const express = require('express');

const router = express.Router();

const {
    initiatePayment
} = require('../controllers/paymentController');

// Initiate M-PESA STK Push
router.post('/initiate', initiatePayment);

module.exports = router;
