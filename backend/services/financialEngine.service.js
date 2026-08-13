// ==========================================
// LifeOS Financial Time Explorer Engine
// ==========================================
//
// PHASE 1
// 12 Aug 2026 → 9 Oct 2026
// ₹5,000/day
//
// MILESTONE
// 10 Oct 2026
// ₹3,00,000
//
// INITIAL DISTRIBUTION
// Personal Use     ₹1,00,000
// Investment 1     ₹80,000
// Investment 2     ₹50,000
// Investment 3     ₹30,000
// Savings          ₹40,000
//
// PHASE 2
// ₹8,333/day
//
// 70% Freedom Fund
// 20% Savings
// 10% Emergency Fund
// ==========================================


const START_DATE =
    new Date("2026-08-12T00:00:00");


const MILESTONE_DATE =
    new Date("2026-10-10T00:00:00");


const PHASE1_DAILY =
    5000;


const PHASE1_TARGET =
    300000;


const PHASE2_DAILY =
    8333;


// Initial ₹3L distribution

const PERSONAL_USE =
    100000;

const INVESTMENT_1 =
    80000;

const INVESTMENT_2 =
    50000;

const INVESTMENT_3 =
    30000;

const INITIAL_SAVINGS =
    40000;


// Phase 2 allocation

const FREEDOM_PERCENT =
    0.70;

const SAVINGS_PERCENT =
    0.20;

const EMERGENCY_PERCENT =
    0.10;


function midnight(date) {

    const d =
        new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;
}


function dateOnly(date) {

    const d =
        midnight(date);

    return d
        .toISOString()
        .split("T")[0];
}


function calculate(
    selectedDate
) {

    const date =
        midnight(selectedDate);


    const start =
        midnight(START_DATE);


    const milestone =
        midnight(MILESTONE_DATE);


    // ======================================
    // BEFORE START
    // ======================================

    if (
        date < start
    ) {

        return {

            phase: 0,

            startDate:
                "2026-08-12",

            milestoneDate:
                "2026-10-10",

            dayNumber: 0,

            dailyEstimate: 0,

            estimatedProfit: 0,

            milestoneReached: false,

            personalUse: 0,

            investment1: 0,

            investment2: 0,

            investment3: 0,

            savings: 0,

            freedomFund: 0,

            emergencyFund: 0

        };
    }


    // ======================================
    // PHASE 1
    // ======================================

    if (
        date < milestone
    ) {

        const days =
            Math.floor(
                (
                    date -
                    start
                ) /
                86400000
            );


        const dayNumber =
            days + 1;


        const estimatedProfit =
            dayNumber *
            PHASE1_DAILY;


        return {

            phase: 1,

            phaseName:
                "Growth Phase",

            startDate:
                "2026-08-12",

            milestoneDate:
                "2026-10-10",

            dayNumber,

            dailyEstimate:
                PHASE1_DAILY,

            estimatedProfit,

            milestoneReached:
                false,

            personalUse: 0,

            investment1: 0,

            investment2: 0,

            investment3: 0,

            savings: 0,

            freedomFund: 0,

            emergencyFund: 0,

            initialDistribution: null

        };
    }


    // ======================================
    // PHASE 2
    // ======================================

    const phase2Days =
        Math.floor(
            (
                date -
                milestone
            ) /
            86400000
        );


    const dayNumber =
        Math.floor(
            (
                date -
                start
            ) /
            86400000
        ) + 1;


    const phase2Profit =
        phase2Days *
        PHASE2_DAILY;


    const freedomFund =
        phase2Profit *
        FREEDOM_PERCENT;


    const savings =
        INITIAL_SAVINGS +
        phase2Profit *
        SAVINGS_PERCENT;


    const emergencyFund =
        phase2Profit *
        EMERGENCY_PERCENT;


    return {

        phase: 2,

        phaseName:
            "Diversified Growth",

        startDate:
            "2026-08-12",

        milestoneDate:
            "2026-10-10",

        dayNumber,

        dailyEstimate:
            PHASE2_DAILY,

        estimatedProfit:
            PHASE1_TARGET +
            phase2Profit,

        milestoneReached:
            true,

        milestoneAmount:
            PHASE1_TARGET,

        personalUse:
            PERSONAL_USE,

        investment1:
            INVESTMENT_1,

        investment2:
            INVESTMENT_2,

        investment3:
            INVESTMENT_3,

        savings,

        freedomFund,

        emergencyFund,

        phase2Profit,

        initialDistribution: {

            personalUse:
                PERSONAL_USE,

            investment1:
                INVESTMENT_1,

            investment2:
                INVESTMENT_2,

            investment3:
                INVESTMENT_3,

            savings:
                INITIAL_SAVINGS

        }

    };
}


module.exports = {

    calculate,

    START_DATE,

    MILESTONE_DATE,

    PHASE1_DAILY,

    PHASE1_TARGET,

    PHASE2_DAILY,

    PERSONAL_USE,

    INVESTMENT_1,

    INVESTMENT_2,

    INVESTMENT_3,

    INITIAL_SAVINGS,

    FREEDOM_PERCENT,

    SAVINGS_PERCENT,

    EMERGENCY_PERCENT

};
