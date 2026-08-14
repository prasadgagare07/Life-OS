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

    if (mode === 'upi' && !/^[^\s@]+@[^\s@]+$/.test(String(upi_id || '').trim())) {
      return res.status(400).json({
        error: 'Valid UPI ID is required'
      });
    }

    if (
      mode === 'bank' &&
      (!account_number || !bank_name || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc_code || '').trim().toUpperCase()))
    ) {
      return res.status(400).json({
        error:
          'Account number, bank name and IFSC code are required'
      });
    }

    if (
      (mode === 'usdt' || mode === 'tron') &&
      !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(String(wallet_address || '').trim())
    ) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    // Save withdrawal account details.
    // This requires the model to expose setWithdrawalAccount().
    const result =
      await WeeklyWithdrawal.setWithdrawalAccount({
        method: mode,
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

    // Passcode confirmation now happens on the frontend via
    // POST /api/auth/verify (page: 'weekly-withdrawal') BEFORE this
    // endpoint is ever called — see the Weekly Withdrawal modal.
    // No passcode check needed here.

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
        profit,
        {
          method: req.body.mode,
          upi_id: req.body.upi_id,
          account_number: req.body.account_number,
          bank_name: req.body.bank_name,
          ifsc_code: req.body.ifsc_code,
          wallet_address: req.body.wallet_address
        }
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
