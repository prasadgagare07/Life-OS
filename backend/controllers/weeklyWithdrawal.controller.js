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
  addDailyProfit,
  withdrawProfit,
  withdraw,
  history,
  entries
};
