const pool = require('../config/db');


// ==========================================
// HABITS — list (ordered, with each habit's
// completion map for a given month baked in)
// ==========================================

async function getHabits() {

  const { rows } = await pool.query(`
    SELECT id, name, position
    FROM betterme_habits
    WHERE archived = FALSE
    ORDER BY position ASC, id ASC
  `);

  return rows;
}


async function getCompletionsForMonth(year, month) {

  // month is 1-12 here; build the date range for that calendar month
  const start = `${year}-${String(month).padStart(2, '0')}-01`;

  const { rows } = await pool.query(`
    SELECT habit_id, entry_date::text AS entry_date, status
    FROM betterme_habit_completion
    WHERE entry_date >= $1::date
      AND entry_date < ($1::date + INTERVAL '1 month')
  `, [start]);

  return rows;
}


// ==========================================
// ADD HABIT — inserts at a given position,
// shifting everything at/after that position
// down by one. position is 1-based.
// ==========================================

async function addHabit(name, position) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { rows: countRows } = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM betterme_habits
      WHERE archived = FALSE
    `);

    const total = countRows[0].count;

    const safePosition =
      Math.min(Math.max(Number(position) || total + 1, 1), total + 1);

    await client.query(`
      UPDATE betterme_habits
      SET position = position + 1
      WHERE position >= $1 AND archived = FALSE
    `, [safePosition]);

    const { rows } = await client.query(`
      INSERT INTO betterme_habits (name, position)
      VALUES ($1, $2)
      RETURNING id, name, position
    `, [name, safePosition]);

    await client.query('COMMIT');

    return rows[0];

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// RENAME HABIT — keeps its ID and history
// ==========================================

async function renameHabit(id, name) {

  const { rows } = await pool.query(`
    UPDATE betterme_habits
    SET name = $1
    WHERE id = $2 AND archived = FALSE
    RETURNING id, name, position
  `, [name, id]);

  return rows[0] || null;
}


// ==========================================
// REORDER HABIT — moves a habit to a new
// position, shifting everything between its
// old and new spot accordingly.
// ==========================================

async function reorderHabit(id, newPosition) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { rows: currentRows } = await client.query(`
      SELECT position FROM betterme_habits
      WHERE id = $1 AND archived = FALSE
      FOR UPDATE
    `, [id]);

    if (!currentRows.length) {
      throw new Error('Habit not found');
    }

    const oldPosition = currentRows[0].position;

    const { rows: countRows } = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM betterme_habits
      WHERE archived = FALSE
    `);

    const total = countRows[0].count;

    const safeNewPosition =
      Math.min(Math.max(Number(newPosition) || oldPosition, 1), total);

    if (safeNewPosition === oldPosition) {

      await client.query('COMMIT');

      const { rows } = await pool.query(`
        SELECT id, name, position FROM betterme_habits WHERE id = $1
      `, [id]);

      return rows[0];

    }

    if (safeNewPosition < oldPosition) {

      // moving up: everything between new and old shifts down by 1
      await client.query(`
        UPDATE betterme_habits
        SET position = position + 1
        WHERE position >= $1 AND position < $2 AND archived = FALSE
      `, [safeNewPosition, oldPosition]);

    } else {

      // moving down: everything between old and new shifts up by 1
      await client.query(`
        UPDATE betterme_habits
        SET position = position - 1
        WHERE position > $1 AND position <= $2 AND archived = FALSE
      `, [oldPosition, safeNewPosition]);

    }

    const { rows } = await client.query(`
      UPDATE betterme_habits
      SET position = $1
      WHERE id = $2
      RETURNING id, name, position
    `, [safeNewPosition, id]);

    await client.query('COMMIT');

    return rows[0];

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// DELETE HABIT — removes it and closes the
// position gap for everything after it. Its
// own completion history is deleted with it
// (ON DELETE CASCADE); everyone else's stays.
// ==========================================

async function deleteHabit(id) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { rows: currentRows } = await client.query(`
      SELECT position FROM betterme_habits
      WHERE id = $1 AND archived = FALSE
      FOR UPDATE
    `, [id]);

    if (!currentRows.length) {
      await client.query('ROLLBACK');
      return false;
    }

    const position = currentRows[0].position;

    await client.query(`
      DELETE FROM betterme_habits WHERE id = $1
    `, [id]);

    await client.query(`
      UPDATE betterme_habits
      SET position = position - 1
      WHERE position > $1 AND archived = FALSE
    `, [position]);

    await client.query('COMMIT');

    return true;

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// SET COMPLETION — 'done' | 'missed' | null
// (null clears back to blank)
// ==========================================

async function setCompletion(habitId, entryDate, status) {

  if (status === null) {

    await pool.query(`
      DELETE FROM betterme_habit_completion
      WHERE habit_id = $1 AND entry_date = $2
    `, [habitId, entryDate]);

    return { habit_id: habitId, entry_date: entryDate, status: null };

  }

  const { rows } = await pool.query(`
    INSERT INTO betterme_habit_completion (habit_id, entry_date, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (habit_id, entry_date)
    DO UPDATE SET status = $3, updated_at = now()
    RETURNING habit_id, entry_date::text AS entry_date, status
  `, [habitId, entryDate, status]);

  return rows[0];
}


