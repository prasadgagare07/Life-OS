const Finance = require('../models/finance.model');

async function getSnapshot(req, res, next) {
  try {
    const snapshot = await Finance.getSnapshot();
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
}

async function updateSnapshot(req, res, next) {
  try {
    const updated = await Finance.updateSnapshot(req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 90;
    const timeline = await Finance.getTimeline(limit);
    res.json(timeline);
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const stats = await Finance.getStatistics();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function getGoals(req, res, next) {
  try {
    const goals = await Finance.getGoals();
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

async function addGoal(req, res, next) {
  try {
    const goal = await Finance.addGoal(req.body);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSnapshot,
  updateSnapshot,
  getTimeline,
  getStatistics,
  getGoals,
  addGoal
};
