const Fitness = require('../models/fitness.model');

async function getGoal(req, res) {
  const goal = await Fitness.getGoal();
  res.json(goal);
}

async function setGoal(req, res) {
  const { goal_weight } = req.body;
  if (!goal_weight) {
    return res.status(400).json({ error: 'goal_weight is required' });
  }
  const goal = await Fitness.setGoal(goal_weight);
  res.json(goal);
}

async function list(req, res) {
  const limit = Number(req.query.limit) || 60;
  const entries = await Fitness.getRecent(limit);
  res.json(entries);
}

async function save(req, res) {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const entry = await Fitness.upsertEntry(date, req.body);
  res.json(entry);
}

module.exports = { getGoal, setGoal, list, save };
