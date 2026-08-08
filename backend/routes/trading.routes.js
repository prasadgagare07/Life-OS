const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const tradingController = require('../controllers/trading.controller');

router.use(requireAuth(['trading', 'dashboard']));

// GET  /api/trading/entries
router.get('/entries', tradingController.list);
// POST /api/trading/entries  { entry_date, profit }
router.post('/entries', tradingController.addEntry);

// GET  /api/trading/account
router.get('/account', tradingController.getAccount);
// PUT  /api/trading/account  { upi_id, bank_name }
router.put('/account', tradingController.setAccount);

module.exports = router;
