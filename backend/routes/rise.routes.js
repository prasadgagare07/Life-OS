// ============================================
// RISE — one self-contained backend file.
// Requiring this module (from app.js) does three things on load:
//   1. Creates rise_categories / rise_debts / rise_payments if missing
//   2. Seeds a default "rise" passcode if one doesn't exist yet
//   3. Exposes the Express router for /api/rise
//
// One source of truth: rise_debts holds the master record for each
// lender. rise_payments holds every payment ever made against a debt.
// paid_amount, remaining_amount, status, and last_payment_at are never
// stored — always derived from rise_payments at query time — so the
// Complete view and the Paths view can never disagree with each other.
// ============================================

const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

// ---------- 1 & 2: self-migrate + self-seed on module load ----------

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS rise_categories (
      name        TEXT PRIMARY KEY,
      sort_order  INTEGER NOT NULL DEFAULT 0
  );

  INSERT INTO rise_categories (name, sort_order) VALUES
      ('Big Commitments',    1),
      ('Family / Relations', 2),
      ('Friends',            3),
      ('Loan Apps',          4),
      ('Other',              5)
  ON CONFLICT (name) DO NOTHING;

  CREATE TABLE IF NOT EXISTS rise_debts (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      original_amount  NUMERIC(14,2) NOT NULL CHECK (original_amount > 0),
      fixed_interest   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fixed_interest >= 0),
      category         TEXT NOT NULL,
      notes            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS rise_payments (
      id            SERIAL PRIMARY KEY,
      debt_id       INTEGER NOT NULL REFERENCES rise_debts(id) ON DELETE CASCADE,
      amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
      payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
      note          TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_rise_payments_debt_id ON rise_payments(debt_id);
  CREATE INDEX IF NOT EXISTS idx_rise_debts_category ON rise_debts(category);
`;

// Category is a foreign key into rise_categories rather than a CHECK
// constraint, so adding a new category later is just a new row — and
// renaming one (ON UPDATE CASCADE) automatically moves every debt that
// used the old name. Kept as a separate statement because it needs a
// guarded DO block (no "ADD CONSTRAINT IF NOT EXISTS" in Postgres).
const ADD_CATEGORY_FK_SQL = `
  DO $$
  BEGIN
      IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_rise_debts_category'
      ) THEN
          ALTER TABLE rise_debts
              ADD CONSTRAINT fk_rise_debts_category
              FOREIGN KEY (category) REFERENCES rise_categories(name)
              ON UPDATE CASCADE;
      END IF;
  END $$;
`;

const RISE_DEFAULT_PASSCODE = 'ascend'; // change this from Settings after first login

async function initRise() {
  try {
    await pool.query(MIGRATION_SQL);
    await pool.query(ADD_CATEGORY_FK_SQL);

    const { rows } = await pool.query(`SELECT 1 FROM auth_settings WHERE page = 'rise'`);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(RISE_DEFAULT_PASSCODE, 10);
      await pool.query(
        `INSERT INTO auth_settings (page, passcode_hash) VALUES ('rise', $1)
         ON CONFLICT (page) DO NOTHING`,
        [hash]
      );
      console.warn(`⚠️  Seeded default Rise passcode: "${RISE_DEFAULT_PASSCODE}" — change it from Settings.`);
    }

    console.log('✅ Rise database initialized');
  } catch (err) {
    console.error('❌ Rise init error:', err);
  }
}

initRise();

// ---------- Data access ----------

// Every read goes through this SELECT — paid_amount, remaining_amount,
// status, and last_payment_at are computed here from rise_payments and
// never written back to rise_debts.
const DEBT_SELECT = `
  SELECT
    d.id, d.name, d.original_amount, d.fixed_interest, d.category, d.notes,
    d.created_at, d.updated_at,
    COALESCE(p.paid_amount, 0)                                  AS paid_amount,
    GREATEST(d.original_amount - COALESCE(p.paid_amount, 0), 0) AS remaining_amount,
    p.last_payment_at,
    CASE
      WHEN COALESCE(p.paid_amount, 0) <= 0                 THEN 'not_started'
      WHEN COALESCE(p.paid_amount, 0) >= d.original_amount THEN 'cleared'
      ELSE 'in_progress'
    END AS status
  FROM rise_debts d
  LEFT JOIN LATERAL (
    SELECT SUM(amount) AS paid_amount, MAX(payment_date) AS last_payment_at
    FROM rise_payments WHERE debt_id = d.id
  ) p ON true
