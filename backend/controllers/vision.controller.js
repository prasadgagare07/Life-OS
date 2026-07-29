const Vision = require('../models/vision.model');

async function list(req, res) {
  const goals = await Vision.getAll();
  res.json(goals);
}

async function create(req, res) {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const goal = await Vision.create(req.body);
  res.status(201).json(goal);
}

async function update(req, res) {
  const goal = await Vision.update(req.params.id, req.body);
  res.json(goal);
}

async function remove(req, res) {
  await Vision.remove(req.params.id);
  res.status(204).end();
}

module.exports = { list, create, update, remove };
