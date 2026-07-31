const pool = require('../config/db');

async function getSnapshot() {
  const { rows } = await pool.query(`SELECT * FROM finance_snapshot ORDER BY id LIMIT 1`);
  return rows[0] || null;
}

async function updateSnapshot({ bank_balance, market_funds, emergency_fund, goal_amount }) {
  const current = await getSnapshot();

  const { rows } = await pool.query(
    `UPDATE finance_snapshot SET
       bank_balance = COALESCE($1, bank_balance),
       market_funds = COALESCE($2, market_funds),
       emergency_fund = COALESCE($3, emergency_fund),
       goal_amount = COALESCE($4, goal_amount),
       updated_at = now()
     WHERE id = $5
     RETURNING *`,
    [bank_balance, market_funds, emergency_fund, goal_amount, current.id]
  );

  const updated = rows[0];
  const total = Number(updated.bank_balance) + Number(updated.market_funds) + Number(updated.emergency_fund);

  await pool.query(
`INSERT INTO finance_history
(recorded_on,total_wealth)
VALUES(CURRENT_DATE,$1)
ON CONFLICT(recorded_on)
DO UPDATE SET
total_wealth=EXCLUDED.total_wealth`,
[total]
);

  return updated;
}

async function getTimeline(limit = 90) {
  const { rows } = await pool.query(
    `SELECT * FROM finance_history ORDER BY recorded_on DESC LIMIT $1`,
    [limit]
  );
  async function getStatistics() {

const { rows: history } = await pool.query(
`SELECT recorded_on,total_wealth
FROM finance_history
ORDER BY recorded_on ASC`
);

if(history.length===0){

return{

highestWealth:0,
bestDay:0,
bestDate:null,
monthlyGrowth:0,
wealthDays:0,
averageGrowth:0

};

}

const highest=Math.max(
...history.map(x=>Number(x.total_wealth))
);

const best=history.reduce(
(a,b)=>
Number(a.total_wealth)>Number(b.total_wealth)
?a:b
);

const first=Number(history[0].total_wealth);

const last=Number(history[history.length-1].total_wealth);

const monthlyGrowth=last-first;

const averageGrowth=
history.length>1
?Math.round((last-first)/(history.length-1))
:0;

return{

highestWealth:highest,

bestDay:Number(best.total_wealth),

bestDate:best.recorded_on,

monthlyGrowth,

wealthDays:history.length,

averageGrowth

};

  }
  return rows;
}

module.exports = {
getSnapshot,
updateSnapshot,
getTimeline,
getStatistics
};
