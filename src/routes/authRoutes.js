const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.get('/verify',           authController.verify);
router.post('/import-drivers',  authController.upload.single('file'), authController.importDriversCSV);

module.exports = router;
