const BetterMe = require('../models/betterme.model');


// ==========================================
// HABITS + MONTH VIEW
// ==========================================

async function getMonth(req, res) {

  try {

    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
    }

    const [habits, completions] = await Promise.all([
      BetterMe.getHabits(),
      BetterMe.getCompletionsForMonth(year, month)
    ]);

    res.json({ habits, completions });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to load BetterMe habits' });

  }

}


async function addHabit(req, res) {

  try {

    const { name, position } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Habit name is required' });
    }

    const habit = await BetterMe.addHabit(name.trim(), position);

    res.status(201).json(habit);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to add habit' });

  }

}


async function renameHabit(req, res) {

  try {

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Habit name is required' });
    }

    const habit = await BetterMe.renameHabit(Number(req.params.id), name.trim());

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to rename habit' });

  }

}


async function reorderHabit(req, res) {

  try {

    const { position } = req.body;

    const habit = await BetterMe.reorderHabit(Number(req.params.id), position);

    res.json(habit);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to reorder habit' });

  }

}


async function deleteHabit(req, res) {

  try {

    const success = await BetterMe.deleteHabit(Number(req.params.id));

    if (!success) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ success: true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to delete habit' });

  }

}


async function setCompletion(req, res) {

  try {

    const { habit_id, entry_date, status } = req.body;

    if (!habit_id || !entry_date) {
      return res.status(400).json({ error: 'habit_id and entry_date are required' });
    }

    if (status !== null && status !== 'done' && status !== 'missed') {
      return res.status(400).json({ error: "status must be 'done', 'missed', or null" });
    }

    const result = await BetterMe.setCompletion(Number(habit_id), entry_date, status);

    res.json(result);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to save completion' });

  }

}


// ==========================================
// LIST ITEMS (Learn / Master / Character)
// ==========================================

const VALID_CATEGORIES = ['learn', 'master', 'character'];

function checkCategory(category, res) {

  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: 'Invalid category' });
    return false;
  }

  return true;

}

async function getListItems(req, res) {

  try {

    const { category } = req.params;

    if (!checkCategory(category, res)) return;

    const items = await BetterMe.getListItems(category);

    res.json(items);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to load list items' });

  }

}


async function addListItem(req, res) {

  try {

    const { category } = req.params;
    const { text, position } = req.body;

    if (!checkCategory(category, res)) return;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Item text is required' });
    }

    const item = await BetterMe.addListItem(category, text.trim(), position);

    res.status(201).json(item);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to add item' });

  }

}


async function renameListItem(req, res) {

  try {

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Item text is required' });
    }

    const item = await BetterMe.renameListItem(Number(req.params.id), text.trim());

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to rename item' });

  }

}


async function toggleListItem(req, res) {

  try {

    const { completed } = req.body;

    const item = await BetterMe.toggleListItem(Number(req.params.id), !!completed);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });

  }

}


async function deleteListItem(req, res) {

  try {

    const success = await BetterMe.deleteListItem(Number(req.params.id));

    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });

  }

}
// ==========================================
// GOALS
// ==========================================

const VALID_GOAL_TYPES = [
  'monthly',
  'yearly',
  'other'
];


function checkGoalType(goalType, res) {

  if (!VALID_GOAL_TYPES.includes(goalType)) {

    res.status(400).json({
      error: 'Goal type must be monthly, yearly, or other'
    });

    return false;

  }

  return true;

}


async function getGoals(req, res) {

  try {

    const goals = await BetterMe.getGoals();

    res.json(goals);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to load goals'
    });

  }

}


async function addGoal(req, res) {

  try {

    const {
      title,
      goal_type,
      deadline,
      reward
    } = req.body;


    if (!title || !title.trim()) {

      return res.status(400).json({
        error: 'Goal title is required'
      });

    }


    if (!checkGoalType(goal_type, res)) {
      return;
    }


    if (
      deadline &&
      !/^\d{4}-\d{2}-\d{2}$/.test(deadline)
    ) {

      return res.status(400).json({
        error: 'Deadline must use YYYY-MM-DD format'
      });

    }


    const goal =
      await BetterMe.addGoal(
        title.trim(),
        goal_type,
        deadline || null,
        reward && reward.trim()
          ? reward.trim()
          : null
      );


    res.status(201).json(goal);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to add goal'
    });

  }

}


async function updateGoal(req, res) {

  try {

    const id =
      Number(req.params.id);


    const {
      title,
      goal_type,
      deadline,
      reward
    } = req.body;


    if (!title || !title.trim()) {

      return res.status(400).json({
        error: 'Goal title is required'
      });

    }


    if (!checkGoalType(goal_type, res)) {
      return;
    }


    if (
      deadline &&
      !/^\d{4}-\d{2}-\d{2}$/.test(deadline)
    ) {

      return res.status(400).json({
        error: 'Deadline must use YYYY-MM-DD format'
      });

    }


    const goal =
      await BetterMe.updateGoal(
        id,
        title.trim(),
        goal_type,
        deadline || null,
        reward && reward.trim()
          ? reward.trim()
          : null
      );


    if (!goal) {

      return res.status(404).json({
        error: 'Goal not found or already completed'
      });

    }


    res.json(goal);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to update goal'
    });

  }

}


async function completeGoal(req, res) {

  try {

    const id =
      Number(req.params.id);


    const goal =
      await BetterMe.completeGoal(id);


    if (!goal) {

      return res.status(404).json({
        error: 'Goal not found or already completed'
      });

    }


    res.json(goal);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to complete goal'
    });

  }

}


async function deleteGoal(req, res) {

  try {

    const id =
      Number(req.params.id);


    const success =
      await BetterMe.deleteGoal(id);


    if (!success) {

      return res.status(404).json({
        error: 'Goal not found'
      });

    }


    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to delete goal'
    });

  }

}

module.exports = {

  // Habits
  getMonth,
  addHabit,
  renameHabit,
  reorderHabit,
  deleteHabit,
  setCompletion,

  // List items
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
