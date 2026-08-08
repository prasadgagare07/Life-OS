const pool = require('../config/db');

async function list() {
  const { rows } = await pool.query(
    `SELECT entry_date::text AS entry_date, profit, created_at
     FROM trading_entries
     ORDER BY entry_date ASC`
  );
  return rows;
}

async function addEntry(entry_date, profit) {
  const { rows } = await pool.query(
    `INSERT INTO trading_entries (entry_date, profit)
     VALUES ($1, $2)
     ON CONFLICT (entry_date)
     DO UPDATE SET profit = EXCLUDED.profit
     RETURNING entry_date::text AS entry_date, profit, created_at`,
    [entry_date, profit]
  );
  return rows[0];
}

async function getAccount() {
  const { rows } = await pool.query(`SELECT upi_id, bank_name FROM trading_account ORDER BY id LIMIT 1`);
  return rows[0] || { upi_id: null, bank_name: null };
}

async function setAccount({ upi_id, bank_name }) {
  const current = await pool.query(`SELECT id FROM trading_account ORDER BY id LIMIT 1`);
  if (current.rows.length === 0) {
    const { rows } = await pool.query(
      `INSERT INTO trading_account (upi_id, bank_name) VALUES ($1, $2) RETURNING upi_id, bank_name`,
      [upi_id || null, bank_name || null]
    );
    return rows[0];
  }
  const { rows } = await pool.query(
    `UPDATE trading_account SET upi_id = $1, bank_name = $2 WHERE id = $3 RETURNING upi_id, bank_name`,
    [upi_id || null, bank_name || null, current.rows[0].id]
  );
  return rows[0];
}

module.exports = {
  list,
  addEntry,
  getAccount,
  setAccount
};
