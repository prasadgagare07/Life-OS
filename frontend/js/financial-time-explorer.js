// ==========================================
// LifeOS — Financial Time Explorer
// ==========================================
//
// START: 12 Aug 2026
// PHASE 1: ₹5,000/day
// MILESTONE: ₹3,00,000 on 10 Oct
// PHASE 2: ₹8,333/day
//
// Actual profit = Trade Guardian
//
// Surplus Vault:
// Actual cumulative profit
// minus amount moved to Withdrawal
//
// Withdrawal:
// No date until money is moved
// First withdrawal = 7 days after money enters
// Next withdrawals = every 7 days
// ==========================================


const FTE_START =
    new Date(
        "2026-08-12T00:00:00"
    );


const FTE_MILESTONE =
    new Date(
        "2026-10-10T00:00:00"
    );


const PHASE1_DAILY =
    5000;


const PHASE1_TARGET =
    300000;


const PHASE2_DAILY =
    8333;


const STORAGE_KEY =
    "lifeos_fte_withdrawal";


let viewYear =
    FTE_START.getFullYear();


let viewMonth =
    FTE_START.getMonth();


let selected =
    new Date(FTE_START);


const comparisonCache = {};


// ==========================================
// Helpers
// ==========================================

function todayMidnight() {

    const d =
        new Date();

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;
}


function sameDay(
    a,
    b
) {

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}


