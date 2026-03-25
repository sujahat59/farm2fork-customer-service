const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.patch('/:id/status', billingController.updateBillingStatus);

module.exports = router;
