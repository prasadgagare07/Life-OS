const pool = require('../config/db');

async function getGoal() {
  const { rows } = await pool.query(`SELECT * FROM fitness_goal ORDER BY id LIMIT 1`);
  return rows[0] || null;
}

async function setGoal(goal_weight) {
  const current = await getGoal();
  const { rows } = await pool.query(
    `UPDATE fitness_goal SET goal_weight = $1 WHERE id = $2 RETURNING *`,
    [goal_weight, current.id]
  );
  return rows[0];
}

async function getRecent(limit = 60) {
  const { rows } = await pool.query(
    `SELECT * FROM fitness_entries ORDER BY entry_date DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function upsertEntry(date, { weight, workout_done, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO fitness_entries (entry_date, weight, workout_done, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (entry_date) DO UPDATE SET
       weight = EXCLUDED.weight,
       workout_done = EXCLUDED.workout_done,
       notes = EXCLUDED.notes
     RETURNING *`,
    [date, weight, workout_done ?? false, notes || null]
  );
  return rows[0];
}

module.exports = { getGoal, setGoal, getRecent, upsertEntry };
