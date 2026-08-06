const Trading = require('../models/trading.model');

async function list(req, res) {
  try {
    const entries = await Trading.list();
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load trading entries' });
  }
}

async function addEntry(req, res) {
  try {
    const { entry_date, profit } = req.body;

    if (!entry_date || typeof profit !== 'number' || Number.isNaN(profit)) {
      return res.status(400).json({
        error: '"entry_date" (YYYY-MM-DD) and numeric "profit" are required'
      });
    }

    const entry = await Trading.addEntry(entry_date, profit);
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trading entry' });
  }
}

module.exports = {
  list,
  addEntry
};
