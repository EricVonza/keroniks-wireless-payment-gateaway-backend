const express = require('express');

const router = express.Router();

const { handlePayheroCallback } = require('../controllers/webhookController');

// PayHero calls this URL after the customer completes or cancels the STK push
router.post('/callback', handlePayheroCallback);

module.exports = router;