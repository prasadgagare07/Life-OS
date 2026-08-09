const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-passcode', requireAuth(['settings']), authController.changePasscode);

// Session management — every page can see and manage its own devices,
// not just Settings, since each page's passcode is independent.
router.get('/sessions', requireAuth(authController.VALID_PAGES), authController.listSessions);
router.delete('/sessions/:id', requireAuth(authController.VALID_PAGES), authController.revokeSession);
router.delete('/sessions', requireAuth(authController.VALID_PAGES), authController.revokeOtherSessions);

module.exports = router;
