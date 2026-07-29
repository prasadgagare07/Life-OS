const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const standardsController = require('../controllers/standards.controller');

router.use(requireAuth);

router.get('/', standardsController.list);
router.get('/today', standardsController.getToday);
router.post('/', standardsController.save);

module.exports = router;
