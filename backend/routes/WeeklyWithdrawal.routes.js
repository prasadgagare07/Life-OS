const express =
  require('express');

const router =
  express.Router();

const controller =
  require('../controllers/weeklyWithdrawal.controller');


// Account
router.get(
  '/account',
  controller.getAccount
);


// Set starting/current funds
router.put(
  '/account/funds',
  controller.setFunds
);


// Daily profit
router.post(
  '/profit',
  controller.addDailyProfit
);


// Withdraw today's profit (5k cap + surplus vault + 15th release)
router.post(
  '/withdraw-profit',
  controller.withdrawProfit
);


// Withdrawal (manual — legacy)
router.post(
  '/withdraw',
  controller.withdraw
);


// Withdrawal history
router.get(
  '/history',
  controller.history
);


// Daily entries
router.get(
  '/entries',
  controller.entries
);


module.exports =
  router;