function toISO(d) {

    const y =
        d.getFullYear();

    const m =
        String(
            d.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            d.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${y}-${m}-${day}`;
}


function formatINR(
    amount
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                0

        }
    ).format(
        Number(amount) || 0
    );
}


function formatDate(
    dateString
) {

    if (!dateString)
        return "—";


    return new Date(
        `${dateString}T00:00:00`
    ).toLocaleDateString(
        "en-IN",
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


// ==========================================
// Projection
// ==========================================

function project(
    date
) {

    const target =
        new Date(date);

    target.setHours(
        0,
        0,
        0,
        0
    );


    if (
        target < FTE_START
    ) {

        return {

            phase:
                0,

            dayNumber:
                0,

            dailyEstimate:
                0,

            estimatedProfit:
                0

        };
    }


    // ======================================
    // PHASE 1
    // ======================================

    if (
        target < FTE_MILESTONE
    ) {

        const days =
            Math.floor(
                (
                    target -
                    FTE_START
                ) /
                86400000
            );


        const dayNumber =
            days + 1;


        return {

            phase:
                1,

            dayNumber,

            dailyEstimate:
                PHASE1_DAILY,

            estimatedProfit:
                dayNumber *
                PHASE1_DAILY

        };
    }


    // ======================================
    // PHASE 2
    // ======================================

    const phase2Days =
        Math.floor(
            (
                target -
                FTE_MILESTONE
            ) /
            86400000
        );


    return {

        phase:
            2,

        dayNumber:
            Math.floor(
                (
                    target -
                    FTE_START
                ) /
                86400000
            ) + 1,

        dailyEstimate:
            PHASE2_DAILY,

        estimatedProfit:
            PHASE1_TARGET +
            (
                phase2Days *
                PHASE2_DAILY
            )

    };
}


// ==========================================
// Withdrawal local state
// ==========================================

function getWithdrawalState() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            )
        ) || {

            balance:
                0,

            firstDate:
                null,

            amount:
                0

        };

    } catch {

        return {

            balance:
                0,

            firstDate:
                null,

            amount:
                0

        };
    }
}


function saveWithdrawalState(
    state
) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            state
        )
    );
}


// ==========================================
// Actual Trade Guardian
// ==========================================

async function fetchComparison(
    dateStr
) {

    if (
        dateStr in comparisonCache
    ) {

        return comparisonCache[
            dateStr
        ];
    }


    try {

        const res =
            await api.get(
                `/time-explorer?date=${dateStr}`
            );


        comparisonCache[
            dateStr
        ] =
            res.comparison ||
            null;


    } catch (error) {

        console.error(
            "Financial Time Explorer:",
            error
        );


        comparisonCache[
            dateStr
        ] =
            null;
    }


    return comparisonCache[
        dateStr
    ];
}


// ==========================================
// Calendar
// ==========================================

function renderMonthLabel() {

    document.getElementById(
        "fteYmLabel"
    ).textContent =

        new Date(
            viewYear,
            viewMonth,
            1
        ).toLocaleDateString(
            "en-US",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );
}


async function renderGrid() {

    const grid =
        document.getElementById(
            "fteGrid"
        );


    grid.innerHTML = "";


    const today =
        todayMidnight();


    const first =
        new Date(
            viewYear,
            viewMonth,
            1
        );


    const firstDow =
        first.getDay();


    const daysInMonth =
        new Date(
            viewYear,
            viewMonth + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < firstDow;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "fte-cell empty";

        grid.appendChild(
            empty
        );
    }


    const actualDates = [];


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dt =
            new Date(
                viewYear,
                viewMonth,
                day
            );


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "fte-cell";


        cell.textContent =
            day;


        if (
            dt < FTE_START
        ) {

            cell.classList.add(
                "disabled"
            );

        } else {

            const p =
                project(dt);


            if (
                p.phase === 2
            ) {

                cell.classList.add(
                    "phase2"
                );

            } else {

                cell.classList.add(
                    "phase1"
                );

            }


            if (
                sameDay(
                    dt,
                    FTE_MILESTONE
                )
            ) {

                cell.classList.add(
                    "milestone-day"
                );

            }


            if (
                sameDay(
                    dt,
                    today
                )
            ) {

                cell.classList.add(
                    "today"
                );

            }


            if (
                sameDay(
                    dt,
                    selected
                )
            ) {

                cell.classList.add(
                    "selected"
                );

            }


            cell.addEventListener(
                "click",
                () => {

                    selected =
                        dt;

                    renderGrid();

                    renderDetail(
                        dt
                    );

                }
            );


            if (
                dt <= today
            ) {

                actualDates.push({
                    dt,
                    cell
                });

            }

        }


        grid.appendChild(
            cell
        );
    }


    renderMonthLabel();


    await Promise.all(

        actualDates.map(
            async ({
                dt,
                cell
            }) => {

                const cmp =
                    await fetchComparison(
                        toISO(dt)
                    );


                if (!cmp)
                    return;


                cell.classList.add(
                    cmp.status === "ahead"
                        ? "actual-good"
                        : "actual-bad"
                );

            }
        )

    );
}


// ==========================================
// Detail
// ==========================================

async function renderDetail(
    dt
) {

    const p =
        project(dt);


    const today =
        todayMidnight();


    document.getElementById(
        "fteDHead"
    ).textContent =

        dt.toLocaleDateString(
            "en-US",
            {
                weekday:
                    "short",

                day:
                    "numeric",

                month:
                    "short",

                year:
                    "numeric"
            }
        );


    const tag =
        document.getElementById(
            "fteDTag"
        );


    const rows =
        document.getElementById(
            "fteRows"
        );


    const total =
        document.getElementById(
            "fteTotal"
        );


    let cmp =
        null;


    if (
        dt <= today
    ) {

        cmp =
            await fetchComparison(
                toISO(dt)
            );
    }


    // ======================================
    // ACTUAL
    // ======================================

    if (
        cmp
    ) {

        const ahead =
            cmp.status ===
            "ahead";


        tag.textContent =
            ahead
                ? "✅ Ahead of plan"
                : "⚠️ Behind plan";


        tag.className =
            "fte-dtag " +
            (
                ahead
                    ? "actual-good"
                    : "actual-bad"
            );


        total.textContent =
            formatINR(
                cmp.actualTotal
            );


        rows.innerHTML = `

            <div class="fte-row">

                <div class="n">
                    Today's actual profit
                </div>

                <div class="v">
                    ${formatINR(
                        cmp.dailyProfit
                    )}
                </div>

            </div>


            <div class="fte-row">

                <div class="n">
                    Actual cumulative profit
                </div>

                <div class="v">
                    ${formatINR(
                        cmp.actualTotal
                    )}
                </div>

            </div>


            <div class="fte-row">

                <div class="n">
                    Estimated cumulative profit
                </div>

                <div class="v sub">
                    ${formatINR(
                        cmp.estimatedTotal
                    )}
                </div>

            </div>

        `;

        return;
    }


    // ======================================
    // PROJECTION
    // ======================================

    tag.textContent =
        p.phase === 2
            ? "📈 Diversified Growth"
            : "📈 Projected";


    tag.className =
        "fte-dtag " +
        (
            p.phase === 2
                ? "phase2"
                : "phase1"
        );


    total.textContent =
        formatINR(
            p.estimatedProfit
        );


    rows.innerHTML = `

        <div class="fte-row">

            <div class="n">
                Estimated cumulative profit
            </div>

            <div class="v">
                ${formatINR(
                    p.estimatedProfit
                )}
            </div>

        </div>


        <div class="fte-row">

            <div class="n">
                Daily estimated growth
            </div>

            <div class="v">
                ${formatINR(
                    p.dailyEstimate
                )}
            </div>

        </div>


        <div class="fte-delta info">

            ${
                p.phase === 2
                    ? "70% Freedom • 20% Savings • 10% Emergency"
                    : "₹5,000/day Growth Phase"
            }

        </div>

    `;
}


// ==========================================
// SURPLUS VAULT
// ==========================================

async function renderSurplusVault() {

    const today =
        todayMidnight();


    const cmp =
        await fetchComparison(
            toISO(today)
        );


    const actualProfit =
        cmp
            ? Number(
                cmp.actualTotal
            )
            : 0;


    const state =
        getWithdrawalState();


    const surplus =
        Math.max(
            0,
            actualProfit -
            state.balance
        );


    const vault =
        document.getElementById(
            "fteSurplusVault"
        );


    const actual =
        document.getElementById(
            "fteActualProfit"
        );


    const withdrawal =
        document.getElementById(
            "fteWithdrawalBalance"
        );


    if (vault) {

        vault.textContent =
            formatINR(
                surplus
            );
    }


    if (actual) {

        actual.textContent =
            formatINR(
                actualProfit
            );
    }


    if (withdrawal) {

        withdrawal.textContent =
            formatINR(
                state.balance
            );
    }


    renderWithdrawalSchedule(
        state
    );
}


// ==========================================
// Move amount to Withdrawal
// ==========================================

function moveToWithdrawal() {

    const input =
        document.getElementById(
            "fteWithdrawalAmount"
        );


    const amount =
        Number(
            input.value
        );


    if (
        !amount ||
        amount <= 0
    ) {

        alert(
            "Enter a valid withdrawal amount."
        );

        return;
    }


    const today =
        todayMidnight();


    const state =
        getWithdrawalState();


    state.balance +=
        amount;


    state.amount =
        amount;


    // First withdrawal = 7 days
    // after the money enters Withdrawal.

    const firstDate =
        new Date(
            today.getTime() +
            (
                7 *
                86400000
            )
        );


    state.firstDate =
        toISO(
            firstDate
        );


    saveWithdrawalState(
        state
    );


    input.value =
        "";


    renderSurplusVault();
}


// ==========================================
// Withdrawal schedule
// ==========================================

function renderWithdrawalSchedule(
    state
) {

    const box =
        document.getElementById(
            "fteWithdrawalSchedule"
        );


    if (!box)
        return;


    // NOTHING IN WITHDRAWAL
    if (
        !state.balance ||
        !state.firstDate
    ) {

        box.classList.add(
            "hidden"
        );

        return;
    }


    box.classList.remove(
        "hidden"
    );


    document.getElementById(
        "fteFirstWithdrawalDate"
    ).textContent =
        formatDate(
            state.firstDate
        );


    document.getElementById(
        "fteScheduledAmount"
    ).textContent =
        formatINR(
            state.amount
        );


    const nextDate =
        getNextWithdrawalDate(
            state.firstDate
        );


    document.getElementById(
        "fteNextWithdrawalDate"
    ).textContent =
        formatDate(
            nextDate
        );
}


function getNextWithdrawalDate(
    firstDate
) {

    const first =
        new Date(
            `${firstDate}T00:00:00`
        );


    const today =
        todayMidnight();


    if (
        today <= first
    ) {

        return firstDate;
    }


    const days =
        Math.floor(
            (
                today -
                first
            ) /
            86400000
        );


    const cycles =
        Math.floor(
            days / 7
        ) + 1;


    const next =
        new Date(
            first.getTime() +
            cycles *
            7 *
            86400000
        );


    return toISO(
        next
    );
}


// ==========================================
// ₹3L + Phase 2 display
// ==========================================

async function renderPhase2() {

    const status =
        document.getElementById(
            "ftePhaseStatus"
        );


    const date =
        document.getElementById(
            "ftePhaseDate"
        );


    const distribution =
        document.getElementById(
            "fteDistribution"
        );


    if (!status)
        return;


    const today =
        todayMidnight();


    const cmp =
        await fetchComparison(
            toISO(today)
        );


    const actual =
        cmp
            ? Number(
                cmp.actualTotal
            )
            : 0;


    if (
        actual >=
        PHASE1_TARGET
    ) {

        status.textContent =
            "🚀 Phase 2 Active";


        status.className =
            "fte-phase-status phase2";


        date.innerHTML = `
            ₹3,00,000 milestone
            achieved on or before
            <b>10 Oct 2026</b>
        `;


    } else {

        status.textContent =
            "🎯 Phase 1";


        status.className =
            "fte-phase-status phase1";


        date.innerHTML = `
            ₹3,00,000 milestone:
            <b>10 Oct 2026</b>
        `;

    }


    distribution.innerHTML = `

        <div class="fte-distribution-title">
            ₹3L Distribution
        </div>


        <div class="fte-distribution-row">

            <span>
                Personal Use
            </span>

            <b>
                ₹1,00,000
            </b>

        </div>


        <div class="fte-distribution-row">

            <span>
                Investment 1
            </span>

            <b>
                ₹80,000
            </b>

        </div>


        <div class="fte-distribution-row">

            <span>
                Investment 2
            </span>

            <b>
                ₹50,000
            </b>

        </div>


        <div class="fte-distribution-row">

            <span>
                Investment 3
            </span>

            <b>
                ₹30,000
            </b>

        </div>


        <div class="fte-distribution-row">

            <span>
                Initial Savings
            </span>

            <b>
                ₹40,000
            </b>

        </div>


        <div class="fte-distribution-divider"></div>


        <div class="fte-distribution-title">
            After 10 Oct — ₹8,333/day
        </div>


        <div class="fte-distribution-row">
            <span>Freedom Fund — 70%</span>
            <b>₹5,833/day</b>
        </div>


        <div class="fte-distribution-row">
            <span>Savings — 20%</span>
            <b>₹1,667/day</b>
        </div>


        <div class="fte-distribution-row">
            <span>Emergency — 10%</span>
            <b>₹833/day</b>
        </div>

    `;
}


// ==========================================
// Navigation
// ==========================================

document.getElementById(
    "ftePrevM"
).onclick = () => {

    viewMonth--;

    if (
        viewMonth < 0
    ) {

        viewMonth = 11;

        viewYear--;

    }

    renderGrid();
};


document.getElementById(
    "fteNextM"
).onclick = () => {

    viewMonth++;

    if (
        viewMonth > 11
    ) {

        viewMonth = 0;

        viewYear++;

    }

    renderGrid();
};


document.getElementById(
    "ftePrevY"
).onclick = () => {

    viewYear--;

    renderGrid();
};


document.getElementById(
    "fteNextY"
).onclick = () => {

    viewYear++;

    renderGrid();
};


// ==========================================
// Jump
// ==========================================

const jumpInput =
    document.getElementById(
        "fteJumpInput"
    );


document.getElementById(
    "fteJumpToggle"
).onclick = () => {

    jumpInput.classList.toggle(
        "show"
    );
};


document.getElementById(
    "fteJumpGo"
).onclick = () => {

    const value =
        document.getElementById(
            "fteJumpDate"
        ).value;


    if (!value)
        return;


    const dt =
        new Date(
            `${value}T00:00:00`
        );


    if (
        dt < FTE_START
    )
        return;


    viewYear =
        dt.getFullYear();


    viewMonth =
        dt.getMonth();


    selected =
        dt;


    renderGrid();

    renderDetail(
        dt
    );


    jumpInput.classList.remove(
        "show"
    );
};


// ==========================================
// Withdrawal button
// ==========================================

document.getElementById(
    "fteMoveToWithdrawal"
).onclick =
    moveToWithdrawal;


// ==========================================
// Initial load
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        renderGrid();

        await renderDetail(
            selected
        );

        await renderSurplusVault();

        await renderPhase2();

    }
);
