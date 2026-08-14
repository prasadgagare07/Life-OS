const WeeklyWithdrawal =
  require('../models/weeklyWithdrawal.model');


// GET ACCOUNT
async function getAccount(req, res) {
  try {
    const account =
      await WeeklyWithdrawal.getAccount();

    res.json(account);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to load Weekly Withdrawal account'
    });
  }
}


// SET INITIAL FUNDS
async function setFunds(req, res) {
  try {
    const amount =
      Number(req.body.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        error: 'Valid non-negative amount required'
      });
    }

    const account =
      await WeeklyWithdrawal.setFunds(amount);

    res.json(account);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to update funds'
    });
  }
}


// SET WITHDRAWAL ACCOUNT
async function setWithdrawalAccount(req, res) {
  try {

    const {
      mode,
      upi_id,
      account_number,
      bank_name,
      ifsc_code,
      wallet_address
    } = req.body;

    const allowedModes = [
      'upi',
      'bank',
      'usdt',
      'tron'
    ];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        error: 'Invalid withdrawal mode'
      });
    }

    if (mode === 'upi' && !upi_id) {
      return res.status(400).json({
        error: 'UPI ID is required'
      });
    }

    if (
      mode === 'bank' &&
      (!account_number || !bank_name || !ifsc_code)
    ) {
      return res.status(400).json({
        error:
          'Account number, bank name and IFSC code are required'
      });
    }

    if (
      (mode === 'usdt' || mode === 'tron') &&
      !wallet_address
    ) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    // Save withdrawal account details.
    // This requires the model to expose setWithdrawalAccount().
    const result =
      await WeeklyWithdrawal.setWithdrawalAccount({
        mode,
        upi_id: upi_id || null,
        account_number: account_number || null,
        bank_name: bank_name || null,
        ifsc_code: ifsc_code || null,
        wallet_address: wallet_address || null
      });

    res.json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to save withdrawal account'
    });
  }
}


// ADD DAILY PROFIT
async function addDailyProfit(req, res) {
  try {

    const {
      entry_date,
      profit
    } = req.body;

    const numericProfit =
      Number(profit);

    if (
      !entry_date ||
      !Number.isFinite(numericProfit) ||
      numericProfit < 0
    ) {
      return res.status(400).json({
        error:
          'entry_date and valid non-negative profit are required'
      });
    }

    const result =
      await WeeklyWithdrawal.addDailyProfit(
        entry_date,
        numericProfit
      );

    res.status(201).json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to save daily profit'
    });
  }
}


// WITHDRAW TODAY'S PROFIT
async function withdrawProfit(req, res) {
  try {

    const profit =
      Number(req.body.profit);

    const passcode =
      String(req.body.passcode || '');

    const expectedPasscode =
      String(
        process.env.WEEKLY_WITHDRAWAL_PASSCODE || ''
      );

    if (!expectedPasscode) {
      return res.status(503).json({
        error:
          'Weekly withdrawal passcode is not configured'
      });
    }

    if (passcode !== expectedPasscode) {
      return res.status(401).json({
        error: 'Invalid withdrawal passcode'
      });
    }

    if (
      !Number.isFinite(profit) ||
      profit < 0
    ) {
      return res.status(400).json({
        error:
          'Valid non-negative profit is required'
      });
    }

    const result =
      await WeeklyWithdrawal.withdrawProfit(
        profit
      );

    res.json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to withdraw profit'
    });
  }
}


// WITHDRAW
async function withdraw(req, res) {
  try {

    const amount =
      Number(req.body.amount);

    const note =
      req.body.note || null;

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: 'Valid withdrawal amount required'
      });
    }

    const result =
      await WeeklyWithdrawal.addWithdrawal(
        amount,
        note
      );

    res.json(result);

  } catch (err) {
    console.error(err);

    res.status(400).json({
      error: err.message
    });
  }
}


// HISTORY
async function history(req, res) {
  try {

    const data =
      await WeeklyWithdrawal.getHistory();

    res.json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        'Failed to load withdrawal history'
    });
  }
}


// ENTRIES
async function entries(req, res) {
  try {

    const data =
      await WeeklyWithdrawal.getEntries();

    res.json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        'Failed to load daily profits'
    });
  }
}


module.exports = {
  getAccount,
  setFunds,
  setWithdrawalAccount,
  addDailyProfit,
  withdrawProfit,
  withdraw,
  history,
  entries
};
