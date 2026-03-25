const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const billingController      = require('../controllers/billingController');

router.get('/:id',         subscriptionController.getSubscription);
router.patch('/:id/status', subscriptionController.updateStatus);
router.post('/:id/renew',   subscriptionController.renewSubscription);

module.exports = router;
