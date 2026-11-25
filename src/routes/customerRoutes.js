const express = require('express');

const router = express.Router();

const { getCustomerByAccount } = require('../controllers/customerController');

router.get('/:accountNumber', getCustomerByAccount);

module.exports = router;
