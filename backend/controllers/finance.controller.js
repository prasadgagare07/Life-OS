const Finance = require('../models/finance.model');

async function getSnapshot(req, res) {
  const snapshot = await Finance.getSnapshot();
  res.json(snapshot);
}

async function updateSnapshot(req, res) {
  const updated = await Finance.updateSnapshot(req.body);
  res.json(updated);
}

async function getTimeline(req, res) {
  const limit = Number(req.query.limit) || 90;
  const timeline = await Finance.getTimeline(limit);
  res.json(timeline);
}
async function getStatistics(req, res) {

const stats = await Finance.getStatistics();

res.json(stats);

}
async function getGoals(req, res) {
  const goals = await Finance.getGoals();
  res.json(goals);
}
async function addGoal(req, res) {
  const goal = await Finance.addGoal(req.body);
  res.status(201).json(goal);
}
module.exports = {
  getSnapshot,
  updateSnapshot,
  getTimeline,
  getStatistics,
  getGoals,
  addGoal
};
