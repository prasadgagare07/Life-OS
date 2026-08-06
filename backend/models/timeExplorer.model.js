const pool = require('../config/db');
const engine = require('../services/financialEngine.service');

// Reuse the exact same projection formula the rest of the app uses
// (backend/services/financialEngine.service.js), so the calendar and the
// hero numbers can never drift apart.
async function getSimulation(date) {
  return engine.calculate(date);
}

// Real cumulative Trade Guardian profit, summed from logged trading entries
// up to and including the given date. Only meaningful during the growth
// phase (before diversification) — once diversified, income is
// formula-driven, not manually traded, so there's nothing to compare.
async function getActualTotal(date) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(profit), 0) AS actual_total
     FROM trading_entries
     WHERE entry_date <= $1`,
    [date]
  );
  return Number(rows[0].actual_total);
}

async function getTimeExplorer(date) {
  const estimated = await getSimulation(date);

  const today = new Date().toISOString().split('T')[0];
  const type = date < today ? 'past' : date === today ? 'current' : 'future';

  let comparison = null;

  // Only compare actual vs plan for growth-phase days that have already
  // happened (today or earlier) — future days have no logged trades yet.
  if (!estimated.diversified && date <= today) {
    const actualTotal = await getActualTotal(date);
    const estimatedTotal = estimated.tradeGuardianCash;
    comparison = {
      actualTotal,
      estimatedTotal,
      delta: actualTotal - estimatedTotal,
      status: actualTotal >= estimatedTotal ? 'ahead' : 'behind'
    };
  }

  return { type, estimated, comparison };
}

module.exports = {
  getSimulation,
  getActualTotal,
  getTimeExplorer
};
