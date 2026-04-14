const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.patch('/:id',        addressController.updateAddress);
router.delete('/:id',       addressController.deleteAddress);

module.exports = router;
