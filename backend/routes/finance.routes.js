const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const financeController = require('../controllers/finance.controller');

router.use(requireAuth);

router.get('/', financeController.getSnapshot);
router.put('/', financeController.updateSnapshot);
router.get('/timeline', financeController.getTimeline);
router.get('/statistics', financeController.getStatistics);
router.get('/goals', financeController.getGoals);

module.exports = router;
