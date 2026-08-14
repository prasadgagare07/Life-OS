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
      await WeeklyWithdrawal.setFunds(
        amount
      );


    res.json(account);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to update funds'
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


// WITHDRAW TODAY'S PROFIT (5k cap + surplus vault + 15th release)

async function withdrawProfit(req, res) {

  try {

    const profit =
      Number(req.body.profit);


    if (!Number.isFinite(profit) || profit < 0) {

      return res.status(400).json({
        error: 'Valid non-negative profit is required'
      });

    }


    const result =
      await WeeklyWithdrawal.withdrawProfit(profit);


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

// SET WEEKLY WITHDRAWAL ACCOUNT
async function setWithdrawalAccount(req, res) {
  try {
    const {
      withdrawal_method,
      upi_id,
      account_number,
      bank_name,
      ifsc_code,
      wallet_address
    } = req.body;

    const allowedMethods = [
      'upi',
      'bank',
      'usdt',
      'tron'
    ];

    if (!allowedMethods.includes(withdrawal_method)) {
      return res.status(400).json({
        error: 'Invalid withdrawal method'
      });
    }

    if (withdrawal_method === 'upi' && !upi_id) {
      return res.status(400).json({
        error: 'UPI ID is required'
      });
    }

    if (
      withdrawal_method === 'bank' &&
      (!account_number || !bank_name || !ifsc_code)
    ) {
      return res.status(400).json({
        error: 'Account number, bank name and IFSC code are required'
      });
    }

    if (
      (withdrawal_method === 'usdt' ||
       withdrawal_method === 'tron') &&
      !wallet_address
    ) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    const account =
      await WeeklyWithdrawal.setWithdrawalAccount({
        withdrawal_method,
        upi_id: withdrawal_method === 'upi' ? upi_id : null,
        account_number: withdrawal_method === 'bank' ? account_number : null,
        bank_name: withdrawal_method === 'bank' ? bank_name : null,
        ifsc_code: withdrawal_method === 'bank' ? ifsc_code : null,
        wallet_address:
          withdrawal_method === 'usdt' || withdrawal_method === 'tron'
            ? wallet_address
            : null
      });

    res.json(account);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to save withdrawal account'
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
      error: 'Failed to load withdrawal history'
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
      error: 'Failed to load daily profits'
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
