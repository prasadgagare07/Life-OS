const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');
const timeExplorerController = require('../controllers/timeExplorer.controller');

router.use(requireAuth(['time-explorer', 'financial-time-explorer']));

// GET /api/time-explorer?date=2026-11-05
router.get('/', timeExplorerController.getTimeExplorer);

module.exports = router;
