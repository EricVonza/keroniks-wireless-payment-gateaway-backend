const express = require('express');

const router = express.Router();

const {
    initiatePayment,
    getPaymentStatus
} = require('../controllers/paymentController');

router.post('/initiate', initiatePayment);
router.get('/:externalReference/status', getPaymentStatus);

module.exports = router;