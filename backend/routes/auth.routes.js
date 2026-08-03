const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-passcode', requireAuth, authController.changePasscode);

module.exports = router;
