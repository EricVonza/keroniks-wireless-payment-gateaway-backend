router.post('/initiate', initiatePayment);
router.get('/:externalReference/status', getPaymentStatus);