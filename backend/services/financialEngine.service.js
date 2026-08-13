// ==========================================
// Financial Time Explorer
// ==========================================

const START_DATE =
  new Date('2026-08-12T00:00:00');

const DAILY_PROFIT = 5000;

const MILESTONE = 300000;

function normaliseDate(value) {

  const d = new Date(value);

  d.setHours(0, 0, 0, 0);

  return d;
}

function calculate(selectedDate) {

  const start =
    normaliseDate(
      START_DATE
    );

  const target =
    normaliseDate(
      selectedDate
    );

  let days =
    Math.floor(
      (target - start) /
      86400000
    );

  days =
    Math.max(
      days,
      0
    );

  // 12 Aug = Day 1
  // 13 Aug = Day 2
  const dayNumber =
    days + 1;

  const plannedProfit =
    dayNumber *
    DAILY_PROFIT;

  return {

    simulationDate:
      target
        .toISOString()
        .slice(0, 10),

    startDate:
      '2026-08-12',

    dayNumber,

    daysElapsed:
      days,

    dailyEstimate:
      DAILY_PROFIT,

    plannedProfit:
      Math.round(
        plannedProfit
      ),

    milestone:
      MILESTONE,

    isMilestoneDay:
      plannedProfit === MILESTONE,

    milestoneReached:
      plannedProfit >= MILESTONE

  };
}

module.exports = {

  calculate,

  START_DATE,

  DAILY_PROFIT,

  MILESTONE

};
