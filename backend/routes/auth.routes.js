const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/verify', authController.verifyPasscode);
router.post('/change-passcode', requireAuth(['settings']), authController.changePasscode);

// Session management — Settings is the one place that can see and revoke
// logins across every page, the same way it's the only page that can
// change other pages' passcodes.
router.get('/sessions', requireAuth(['settings']), authController.listSessions);
router.delete('/sessions/:id', requireAuth(['settings']), authController.revokeSession);
router.delete('/sessions', requireAuth(['settings']), authController.revokeOtherSessions);

module.exports = router;