`;

async function listDebts() {
  const { rows } = await pool.query(`${DEBT_SELECT} ORDER BY d.created_at DESC`);
  return rows;
}

async function getDebt(id) {
  const { rows } = await pool.query(`${DEBT_SELECT} WHERE d.id = $1`, [id]);
  return rows[0] || null;
}

async function listCategories() {
  const { rows } = await pool.query(`SELECT name, sort_order FROM rise_categories ORDER BY sort_order, name`);
  return rows;
}

async function createDebt({ name, original_amount, fixed_interest, category, notes, initial_paid_amount, date }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO rise_debts (name, original_amount, fixed_interest, category, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, original_amount, fixed_interest ?? 0, category, notes || null]
    );
    const debtId = rows[0].id;
    const initialPaid = Number(initial_paid_amount) || 0;
    if (initialPaid > 0) {
      await client.query(
        `INSERT INTO rise_payments (debt_id, amount, payment_date, note)
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), 'Initial payment')`,
        [debtId, initialPaid, date || null]
      );
    }
    await client.query('COMMIT');
    return getDebt(debtId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateDebt(id, { name, original_amount, fixed_interest, category, notes }) {
  const { rows } = await pool.query(
    `UPDATE rise_debts SET
       name = COALESCE($1, name), original_amount = COALESCE($2, original_amount),
       fixed_interest = COALESCE($3, fixed_interest), category = COALESCE($4, category),
       notes = COALESCE($5, notes), updated_at = now()
     WHERE id = $6 RETURNING id`,
    [name ?? null, original_amount ?? null, fixed_interest ?? null, category ?? null, notes ?? null, id]
  );
  if (rows.length === 0) return null;
  return getDebt(id);
}

async function deleteDebt(id) {
  const { rowCount } = await pool.query(`DELETE FROM rise_debts WHERE id = $1`, [id]);
  return rowCount > 0;
}

async function listPayments(debtId) {
  const { rows } = await pool.query(
    `SELECT id, debt_id, amount, payment_date, note, created_at
     FROM rise_payments WHERE debt_id = $1 ORDER BY payment_date DESC, created_at DESC`,
    [debtId]
  );
  return rows;
}

async function addPayment(debtId, { amount, payment_date, note }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO rise_payments (debt_id, amount, payment_date, note)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4) RETURNING id`,
      [debtId, amount, payment_date || null, note || null]
    );
    // A new payment changes paid/remaining/status, so it counts as the
    // record being updated — Last Update moves, same as an edit.
    await client.query(`UPDATE rise_debts SET updated_at = now() WHERE id = $1`, [debtId]);
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Validation helpers ----------

function isPositiveNumber(n) { return typeof n === 'number' && !Number.isNaN(n) && n > 0; }
function isNonNegativeNumber(n) { return typeof n === 'number' && !Number.isNaN(n) && n >= 0; }

// ---------- Routes ----------

const router = express.Router();
// ---------- TEMPORARY: one-time passcode reset, visit from your phone ----------
// Placed BEFORE the auth middleware below on purpose — it has its own key
// check instead. Delete this whole block once login works; an
// unauthenticated route (even key-protected) is not something to leave
// live in a real deployment.
router.get('/_reset-passcode', async (req, res) => {
  if (req.query.key !== 'fixmenow123') {
    return res.status(403).send('wrong key');
  }
  const hash = await bcrypt.hash('ascend', 10);
  await pool.query(
    `INSERT INTO auth_settings (page, passcode_hash) VALUES ('rise', $1)
     ON CONFLICT (page) DO UPDATE SET passcode_hash = EXCLUDED.passcode_hash`,
    [hash]
  );
  res.send('✅ Rise passcode set to "ascend". Go delete this route now.');
});

router.use(requireAuth(['rise', 'dashboard']));

router.get('/', async (req, res) => {
  const [debts, categories] = await Promise.all([listDebts(), listCategories()]);
  res.json({ debts, categories });
});

router.post('/', async (req, res) => {
  const { name, original_amount, fixed_interest, category, notes, initial_paid_amount, date } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!isPositiveNumber(Number(original_amount))) return res.status(400).json({ error: 'Original amount must be a positive number' });
  if (fixed_interest !== undefined && !isNonNegativeNumber(Number(fixed_interest))) return res.status(400).json({ error: 'Fixed interest cannot be negative' });
  if (!category || !category.trim()) return res.status(400).json({ error: 'Category is required' });
  if (initial_paid_amount !== undefined && !isNonNegativeNumber(Number(initial_paid_amount))) return res.status(400).json({ error: 'Initial paid amount cannot be negative' });

  try {
    const debt = await createDebt({
      name: name.trim(),
      original_amount: Number(original_amount),
      fixed_interest: Number(fixed_interest) || 0,
      category: category.trim(),
      notes: notes || null,
      initial_paid_amount: Number(initial_paid_amount) || 0,
      date: date || null,
    });
    res.status(201).json(debt);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Unknown category' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, original_amount, fixed_interest, category, notes } = req.body;

  if (original_amount !== undefined && !isPositiveNumber(Number(original_amount))) return res.status(400).json({ error: 'Original amount must be a positive number' });
  if (fixed_interest !== undefined && !isNonNegativeNumber(Number(fixed_interest))) return res.status(400).json({ error: 'Fixed interest cannot be negative' });

  try {
    const debt = await updateDebt(id, {
      name: name !== undefined ? name.trim() : undefined,
      original_amount: original_amount !== undefined ? Number(original_amount) : undefined,
      fixed_interest: fixed_interest !== undefined ? Number(fixed_interest) : undefined,
      category: category !== undefined ? category.trim() : undefined,
      notes,
    });
    if (!debt) return res.status(404).json({ error: 'Debt not found' });
    res.json(debt);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Unknown category' });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const deleted = await deleteDebt(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Debt not found' });
  res.status(204).send();
});

router.get('/:id/payments', async (req, res) => {
  const debt = await getDebt(req.params.id);
  if (!debt) return res.status(404).json({ error: 'Debt not found' });
  res.json(await listPayments(req.params.id));
});

router.post('/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { amount, payment_date, note, allow_overpay } = req.body;

  if (!isPositiveNumber(Number(amount))) return res.status(400).json({ error: 'Payment amount must be a positive number' });

  const debt = await getDebt(id);
  if (!debt) return res.status(404).json({ error: 'Debt not found' });

  const remaining = Number(debt.remaining_amount);
  if (Number(amount) > remaining && !allow_overpay) {
    return res.status(400).json({
      error: `Payment of ${amount} exceeds the remaining ${remaining}. Resend with allow_overpay: true to record it anyway.`,
    });
  }

  const payment = await addPayment(id, { amount: Number(amount), payment_date: payment_date || null, note: note || null });
  const updatedDebt = await getDebt(id);
  res.status(201).json({ payment, debt: updatedDebt });
});

module.exports = router;
