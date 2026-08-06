const START_DATE = new Date("2026-08-04");
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const PHASE1_DAILY = 5000;
const PHASE1_TARGET = 300000;

const DEPLOYED = 160000;
const BACKUP = 40000;

const PHASE2_DAILY = 250000 / 30;

function calculate(selectedDate) {

    const start = new Date(START_DATE);
    start.setHours(0,0,0,0);

    const target = new Date(selectedDate);
    target.setHours(0,0,0,0);

    let days = Math.floor((target - start) / 86400000);

    if (days < 0) days = 0;

    let diversified = false;

    let tradeGuardianCash = 0;

    let freedomFund = 0;
    let savings = 0;
    let emergencyFund = 0;

    let deployedCapital = 0;
    let currentDailyIncome = PHASE1_DAILY;

    let diversificationDate = null;

    for (let i = 0; i <= days; i++) {

        if (!diversified) {

            tradeGuardianCash += PHASE1_DAILY;

            if (tradeGuardianCash >= PHASE1_TARGET) {

                diversified = true;

                diversificationDate = new Date(
                    start.getTime() + i * 86400000
                ).toISOString().split("T")[0];

                tradeGuardianCash = 0;

                deployedCapital = DEPLOYED;

                savings += BACKUP;

                currentDailyIncome = PHASE2_DAILY;

                continue;
            }

        } else {

            freedomFund += currentDailyIncome * 0.70;
            savings += currentDailyIncome * 0.20;
            emergencyFund += currentDailyIncome * 0.10;

        }
    }

    const selectedDateObj = new Date(selectedDate);
selectedDateObj.setHours(0, 0, 0, 0);

const actualAvailable = selectedDateObj <= TODAY;

let actualWealth = null;

    return {
    simulationDate: selectedDate,
    diversified,
    diversificationDate,
    currentDailyIncome: Math.round(currentDailyIncome),
    tradeGuardianCash: Math.round(tradeGuardianCash),
    deployedCapital,
    backupSavings: BACKUP,
    freedomFund: Math.round(freedomFund),
    savings: Math.round(savings),
    emergencyFund: Math.round(emergencyFund),

    actualAvailable,
    actualWealth
};

}

module.exports = { calculate };
