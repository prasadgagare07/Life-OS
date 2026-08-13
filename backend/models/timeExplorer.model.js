const pool =
  require('../config/db');


// ==========================================
// Financial Time Explorer
// ==========================================

const FTE_START_DATE =
  '2026-08-12';

const FTE_MILESTONE_DATE =
  '2026-10-10';

const PHASE1_DAILY =
  5000;

const PHASE1_TARGET =
  300000;

const PHASE2_DAILY =
  8333;


// ==========================================
// Fixed actual daily profits
// ==========================================
//
// 12 Aug = ₹6,659
// 13 Aug = ₹4,378
//
// These are DAILY profits.
// ==========================================

const FIXED_ACTUALS = {

  '2026-08-12':
    6659,

  '2026-08-13':
    4378

};


// ==========================================
// Date helpers
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
// Background estimate
// ==========================================

function calculateEstimate(date) {

  const selected =
    parseDateOnly(date);

  const start =
    parseDateOnly(
      FTE_START_DATE
    );

  const milestone =
    parseDateOnly(
      FTE_MILESTONE_DATE
    );


  // Before start

  if (
    selected < start
  ) {

    return {

      phase:
        0,

      dailyProfit:
        0,

      plannedProfit:
        0

    };

  }


  // ========================================
  // PHASE 1
  //
  // 12 Aug → 10 Oct
  // ₹5,000/day
  // ========================================

  if (
    selected <= milestone
  ) {

    const days =
      Math.floor(
        (
          selected -
          start
        ) /
        86400000
      ) + 1;


    return {

      phase:
        1,

      dailyProfit:
        PHASE1_DAILY,

      plannedProfit:
        days *
        PHASE1_DAILY

    };

  }


  // ========================================
  // PHASE 2
  //
  // Starts 11 Oct
  //
  // ₹3,00,000 already completed
  // + ₹8,333 for each new day
  // ========================================

  const phase2Start =
    parseDateOnly(
      '2026-10-11'
    );


  const phase2Days =
    Math.floor(
      (
        selected -
        phase2Start
      ) /
      86400000
    ) + 1;


  return {

    phase:
      2,

    dailyProfit:
      PHASE2_DAILY,

    plannedProfit:
      PHASE1_TARGET +
      (
        phase2Days *
        PHASE2_DAILY
      )

  };

}


// ==========================================
// Get actual Trade Guardian profit
// ==========================================

async function getActualForDate(date) {

  const dateOnly =
    String(date)
      .slice(0, 10);


  // ========================================
  // Fixed actuals for 12 & 13 Aug
  // ========================================

  if (
    FIXED_ACTUALS[
      dateOnly
    ] !== undefined
  ) {

    let cumulative =
      0;


    for (
      const fixedDate
      of Object.keys(
        FIXED_ACTUALS
      )
    ) {

      if (
        fixedDate <=
        dateOnly
      ) {

        cumulative +=
          FIXED_ACTUALS[
            fixedDate
          ];

      }

    }


    return {

      actualTotal:
        cumulative,

      dailyProfit:
        FIXED_ACTUALS[
          dateOnly
        ]

    };

  }


  // ========================================
  // Actual Trade Guardian profit
  // ========================================
  //
  // For dates after 13 Aug:
  //
  // ₹6,659
  // + ₹4,378
  // + actual Trade Guardian profit
  // ========================================

  const {
    rows
  } = await pool.query(

    `
    SELECT

      COALESCE(
        SUM(profit),
        0
      ) AS daily_profit,

      COUNT(*) AS today_entries

    FROM trading_entries

    WHERE entry_date = $1
    `,

    [
      dateOnly
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


  const {
    rows: laterRows
  } = await pool.query(

    `
    SELECT

      COALESCE(
        SUM(profit),
        0
      ) AS actual_total

    FROM trading_entries

    WHERE entry_date >= $1
      AND entry_date <= $2
      AND entry_date >= '2026-08-14'
    `,

    [
      FTE_START_DATE,
      dateOnly
    ]

  );


  const laterActual =
    Number(
      laterRows[0]
        ?.actual_total || 0
    );


  // Add fixed 12 + 13 Aug profits

  const actualTotal =
    6659 +
    4378 +
    laterActual;


  return {

    actualTotal,

    dailyProfit:
      Number(
        rows[0]
          .daily_profit || 0
      )

  };

}


// ==========================================
// Main Financial Time Explorer
// ==========================================

async function getTimeExplorer(date) {

  const selected =
    parseDateOnly(date);


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const start =
    parseDateOnly(
      FTE_START_DATE
    );


  const estimated =
    calculateEstimate(
      date
    );


  let type;


  if (
    selected < today
  ) {

    type =
      'past';

  } else if (
    selected.getTime() ===
    today.getTime()
  ) {

    type =
      'current';

  } else {

    type =
      'future';

  }


  let comparison =
    null;


  // ========================================
  // Actual data only when date has arrived
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
