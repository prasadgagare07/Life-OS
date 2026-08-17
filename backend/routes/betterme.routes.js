const express = require('express');
const router = express.Router();
const controller = require('../controllers/betterme.controller');


// Habits + month view
router.get('/month', controller.getMonth);

router.post('/habits', controller.addHabit);
router.put('/habits/:id', controller.renameHabit);
router.put('/habits/:id/position', controller.reorderHabit);
router.delete('/habits/:id', controller.deleteHabit);

router.post('/completion', controller.setCompletion);


// List items (Learn / Master / Character)
router.get('/list/:category', controller.getListItems);
router.post('/list/:category', controller.addListItem);
router.put('/list-item/:id', controller.renameListItem);
router.put('/list-item/:id/toggle', controller.toggleListItem);
router.delete('/list-item/:id', controller.deleteListItem);


module.exports = router;


// ==========================================
// GOALS
// ==========================================

router.get('/goals', controller.getGoals);

router.post('/goals', controller.addGoal);

router.put('/goals/:id', controller.updateGoal);

router.put('/goals/:id/complete', controller.completeGoal);

router.delete('/goals/:id', controller.deleteGoal);
