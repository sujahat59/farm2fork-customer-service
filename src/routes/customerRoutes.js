const express = require('express');
const router = express.Router();
const customerController    = require('../controllers/customerController');
const subscriptionController = require('../controllers/subscriptionController');
const billingController     = require('../controllers/billingController');
const loyaltyController     = require('../controllers/loyaltyController');

// ── Customer CRUD ────────────────────────────────────────────
router.post('/',    customerController.createCustomer);   // POST   /customers
router.get('/:id',  customerController.getCustomer);      // GET    /customers/:id
router.patch('/:id', customerController.updateCustomer);  // PATCH  /customers/:id

// ── Subscriptions (nested under customer) ───────────────────
router.post('/:id/subscriptions', subscriptionController.createSubscription); // POST /customers/:id/subscriptions

// ── Billing history ──────────────────────────────────────────
router.get('/:id/billing', billingController.getBillingHistory); // GET /customers/:id/billing

// ── Loyalty ──────────────────────────────────────────────────
router.get('/:id/loyalty', loyaltyController.getLoyalty); // GET /customers/:id/loyalty

module.exports = router;
