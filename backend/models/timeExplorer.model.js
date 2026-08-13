const pool =
  require('../config/db');

const engine =
  require('../services/financialEngine.service');


// ==========================================
// Financial Time Explorer constants
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
// Fixed starting actual profit
// ==========================================
//
// 12 Aug 2026 = ₹6,659
// 13 Aug 2026 = ₹4,378
//
// These are used as the starting history.
// From later real dates, Trade Guardian
// becomes the source of actual profit.
// ==========================================

const FIXED_ACTUALS = {

  '2026-08-12':
    6659,

  '2026-08-13':
    4378

};


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
// Format date
// ==========================================

function formatDateOnly(date) {

  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return `${y}-${m}-${d}`;
}


// ==========================================
// Background estimate
// ==========================================

function calculateEstimate(date) {

  const selected =
    parseDateOnly(
      date
    );


  const start =
    parseDateOnly(
      FTE_START_DATE
    );


  const milestone =
    parseDateOnly(
      FTE_MILESTONE_DATE
    );


  // Before 12 Aug

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
  // Starts 11 Oct
  //
  // ₹8,333/day
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
      phase2Days *
      PHASE2_DAILY

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
  // Fixed starting history
  // ========================================

  if (
    FIXED_ACTUALS[
      dateOnly
    ] !== undefined
  ) {

    return {

      actualTotal:
        FIXED_ACTUALS[
          dateOnly
        ],

      dailyProfit:
        FIXED_ACTUALS[
          dateOnly
        ]

    };

  }


  // ========================================
  // Trade Guardian actual data
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


  // ========================================
  // Calculate cumulative actual profit
  // ========================================

  const {
    rows: cumulativeRows
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

    `,

    [
      FTE_START_DATE,
      dateOnly
    ]

  );


  const actualTotal =
    Number(
      cumulativeRows[0]
        ?.actual_total || 0
    );


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
    parseDateOnly(
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


  const start =
    parseDateOnly(
      FTE_START_DATE
    );


  const estimated =
    calculateEstimate(
      date
    );


  // ========================================
  // Date type
  // ========================================

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
  // Actual Trade Guardian data
  //
  // Only dates that have arrived.
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
