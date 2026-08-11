const Reactor = require('../models/reactor.model');

const RACE_TARGET = 100;   // first side to reach this many points wins
const GOOD_POINTS = 1;     // per charge
const BAD_POINTS = 2;      // per leak — twice as costly as a charge is worth
const LOCKDOWN_HOURS = 24; // after a MELTDOWN, leak-logging is blocked this long

// The reactor's "day" resets at 10pm local time, not midnight — so
// something logged at 11pm on the 9th belongs to the "10th" and stays
// open (editable) until 10pm on the 10th, same pattern every day after.
// TIMEZONE_OFFSET_MINUTES assumes IST (UTC+5:30) — change if you're
// somewhere else. This is independent of whatever timezone the server
// itself runs in (Render runs UTC).
const TIMEZONE_OFFSET_MINUTES = 330;
const RESET_HOUR_LOCAL = 22; // 10pm

function todayKey() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + TIMEZONE_OFFSET_MINUTES * 60000);

  if (local.getUTCHours() >= RESET_HOUR_LOCAL) {
    local.setUTCDate(local.getUTCDate() + 1);
  }

  return local.toISOString().slice(0, 10);
}

// Replays today's entries in order to get the current charge % and crack
// count — kept in the entries themselves rather than a separate counter so
// the reactor state can never drift out of sync with the log. Each entry
// carries its own weight (typed in when logged) instead of a fixed step,
// and charge has no ceiling — a big enough entry can push it past 100%.
function computeState(entries) {
  let charge = 0;
  let leaks = 0;
  for (const entry of entries) {
    const weight = Number(entry.weight);
    if (entry.type === 'charge') {
      charge = charge + weight;
    } else {
      charge = Math.max(0, charge - weight);
      leaks += 1;
    }
  }
  return { charge, leaks };
}

// Computes a "net-positive day" streak, walking backward from today.
// A day counts toward the streak only if it has at least one entry AND
// its net score (charges - 2×leaks) is >= 0. A day with zero entries
// breaks the streak — showing up matters, not just avoiding bad days.
function computeStreak(historyRows) {
  const byDate = new Map(historyRows.map((r) => [r.entry_date, r]));
  let streak = 0;
  // Anchor on the reactor's current day label (respects the 10pm
  // boundary), then step backward one calendar day at a time — each
  // reactor day maps 1:1 to a date label once todayKey() has assigned it.
  const cursor = new Date(todayKey() + 'T00:00:00Z');

  for (let i = 0; i < 3650; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const day = byDate.get(key);

    if (!day) break;

    const charges = Number(day.charges);
    const leaks = Number(day.leaks);
    const net = charges * GOOD_POINTS - leaks * BAD_POINTS;

    if (charges + leaks === 0 || net < 0) break;

    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

// Checks the current race against the target, resolving + starting a new
// one if either side just won. Returns { race, justResolved } so the
// caller can tell the frontend to show a celebration/meltdown screen.
async function checkAndResolveRace() {
  let race = await Reactor.getOpenRace();
  if (!race) {
    race = await Reactor.startNextRace(0);
  }

  const { charges, leaks } = await Reactor.getPointsSince(race.started_at);
  const goodPoints = charges * GOOD_POINTS;
  const badPoints = leaks * BAD_POINTS;

  let justResolved = null;

  if (goodPoints >= RACE_TARGET || badPoints >= RACE_TARGET) {
    const winner = goodPoints >= RACE_TARGET ? 'good' : 'bad';
    const lockdownUntil =
      winner === 'bad'
        ? new Date(Date.now() + LOCKDOWN_HOURS * 60 * 60 * 1000)
        : null;

    await Reactor.resolveRace(race.id, winner, lockdownUntil);
    justResolved = { winner, raceNumber: race.race_number };

    race = await Reactor.startNextRace(race.race_number);
  }

  return {
    race: {
      raceNumber: race.race_number,
      startedAt: race.started_at,
      goodPoints: Math.min(goodPoints, RACE_TARGET),
      badPoints: Math.min(badPoints, RACE_TARGET),
      target: RACE_TARGET,
    },
    justResolved,
  };
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
    const { type, text, weight } = req.body;

    if (!['charge', 'leak'].includes(type)) {
      return res.status(400).json({ error: '"type" must be "charge" or "leak"' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: '"text" is required' });
    }
    if (text.length > 200) {
      return res.status(400).json({ error: '"text" must be 200 characters or fewer' });
    }

    const w = Number(weight);
    if (!w || Number.isNaN(w) || w <= 0 || w > 500) {
      return res.status(400).json({ error: '"weight" must be a number between 0 and 500 (percent impact)' });
    }

    if (type === 'leak') {
      const lockdownUntil = await Reactor.getActiveLockdown();
      if (lockdownUntil) {
        return res.status(423).json({
          error: 'Lockdown active after a meltdown — only charges can be logged right now.',
          lockdownUntil,
        });
      }
    }

    const entry = await Reactor.addEntry(todayKey(), type, text.trim(), w);
    const entries = await Reactor.getByDate(todayKey());
    const { charge, leaks } = computeState(entries);
    const { race, justResolved } = await checkAndResolveRace();

    res.status(201).json({ entry, charge, leaks, race, raceResolved: justResolved });
  } catch (err) {
    next(err);
  }
}

async function deleteEntry(req, res, next) {
  try {
    const existing = await Reactor.getEntryById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Locked: once a day is over, its entries can't be edited or deleted —
    // no rewriting history after the fact.
    if (existing.entry_date !== todayKey()) {
      return res.status(423).json({ error: "This entry is locked — it's from a previous day." });
    }

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

// Everything the "trajectory" view needs in one call: lifetime totals,
// current race progress, streak, and daily history for the chart.
async function stats(req, res, next) {
  try {
    const days = Number(req.query.days) || 30;

    const [lifetime, historyRows, { race }, lockdownUntil] = await Promise.all([
      Reactor.getLifetimeTotals(),
      Reactor.getHistory(days),
      checkAndResolveRace(),
      Reactor.getActiveLockdown(),
    ]);

    const goodPoints = lifetime.charges * GOOD_POINTS;
    const badPoints = lifetime.leaks * BAD_POINTS;

    // Cumulative running totals per day, for the dual-line chart.
    let runningGood = 0;
    let runningBad = 0;
    const trajectory = historyRows.map((row) => {
      runningGood += Number(row.charges) * GOOD_POINTS;
      runningBad += Number(row.leaks) * BAD_POINTS;
      return {
        date: row.entry_date,
        goodCumulative: runningGood,
        badCumulative: runningBad,
      };
    });

    res.json({
      lifetime: {
        goodPoints,
        badPoints: -badPoints,
        net: goodPoints - badPoints,
      },
      race,
      streak: computeStreak(historyRows),
      lockdownUntil,
      trajectory,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getToday, addEntry, deleteEntry, history, stats };
