const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const visionController = require('../controllers/vision.controller');

router.use(requireAuth(['vision']));

router.get('/', visionController.list);
router.post('/', visionController.create);
router.put('/:id', visionController.update);
router.delete('/:id', visionController.remove);

module.exports = router;
