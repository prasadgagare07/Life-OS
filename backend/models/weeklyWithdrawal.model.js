const pool = require('../config/db');


// ==========================================
// ACCOUNT
// ==========================================

async function getAccount() {

  const { rows } = await pool.query(`
    SELECT
      id,
      account_name,
      current_funds,
      surplus_vault,
      updated_at
    FROM weekly_withdrawal_account
    ORDER BY id
    LIMIT 1
  `);

  return rows[0] || null;
}


// ==========================================
// UPDATE FUNDS
// ==========================================

async function setFunds(amount) {

  const { rows } = await pool.query(`
    UPDATE weekly_withdrawal_account
    SET
      current_funds = $1,
      updated_at = now()
    WHERE id = (
      SELECT id
      FROM weekly_withdrawal_account
      ORDER BY id
      LIMIT 1
    )
    RETURNING
      id,
      account_name,
      current_funds,
      surplus_vault,
      updated_at
  `, [amount]);

  return rows[0];
}


// ==========================================
// ADD DAILY PROFIT
// ==========================================

async function addDailyProfit(entryDate, profit) {

  const withdrawalAmount =
    Math.min(Number(profit), 5000);

  const surplusAmount =
    Math.max(Number(profit) - 5000, 0);


  const client =
    await pool.connect();


  try {

    await client.query('BEGIN');


    const entry =
      await client.query(`
        INSERT INTO weekly_withdrawal_entries
          (
            entry_date,
            profit,
            withdrawal_amount,
            surplus_amount
          )
        VALUES
          ($1, $2, $3, $4)

        ON CONFLICT (entry_date)
        DO UPDATE SET
          profit = EXCLUDED.profit,
          withdrawal_amount = EXCLUDED.withdrawal_amount,
          surplus_amount = EXCLUDED.surplus_amount

        RETURNING *
      `, [
        entryDate,
        profit,
        withdrawalAmount,
        surplusAmount
      ]);


    const account =
      await client.query(`
        UPDATE weekly_withdrawal_account
        SET
          current_funds =
            current_funds + $1,

          surplus_vault =
            surplus_vault + $2,

          updated_at = now()

        WHERE id = (
          SELECT id
          FROM weekly_withdrawal_account
          ORDER BY id
          LIMIT 1
        )

        RETURNING *
      `, [
        withdrawalAmount,
        surplusAmount
      ]);


    await client.query('COMMIT');


    return {
      entry: entry.rows[0],
      account: account.rows[0]
    };

  } catch (error) {

    await client.query('ROLLBACK');

    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// WITHDRAWAL HISTORY
// ==========================================

async function addWithdrawal(amount, note = null) {

  const client =
    await pool.connect();


  try {

    await client.query('BEGIN');


    const account =
      await client.query(`
        SELECT *
        FROM weekly_withdrawal_account
        ORDER BY id
        LIMIT 1
        FOR UPDATE
      `);


    if (!account.rows.length) {
      throw new Error(
        'Weekly Withdrawal account not found'
      );
    }


    const currentFunds =
      Number(
        account.rows[0].current_funds
      );


    if (Number(amount) <= 0) {
      throw new Error(
        'Withdrawal amount must be greater than zero'
      );
    }


    if (Number(amount) > currentFunds) {
      throw new Error(
        'Withdrawal amount exceeds available funds'
      );
    }


    const history =
      await client.query(`
        INSERT INTO weekly_withdrawal_history
          (
            withdrawal_date,
            amount,
            source,
            note
          )
        VALUES
          (
            CURRENT_DATE,
            $1,
            'WEEKLY WITHDRAWAL',
            $2
          )
        RETURNING *
      `, [
        amount,
        note
      ]);


    const updated =
      await client.query(`
        UPDATE weekly_withdrawal_account
        SET
          current_funds =
            current_funds - $1,
          updated_at = now()

        WHERE id = $2

        RETURNING *
      `, [
        amount,
        account.rows[0].id
      ]);


    await client.query('COMMIT');


    return {
      withdrawal: history.rows[0],
      account: updated.rows[0]
    };

  } catch (error) {

    await client.query('ROLLBACK');

    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// HISTORY
// ==========================================

async function getHistory() {

  const { rows } = await pool.query(`
    SELECT
      id,
      withdrawal_date::text AS withdrawal_date,
      amount,
      source,
      note,
      created_at
    FROM weekly_withdrawal_history
    ORDER BY withdrawal_date DESC, id DESC
  `);

  return rows;
}


// ==========================================
// DAILY ENTRIES
// ==========================================

async function getEntries() {

  const { rows } = await pool.query(`
    SELECT
      entry_date::text AS entry_date,
      profit,
      withdrawal_amount,
      surplus_amount,
      created_at
    FROM weekly_withdrawal_entries
    ORDER BY entry_date DESC
  `);

  return rows;
}


module.exports = {
  getAccount,
  setFunds,
  addDailyProfit,
  addWithdrawal,
  getHistory,
  getEntries
};
