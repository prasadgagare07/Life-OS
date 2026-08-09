const Reactor = require('../models/reactor.model');

const CHARGE_STEP = 12;
const LEAK_STEP = 8;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Replays today's entries in order to get the current charge % and crack
// count — kept in the entries themselves rather than a separate counter so
// the reactor state can never drift out of sync with the log.
function computeState(entries) {
  let charge = 0;
  let leaks = 0;
  for (const entry of entries) {
    if (entry.type === 'charge') {
      charge = Math.min(100, charge + CHARGE_STEP);
    } else {
      charge = Math.max(0, charge - LEAK_STEP);
      leaks += 1;
    }
  }
  return { charge, leaks };
}

async function getToday(req, res, next) {
  try {
    const entries = await Reactor.getByDate(todayKey());
    const { charge, leaks } = computeState(entries);
    res.json({
      date: todayKey(),
      charge,
      leaks,
      charges: entries.filter((e) => e.type === 'charge'),
      leakEntries: entries.filter((e) => e.type === 'leak'),
    });
  } catch (err) {
    next(err);
  }
}

async function addEntry(req, res, next) {
  try {
    const { type, text } = req.body;

    if (!['charge', 'leak'].includes(type)) {
      return res.status(400).json({ error: '"type" must be "charge" or "leak"' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: '"text" is required' });
    }
    if (text.length > 200) {
      return res.status(400).json({ error: '"text" must be 200 characters or fewer' });
    }

    const entry = await Reactor.addEntry(todayKey(), type, text.trim());
    const entries = await Reactor.getByDate(todayKey());
    const { charge, leaks } = computeState(entries);

    res.status(201).json({ entry, charge, leaks });
  } catch (err) {
    next(err);
  }
}

async function deleteEntry(req, res, next) {
  try {
    await Reactor.deleteEntry(req.params.id);
    const entries = await Reactor.getByDate(todayKey());
    const { charge, leaks } = computeState(entries);
    res.json({ charge, leaks });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const days = Number(req.query.days) || 14;
    const rows = await Reactor.getHistory(days);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getToday, addEntry, deleteEntry, history };
