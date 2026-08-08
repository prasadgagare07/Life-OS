const Fitness = require('../models/fitness.model');

async function getGoal(req, res) {
  const goal = await Fitness.getGoal();
  res.json(goal);
}

async function setGoal(req, res) {
  const { goal_weight, start_weight } = req.body;
  if (goal_weight === undefined && start_weight === undefined) {
    return res.status(400).json({ error: 'goal_weight or start_weight is required' });
  }
  const goal = await Fitness.setGoal({ goal_weight, start_weight });
  res.json(goal);
}

async function list(req, res) {
  const limit = Number(req.query.limit) || 120;
  const entries = await Fitness.getRecent(limit);
  res.json(entries);
}

async function save(req, res) {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const entry = await Fitness.upsertEntry(date, req.body);
  res.json(entry);
}

async function getPhotos(req, res) {
  const photos = await Fitness.getPhotos();
  res.json(photos);
}

async function savePhoto(req, res) {
  const { slot, data_url } = req.body;
  if (!slot || !data_url) {
    return res.status(400).json({ error: 'slot and data_url are required' });
  }
  const photo = await Fitness.savePhoto(slot, data_url);
  res.json(photo);
}

module.exports = { getGoal, setGoal, list, save, getPhotos, savePhoto };
