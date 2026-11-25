const express = require('express');

const router = express.Router();

const { handlePayheroCallback } = require('../controllers/webhookController');

// PayHero calls: POST /api/payhero/callback/<PAYHERO_CALLBACK_SECRET>
router.post('/callback/:secret', handlePayheroCallback);

module.exports = router;