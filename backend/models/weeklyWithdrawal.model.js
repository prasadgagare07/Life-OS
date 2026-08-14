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
      withdrawal_count,
      withdrawal_method,
      upi_id,
      bank_account_number,
      bank_name,
      ifsc_code,
      wallet_address,
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
// WITHDRAWAL ACCOUNT DETAILS
// ==========================================

async function setWithdrawalAccount(data = {}) {

  const { rows } = await pool.query(`
    UPDATE weekly_withdrawal_account
    SET
      withdrawal_method = $1,
      upi_id = $2,
      bank_account_number = $3,
      bank_name = $4,
      ifsc_code = $5,
      wallet_address = $6,
      updated_at = now()
    WHERE id = (
      SELECT id FROM weekly_withdrawal_account ORDER BY id LIMIT 1
    )
    RETURNING *
  `, [
    data.method || null,
    data.upi_id || null,
    data.account_number || null,
    data.bank_name || null,
    data.ifsc_code || null,
    data.wallet_address || null
  ]);

  return rows[0];
}


// ==========================================
// ADD DAILY PROFIT (legacy — unused now that
// withdrawProfit() below handles everything)
// ==========================================

// ==========================================
// LOG DAILY PROFIT (Weekly Withdrawal's own,
// separate from Trade Guardian's entries).
// This ONLY records the entry — it does NOT
// touch current_funds or surplus_vault.
// Those are only updated when you click
// Withdraw (see withdrawProfit below).
// ==========================================

async function addDailyProfit(entryDate, profit) {

  const { rows } = await pool.query(`
    INSERT INTO weekly_withdrawal_entries
      (
        entry_date,
        profit,
        withdrawal_amount,
        surplus_amount
      )
    VALUES
      ($1, $2, 0, 0)

    ON CONFLICT (entry_date)
    DO UPDATE SET
      profit = EXCLUDED.profit

    RETURNING *
  `, [
    entryDate,
    profit
  ]);

  return { entry: rows[0] };

}
// ==========================================
// WITHDRAW TODAY'S PROFIT
//
// Rule:
//   withdrawal = min(profit, 5000)   -> added to current_funds
//   surplus    = max(profit - 5000, 0) -> added to surplus_vault
//
// Every 15th withdrawal, the accumulated surplus_vault
// balance is released (logged in history) and reset to 0.
// ==========================================

async function withdrawProfit(profit, withdrawalAccount = {}) {

  const numericProfit =
    Math.max(Number(profit) || 0, 0);

  const withdrawalAmount =
    Math.min(numericProfit, 5000);

  const surplusAmount =
    Math.max(numericProfit - 5000, 0);


  const client =
    await pool.connect();

  try {

    await client.query('BEGIN');

    const accountResult =
      await client.query(`
        SELECT *
        FROM weekly_withdrawal_account
        ORDER BY id
        LIMIT 1
        FOR UPDATE
      `);

    if (!accountResult.rows.length) {
      throw new Error(
        'Weekly Withdrawal account not found'
      );
    }

    const current = accountResult.rows[0];

    const newCount =
      Number(current.withdrawal_count) + 1;

    const vaultBeforeReset =
      Number(current.surplus_vault) + surplusAmount;

    const isReleaseWithdrawal =
      newCount % 15 === 0;

    const vaultReleased =
      isReleaseWithdrawal ? vaultBeforeReset : null;

    const finalVault =
      isReleaseWithdrawal ? 0 : vaultBeforeReset;

    const updatedAccount =
      await client.query(`
        UPDATE weekly_withdrawal_account
        SET
          current_funds = current_funds,
          surplus_vault = $1,
          withdrawal_count = $2,
          updated_at = now()
        WHERE id = $3
        RETURNING *
      `, [
        finalVault,
        newCount,
        current.id
      ]);

    const historyRow =
      await client.query(`
        INSERT INTO weekly_withdrawal_history
          (
            withdrawal_date,
            amount,
            source,
            note,
            profit,
            surplus_amount,
            withdrawal_number,
            vault_released,
            withdrawal_method,
            upi_id,
            bank_account_number,
            bank_name,
            ifsc_code,
            wallet_address
          )
        VALUES
          (
            CURRENT_DATE,
            $1,
            'WEEKLY WITHDRAWAL',
            NULL,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11
          )
        RETURNING *
      `, [
        withdrawalAmount,
        numericProfit,
        surplusAmount,
        newCount,
        vaultReleased,
        withdrawalAccount.method || null,
        withdrawalAccount.upi_id || null,
        withdrawalAccount.account_number || null,
        withdrawalAccount.bank_name || null,
        withdrawalAccount.ifsc_code || null,
        withdrawalAccount.wallet_address || null
      ]);

    await client.query('COMMIT');

    return {
      account: updatedAccount.rows[0],
      history: historyRow.rows[0]
    };

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}


// ==========================================
// WITHDRAWAL HISTORY (manual — legacy)
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
      profit,
      surplus_amount,
      withdrawal_number,
      vault_released,
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
  setWithdrawalAccount,
  addDailyProfit,
  withdrawProfit,
  addWithdrawal,
  getHistory,
  getEntries
};
