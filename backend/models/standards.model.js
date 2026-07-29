const pool = require('../config/db');

const FIELDS = ['sleep', 'workout', 'diet', 'reading', 'meditation', 'no_junk'];

async function getRecent(limit = 30) {
  const { rows } = await pool.query(
    `SELECT * FROM standards_entries ORDER BY entry_date DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getByDate(date) {
  const { rows } = await pool.query(
    `SELECT * FROM standards_entries WHERE entry_date = $1`,
    [date]
  );
  return rows[0] || null;
}

async function upsert(date, values) {
  const cols = FIELDS.map((f) => values[f]);

  const { rows } = await pool.query(
    `INSERT INTO standards_entries (entry_date, sleep, workout, diet, reading, meditation, no_junk)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (entry_date) DO UPDATE SET
       sleep = EXCLUDED.sleep,
       workout = EXCLUDED.workout,
       diet = EXCLUDED.diet,
       reading = EXCLUDED.reading,
       meditation = EXCLUDED.meditation,
       no_junk = EXCLUDED.no_junk
     RETURNING *`,
    [date, ...cols]
  );
  return rows[0];
}

module.exports = { getRecent, getByDate, upsert, FIELDS };
