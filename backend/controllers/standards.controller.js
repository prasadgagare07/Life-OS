const Standards = require('../models/standards.model');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function list(req, res) {
  const limit = Number(req.query.limit) || 30;
  const entries = await Standards.getRecent(limit);
  res.json(entries);
}

async function getToday(req, res) {
  const entry = await Standards.getByDate(todayKey());
  const best = await Standards.getBest();
  res.json({ entry: entry || null, best });
}
async function getHabits(req, res) {
  const habits = await Standards.getHabits();
  res.json(habits);
}

async function addHabit(req, res) {
  const habit = await Standards.addHabit(req.body);
  res.status(201).json(habit);
}
async function save(req, res) {
  const { habits, locked } = req.body;

  if (!Array.isArray(habits) || habits.length === 0) {
    return res.status(400).json({ error: '"habits" must be a non-empty array' });
  }

  for (const h of habits) {
    if (typeof h.value !== 'number' || h.value < 0 || h.value > 10) {
      return res.status(400).json({ error: `Habit "${h.name || '?'}" must have a value between 0 and 10` });
    }
  }

  const total = habits.reduce((a, b) => a + b.value, 0);
  const avgScore = Number((total / habits.length).toFixed(2));

  const entry = await Standards.upsert(todayKey(), habits, avgScore, !!locked);
  const best = await Standards.getBest();

  res.json({ entry, best });
}
module.exports = {
  list,
  getToday,
  save,
  getHabits,
  addHabit
};
