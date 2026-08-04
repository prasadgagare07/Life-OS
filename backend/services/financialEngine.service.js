const START_DATE = new Date("2026-08-05");

const DAILY_PHASE_ONE = 5000;
const PHASE_ONE_TARGET = 300000;

const ONE_TIME_EXPENSE = 100000;
const DEPLOYED_CAPITAL = 160000;
const BACKUP_SAVINGS = 40000;

const DAILY_PHASE_TWO = 8333;

function calculate(selectedDate) {

    const target = new Date(selectedDate);

    const totalDays = Math.max(
        0,
        Math.floor(
            (target - START_DATE) /
            (1000 * 60 * 60 * 24)
        )
    );

    let tradeGuardianCash = 0;

    let diversified = false;

    let freedomFund = 0;
    let savings = 0;
    let emergencyFund = 0;

    let deployedCapital = 0;

    let currentDailyIncome = DAILY_PHASE_ONE;

    let diversificationDate = null;

    for (let day = 0; day <= totalDays; day++) {

        if (!diversified) {

            tradeGuardianCash += DAILY_PHASE_ONE;

            if (tradeGuardianCash >= PHASE_ONE_TARGET) {

                diversified = true;

                diversificationDate = new Date(
                    START_DATE.getTime() +
                    day * 86400000
                );

                tradeGuardianCash = 0;

                deployedCapital = DEPLOYED_CAPITAL;

                savings += BACKUP_SAVINGS;

                currentDailyIncome = DAILY_PHASE_TWO;

                continue;
            }

        }

        else {

            freedomFund += currentDailyIncome * 0.70;

            savings += currentDailyIncome * 0.20;

            emergencyFund += currentDailyIncome * 0.10;

        }

    }

    return {

        simulationDate: selectedDate,

        diversified,

        diversificationDate,

        currentDailyIncome,

        tradeGuardianCash,

        deployedCapital,

        backupSavings: BACKUP_SAVINGS,

        freedomFund: Math.round(freedomFund),

        savings: Math.round(savings),

        emergencyFund: Math.round(emergencyFund)

    };

}

module.exports = {

    calculate

};
