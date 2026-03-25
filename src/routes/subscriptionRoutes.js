const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// GET    /subscriptions/:id        — used by Delivery Execution team
// PATCH  /subscriptions/:id/status — pause / resume / cancel
router.get('/:id',         subscriptionController.getSubscription);
router.patch('/:id/status', subscriptionController.updateStatus);

module.exports = router;
