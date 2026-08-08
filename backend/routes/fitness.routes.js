const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const fitnessController = require('../controllers/fitness.controller');

router.use(requireAuth);

router.get('/goal', fitnessController.getGoal);
router.put('/goal', fitnessController.setGoal);
router.get('/photos', fitnessController.getPhotos);
router.post('/photos', fitnessController.savePhoto);
router.get('/', fitnessController.list);
router.post('/', fitnessController.save);

module.exports = router;