// ==========================================
// LIST ITEMS (Learn / Master / Character)
// ==========================================

async function getListItems(category) {

  const { rows } = await pool.query(`
    SELECT id, category, text, position, completed
    FROM betterme_list_items
    WHERE category = $1 AND archived = FALSE
    ORDER BY position ASC, id ASC
  `, [category]);

  return rows;
}


async function addListItem(category, text, position) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { rows: countRows } = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM betterme_list_items
      WHERE category = $1 AND archived = FALSE
    `, [category]);

    const total = countRows[0].count;

    const safePosition =
      Math.min(Math.max(Number(position) || total + 1, 1), total + 1);

    await client.query(`
      UPDATE betterme_list_items
      SET position = position + 1
      WHERE category = $1 AND position >= $2 AND archived = FALSE
    `, [category, safePosition]);

    const { rows } = await client.query(`
      INSERT INTO betterme_list_items (category, text, position)
      VALUES ($1, $2, $3)
      RETURNING id, category, text, position, completed
    `, [category, text, safePosition]);

    await client.query('COMMIT');

    return rows[0];

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}


async function renameListItem(id, text) {

  const { rows } = await pool.query(`
    UPDATE betterme_list_items
    SET text = $1
    WHERE id = $2 AND archived = FALSE
    RETURNING id, category, text, position, completed
  `, [text, id]);

  return rows[0] || null;
}


async function toggleListItem(id, completed) {

  const { rows } = await pool.query(`
    UPDATE betterme_list_items
    SET completed = $1
    WHERE id = $2 AND archived = FALSE
    RETURNING id, category, text, position, completed
  `, [completed, id]);

  return rows[0] || null;
}


async function deleteListItem(id) {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { rows: currentRows } = await client.query(`
      SELECT category, position FROM betterme_list_items
      WHERE id = $1 AND archived = FALSE
      FOR UPDATE
    `, [id]);

    if (!currentRows.length) {
      await client.query('ROLLBACK');
      return false;
    }

    const { category, position } = currentRows[0];

    await client.query(`
      DELETE FROM betterme_list_items WHERE id = $1
    `, [id]);

    await client.query(`
      UPDATE betterme_list_items
      SET position = position - 1
      WHERE category = $1 AND position > $2 AND archived = FALSE
    `, [category, position]);

    await client.query('COMMIT');

    return true;

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}
// ==========================================
// GOALS
// ==========================================

async function getGoals() {

  const { rows } = await pool.query(`
    SELECT
      id,
      title,
      goal_type,
      deadline::text AS deadline,
      reward,
      completed,
      completed_at,
      created_at
    FROM betterme_goals
    ORDER BY
      completed ASC,
      CASE goal_type
        WHEN 'monthly' THEN 1
        WHEN 'yearly' THEN 2
        WHEN 'other' THEN 3
        ELSE 4
      END,
      id ASC
  `);

  return rows;
}


async function addGoal(
  title,
  goalType,
  deadline,
  reward
) {

  const { rows } = await pool.query(`
    INSERT INTO betterme_goals
      (
        title,
        goal_type,
        deadline,
        reward,
        completed
      )
    VALUES
      ($1, $2, $3, $4, FALSE)
    RETURNING
      id,
      title,
      goal_type,
      deadline::text AS deadline,
      reward,
      completed,
      completed_at,
      created_at
  `, [
    title,
    goalType,
    deadline || null,
    reward || null
  ]);

  return rows[0];
}


async function updateGoal(
  id,
  title,
  goalType,
  deadline,
  reward
) {

  const { rows } = await pool.query(`
    UPDATE betterme_goals
    SET
      title = $1,
      goal_type = $2,
      deadline = $3,
      reward = $4
    WHERE id = $5
      AND completed = FALSE
    RETURNING
      id,
      title,
      goal_type,
      deadline::text AS deadline,
      reward,
      completed,
      completed_at,
      created_at
  `, [
    title,
    goalType,
    deadline || null,
    reward || null,
    id
  ]);

  return rows[0] || null;
}


async function completeGoal(id) {

  const { rows } = await pool.query(`
    UPDATE betterme_goals
    SET
      completed = TRUE,
      completed_at = NOW()
    WHERE id = $1
      AND completed = FALSE
    RETURNING
      id,
      title,
      goal_type,
      deadline::text AS deadline,
      reward,
      completed,
      completed_at,
      created_at
  `, [id]);

  return rows[0] || null;
}


async function deleteGoal(id) {

  const { rowCount } = await pool.query(`
    DELETE FROM betterme_goals
    WHERE id = $1
  `, [id]);

  return rowCount > 0;
}

module.exports = {
  getHabits,
  getCompletionsForMonth,
  addHabit,
  renameHabit,
  reorderHabit,
  deleteHabit,
  setCompletion,

  getListItems,
  addListItem,
  renameListItem,
  toggleListItem,
  deleteListItem,

  // Goals
  getGoals,
  addGoal,
  updateGoal,
  completeGoal,
  deleteGoal
};
