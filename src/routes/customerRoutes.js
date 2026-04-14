const express = require('express');
const router = express.Router();
const customerController     = require('../controllers/customerController');
const subscriptionController = require('../controllers/subscriptionController');
const billingController      = require('../controllers/billingController');
const loyaltyController      = require('../controllers/loyaltyController');
const addressController      = require('../controllers/addressController');

// User
router.get('/:id',    customerController.getUser);
router.patch('/:id',  customerController.updateUser);
router.delete('/:id', customerController.deleteUser);

// Subscriptions
router.post('/:id/subscriptions',         subscriptionController.createSubscription);
router.get('/:id/subscription-history',   subscriptionController.getSubscriptionHistory);

// Addresses
router.post('/:id/addresses',             addressController.createAddress);
router.get('/:id/addresses',              addressController.getAddresses);
router.patch('/:id/addresses/default',    addressController.setDefaultAddress);

// Billing
router.get('/:id/billing',                billingController.getBillingHistory);
router.get('/:id/billing/total',          billingController.getTotalSpent);

// Loyalty
router.get('/:id/loyalty',                loyaltyController.getLoyalty);
router.get('/:id/loyalty/history',        loyaltyController.getPointsHistory);

module.exports = router;
