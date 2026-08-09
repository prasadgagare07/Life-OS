const pool = require('../config/db');

async function getByDate(date) {
  const { rows } = await pool.query(
    `SELECT id, entry_date::text AS entry_date, type, text, created_at
     FROM reactor_entries
     WHERE entry_date = $1
     ORDER BY created_at ASC`,
    [date]
  );
  return rows;
}

async function addEntry(date, type, text) {
  const { rows } = await pool.query(
    `INSERT INTO reactor_entries (entry_date, type, text)
     VALUES ($1, $2, $3)
     RETURNING id, entry_date::text AS entry_date, type, text, created_at`,
    [date, type, text]
  );
  return rows[0];
}

// Returns the entry's date so the controller can refuse to delete anything
// that isn't today — once a day ends, its log is locked for good.
async function getEntryById(id) {
  const { rows } = await pool.query(
    `SELECT id, entry_date::text AS entry_date, type FROM reactor_entries WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function deleteEntry(id) {
  await pool.query(`DELETE FROM reactor_entries WHERE id = $1`, [id]);
}

async function getHistory(days = 14) {
  const { rows } = await pool.query(
    `SELECT entry_date::text AS entry_date,
            COUNT(*) FILTER (WHERE type = 'charge') AS charges,
            COUNT(*) FILTER (WHERE type = 'leak') AS leaks
     FROM reactor_entries
     WHERE entry_date >= CURRENT_DATE - ($1::int - 1)
     GROUP BY entry_date
     ORDER BY entry_date ASC`,
    [days]
  );
  return rows;
}

// Lifetime totals across every entry ever logged — "how far you've come
// since day 1," independent of any single race.
async function getLifetimeTotals() {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE type = 'charge') AS charges,
       COUNT(*) FILTER (WHERE type = 'leak') AS leaks
     FROM reactor_entries`
  );
  return {
    charges: Number(rows[0].charges),
    leaks: Number(rows[0].leaks),
  };
}

// --- Race -----------------------------------------------------------

async function getOpenRace() {
  const { rows } = await pool.query(
    `SELECT id, race_number, started_at, resolved_at, winner, lockdown_until
     FROM reactor_races
     WHERE resolved_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

// Points earned since a given race started — this is what races toward
// the target of 100, separate from the lifetime totals above.
async function getPointsSince(startedAt) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE type = 'charge') AS charges,
       COUNT(*) FILTER (WHERE type = 'leak') AS leaks
     FROM reactor_entries
     WHERE created_at >= $1`,
    [startedAt]
  );
  return {
    charges: Number(rows[0].charges),
    leaks: Number(rows[0].leaks),
  };
}

async function resolveRace(raceId, winner, lockdownUntil) {
  await pool.query(
    `UPDATE reactor_races
     SET resolved_at = now(), winner = $2, lockdown_until = $3
     WHERE id = $1`,
    [raceId, winner, lockdownUntil]
  );
}

async function startNextRace(previousRaceNumber) {
  const { rows } = await pool.query(
    `INSERT INTO reactor_races (race_number, started_at)
     VALUES ($1, now())
     RETURNING id, race_number, started_at, resolved_at, winner, lockdown_until`,
    [previousRaceNumber + 1]
  );
  return rows[0];
}

// The most recent MELTDOWN's lockdown — used to block new leak entries
// while it's still active, even after a new race has already started.
async function getActiveLockdown() {
  const { rows } = await pool.query(
    `SELECT lockdown_until FROM reactor_races
     WHERE winner = 'bad' AND lockdown_until > now()
     ORDER BY resolved_at DESC
     LIMIT 1`
  );
  return rows[0]?.lockdown_until || null;
}

module.exports = {
  getByDate,
  addEntry,
  getEntryById,
  deleteEntry,
  getHistory,
  getLifetimeTotals,
  getOpenRace,
  getPointsSince,
  resolveRace,
  startNextRace,
  getActiveLockdown,
};
