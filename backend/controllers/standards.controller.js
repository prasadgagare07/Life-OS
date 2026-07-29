const Standards = require('../models/standards.model');

async function list(req, res) {
  const limit = Number(req.query.limit) || 30;
  const entries = await Standards.getRecent(limit);
  res.json(entries);
}

async function getToday(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = await Standards.getByDate(today);
  res.json(entry);
}

async function save(req, res) {
  const date = req.body.date || new Date().toISOString().slice(0, 10);

  for (const field of Standards.FIELDS) {
    const val = req.body[field];
    if (val === undefined || val < 0 || val > 10) {
      return res.status(400).json({ error: `Field "${field}" must be a number between 0 and 10` });
    }
  }

  const entry = await Standards.upsert(date, req.body);
  res.json(entry);
}

module.exports = { list, getToday, save };
