const pool =
  require('../config/db');

const engine =
  require('../services/financialEngine.service');


// ==========================================
// Get actual Trade Guardian profit
// ==========================================

async function getActualForDate(date) {

  const {
    rows
  } = await pool.query(

    `
    SELECT

      COALESCE(
        SUM(profit),
        0
      ) AS actual_total,

      MAX(profit)
        FILTER (
          WHERE entry_date = $1
        ) AS daily_profit,

      COUNT(*)
        FILTER (
          WHERE entry_date = $1
        ) AS today_entries

    FROM trading_entries

    WHERE entry_date >= $2

      AND entry_date <= $1

    `,

    [
      date,

      engine.START_DATE
        .toISOString()
        .slice(0, 10)
    ]

  );

  if (
    !rows.length ||
    Number(
      rows[0].today_entries
    ) === 0
  ) {

    return null;

  }

  return {

    actualTotal:
      Number(
        rows[0].actual_total
      ),

    dailyProfit:
      Number(
        rows[0].daily_profit
      )

  };

}


// ==========================================
// Parse YYYY-MM-DD safely
// ==========================================

function parseDateOnly(value) {

  const [
    y,
    m,
    d
  ] =
    String(value)
      .slice(0, 10)
      .split('-')
      .map(Number);

  return new Date(
    y,
    m - 1,
    d
  );
}


// ==========================================
// Main Financial Time Explorer calculation
// ==========================================

async function getTimeExplorer(date) {

  const estimated =
    engine.calculate(
      date
    );

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const selected =
    parseDateOnly(
      date
    );

  const start =
    parseDateOnly(
      engine.START_DATE
        .toISOString()
        .slice(0, 10)
    );


  let type;

  if (
    selected < today
  ) {

    type = 'past';

  } else if (
    selected.getTime() ===
    today.getTime()
  ) {

    type = 'current';

  } else {

    type = 'future';

  }


  let comparison =
    null;


  // ========================================
  // Only dates from 12 Aug onward
  // and dates that have arrived
  // use Trade Guardian actual data.
  // ========================================

  if (
    selected <= today &&
    selected >= start
  ) {

    const actual =
      await getActualForDate(
        date
      );


    if (actual) {

      comparison = {

        actualTotal:
          actual.actualTotal,

        dailyProfit:
          actual.dailyProfit,

        estimatedTotal:
          estimated.plannedProfit,

        delta:
          actual.actualTotal -
          estimated.plannedProfit,

        status:
          actual.actualTotal >=
          estimated.plannedProfit

            ? 'ahead'

            : 'behind'

      };

    }

  }


  return {

    type,

    estimated,

    comparison

  };

}


module.exports = {

  getTimeExplorer,

  getActualForDate

};
