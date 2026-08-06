const pool = require('../config/db');

async function list() {
  const { rows } = await pool.query(
    `SELECT * FROM trading_entries ORDER BY entry_date ASC`
  );
  return rows;
}

async function addEntry(entry_date, profit) {
  const { rows } = await pool.query(
    `INSERT INTO trading_entries (entry_date, profit)
     VALUES ($1, $2)
     ON CONFLICT (entry_date)
     DO UPDATE SET profit = EXCLUDED.profit
     RETURNING *`,
    [entry_date, profit]
  );
  return rows[0];
}

module.exports = {
  list,
  addEntry
};
