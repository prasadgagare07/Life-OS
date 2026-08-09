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

module.exports = { getByDate, addEntry, deleteEntry, getHistory };
