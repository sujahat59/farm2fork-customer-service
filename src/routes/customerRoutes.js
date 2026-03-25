const express = require('express');
const router = express.Router();
const customerController     = require('../controllers/customerController');
const subscriptionController = require('../controllers/subscriptionController');
const billingController      = require('../controllers/billingController');
const loyaltyController      = require('../controllers/loyaltyController');
const addressController      = require('../controllers/addressController');

router.post('/',     customerController.createCustomer);
router.get('/:id',   customerController.getCustomer);
router.patch('/:id', customerController.updateCustomer);

router.post('/:id/subscriptions', subscriptionController.createSubscription);

router.post('/:id/addresses',          addressController.createAddress);
router.get('/:id/addresses',           addressController.getAddresses);
router.patch('/:id/addresses/default', addressController.setDefaultAddress);

router.get('/:id/billing', billingController.getBillingHistory);
router.get('/:id/loyalty', loyaltyController.getLoyalty);

module.exports = router;
