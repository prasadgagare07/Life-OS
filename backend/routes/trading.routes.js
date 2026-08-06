const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const tradingController = require('../controllers/trading.controller');

router.use(requireAuth);

// GET  /api/trading/entries
router.get('/entries', tradingController.list);
// POST /api/trading/entries  { entry_date, profit }
router.post('/entries', tradingController.addEntry);

module.exports = router;
