const pool = require('../config/db');

async function getGoal() {
  const { rows } = await pool.query(`SELECT * FROM fitness_goal ORDER BY id LIMIT 1`);
  return rows[0] || null;
}

async function setGoal({ goal_weight, start_weight }) {
  const current = await getGoal();
  const { rows } = await pool.query(
    `UPDATE fitness_goal SET
       goal_weight = COALESCE($1, goal_weight),
       start_weight = COALESCE($2, start_weight)
     WHERE id = $3
     RETURNING *`,
    [goal_weight ?? null, start_weight ?? null, current.id]
  );
  return rows[0];
}

async function getRecent(limit = 120) {
  const { rows } = await pool.query(
    `SELECT entry_date::text AS entry_date, weight, workout_done, workout_minutes,
            steps, water_l, protein_g, sleep_hours, locked, rules, notes
     FROM fitness_entries
     ORDER BY entry_date DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function upsertEntry(date, data) {
  const {
    weight, workout_done, workout_minutes, steps, water_l, protein_g,
    sleep_hours, locked, rules, notes
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO fitness_entries (
       entry_date, weight, workout_done, workout_minutes,
       steps, water_l, protein_g, sleep_hours, locked, rules, notes
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (entry_date) DO UPDATE SET
       weight = EXCLUDED.weight,
       workout_done = EXCLUDED.workout_done,
       workout_minutes = EXCLUDED.workout_minutes,
       steps = EXCLUDED.steps,
       water_l = EXCLUDED.water_l,
       protein_g = EXCLUDED.protein_g,
       sleep_hours = EXCLUDED.sleep_hours,
       locked = EXCLUDED.locked,
       rules = EXCLUDED.rules,
       notes = EXCLUDED.notes
     RETURNING entry_date::text AS entry_date, weight, workout_done, workout_minutes,
       steps, water_l, protein_g, sleep_hours, locked, rules, notes`,
    [
      date, weight ?? null, workout_done ?? false, workout_minutes ?? 0,
      steps ?? 0, water_l ?? 0, protein_g ?? 0, sleep_hours ?? 0,
      locked ?? false, JSON.stringify(rules || {}), notes || null
    ]
  );
  return rows[0];
}

async function getPhotos() {
  const { rows } = await pool.query(`SELECT slot, data_url FROM fitness_photos`);
  const map = {};
  rows.forEach(r => { map[r.slot] = r.data_url; });
  return map;
}

async function savePhoto(slot, data_url) {
  const { rows } = await pool.query(
    `INSERT INTO fitness_photos (slot, data_url)
     VALUES ($1, $2)
     ON CONFLICT (slot) DO UPDATE SET data_url = EXCLUDED.data_url, updated_at = now()
     RETURNING slot, data_url`,
    [slot, data_url]
  );
  return rows[0];
}

module.exports = { getGoal, setGoal, getRecent, upsertEntry, getPhotos, savePhoto };
