const pool = require('../config/db');

const START_DATE = new Date('2026-08-05');

const DAILY_PHASE_1 = 5000;
const TRIGGER_AMOUNT = 300000;

const DAILY_PHASE_2 = 8333;

const INITIAL_EXPENSE = 100000;
const DEPLOYED_CAPITAL = 160000;
const BACKUP_SAVINGS = 40000;


function daysBetween(start, end) {
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}


function calculateFuture(dateInput) {

  const targetDate = new Date(dateInput);

  let tradeCash = 0;

  let freedomFund = 0;
  let savings = 0;
  let emergencyFund = 0;

  let diversified = false;
  let deployedCapital = 0;
  let backupSavings = 0;

  let totalIncome = 0;

  const totalDays = daysBetween(
    START_DATE,
    targetDate
  );


  for (let day = 0; day <= totalDays; day++) {

    const currentDate = new Date(START_DATE);

    currentDate.setDate(
      START_DATE.getDate() + day
    );


    if (!diversified) {

      tradeCash += DAILY_PHASE_1;


      if (tradeCash >= TRIGGER_AMOUNT) {

        diversified = true;

        tradeCash = 0;

        deployedCapital = DEPLOYED_CAPITAL;

        savings += BACKUP_SAVINGS;

      }


    } else {

      const dailyIncome = DAILY_PHASE_2;

      totalIncome += dailyIncome;


      freedomFund += dailyIncome * 0.70;

      savings += dailyIncome * 0.20;

      emergencyFund += dailyIncome * 0.10;

    }

  }


  return {

    selectedDate: dateInput,

    freedomFund: Math.round(freedomFund),

    savings: Math.round(savings),

    emergencyFund: Math.round(emergencyFund),

    deployedCapital,

    backupSavings,

    totalIncome: Math.round(totalIncome),

    diversified

  };

}



async function getSimulation(date) {

  return calculateFuture(date);

}



async function getActual(date) {

  const { rows } = await pool.query(
    `
    SELECT *
    FROM financial_actual_history
    WHERE history_date = $1
    `,
    [date]
  );


  return rows[0] || null;

}



async function getTimeExplorer(date) {

  const estimated = await getSimulation(date);

  const actual = await getActual(date);


  const today =
    new Date().toISOString().split('T')[0];


  let type = 'future';


  if (date < today) {
    type = 'past';
  }

  if (date === today) {
    type = 'current';
  }


  return {

    type,

    estimated,

    actual

  };

}



module.exports = {

  getSimulation,

  getActual,

  getTimeExplorer

};
