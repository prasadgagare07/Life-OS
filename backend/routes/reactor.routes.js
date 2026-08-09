const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const reactorController = require('../controllers/reactor.controller');

router.use(requireAuth(['reactor', 'dashboard']));

router.get('/today', reactorController.getToday);
router.get('/history', reactorController.history);
router.get('/stats', reactorController.stats);
router.post('/', reactorController.addEntry);
router.delete('/:id', reactorController.deleteEntry);

module.exports = router;
