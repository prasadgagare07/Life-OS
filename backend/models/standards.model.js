const pool = require('../config/db');

async function getRecent(limit = 30) {
  const { rows } = await pool.query(
    `SELECT entry_date::text AS entry_date, habits, avg_score, locked
     FROM daily_entries
     ORDER BY entry_date DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getByDate(date) {
  const { rows } = await pool.query(
    `SELECT entry_date::text AS entry_date, habits, avg_score, locked
     FROM daily_entries
     WHERE entry_date = $1`,
    [date]
  );
  return rows[0] || null;
}

async function getBest() {
  const { rows } = await pool.query(
    `SELECT MAX(avg_score) AS best FROM daily_entries`
  );
  return rows[0]?.best ? Number(rows[0].best) : 0;
}

async function upsert(date, habits, avgScore, locked) {
  const { rows } = await pool.query(
    `INSERT INTO daily_entries (entry_date, habits, avg_score, locked, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (entry_date) DO UPDATE SET
       habits = EXCLUDED.habits,
       avg_score = EXCLUDED.avg_score,
       locked = EXCLUDED.locked,
       updated_at = now()
     RETURNING entry_date::text AS entry_date, habits, avg_score, locked`,
    [date, JSON.stringify(habits), avgScore, locked]
  );
  return rows[0];
}
async function getHabits() {
  const { rows } = await pool.query(
    `SELECT * FROM standards_habits
     ORDER BY sort_order ASC`
  );

  return rows;
}

async function addHabit({ name, icon, color }) {

  const { rows } = await pool.query(
    `INSERT INTO standards_habits
    (name, icon, color, sort_order)
    VALUES (
      $1,
      $2,
      $3,
      (SELECT COALESCE(MAX(sort_order),0)+1
       FROM standards_habits)
    )
    RETURNING *`,
    [name, icon, color]
  );

  return rows[0];
}

module.exports = {
  getRecent,
  getByDate,
  getBest,
  upsert,
  getHabits,
  addHabit
};
