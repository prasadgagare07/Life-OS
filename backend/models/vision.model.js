const pool = require('../config/db');

async function getAll() {
  const { rows } = await pool.query(
    `SELECT * FROM vision_goals ORDER BY sort_order ASC, created_at ASC`
  );
  return rows;
}

async function create({ title, description, image_url, category, sort_order }) {
  const { rows } = await pool.query(
    `INSERT INTO vision_goals (title, description, image_url, category, sort_order)
     VALUES ($1, $2, $3, $4, COALESCE($5, 0))
     RETURNING *`,
    [title, description || null, image_url || null, category || null, sort_order]
  );
  return rows[0];
}

async function update(id, { title, description, image_url, category, sort_order }) {
  const { rows } = await pool.query(
    `UPDATE vision_goals SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       image_url = COALESCE($3, image_url),
       category = COALESCE($4, category),
       sort_order = COALESCE($5, sort_order)
     WHERE id = $6
     RETURNING *`,
    [title, description, image_url, category, sort_order, id]
  );
  return rows[0];
}

async function remove(id) {
  await pool.query(`DELETE FROM vision_goals WHERE id = $1`, [id]);
}

module.exports = { getAll, create, update, remove };
