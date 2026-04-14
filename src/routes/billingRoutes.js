const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.patch('/:id/status', billingController.updateBillingStatus);
router.post('/manifest',    billingController.processBillingManifest);

module.exports = router;
