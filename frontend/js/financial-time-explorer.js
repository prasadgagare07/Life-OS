// ==========================================
// LifeOS — Financial Time Explorer
// ==========================================
//
// START: 12 Aug 2026
//
// 12 Aug = ₹6,659 actual profit
// 13 Aug = ₹4,378 actual profit
//
// Before milestone:
//   Background estimate = ₹5,000/day
//   Actual Trade Guardian profit replaces estimate
//
// 10 Oct 2026:
//   ₹3,00,000 milestone
//
// 11 Oct 2026:
//   Phase 2 starts — Day 1
//   ₹40,000 Savings remains
//   ₹3L itself is considered deployed
//
// Surplus Vault:
//   All actual cumulative Trade Guardian profit
//
// Withdrawal:
//   Fixed date = 11 Oct 2026
//   Button becomes active only at ₹3,00,000
//
// Withdrawal Amount:
//   Completely independent
//   Stays ₹0
//
// ==========================================


const FTE_START =
    new Date("2026-08-12T00:00:00");


const FTE_MILESTONE =
    new Date("2026-10-10T00:00:00");


const FTE_PHASE2_START =
    new Date("2026-10-11T00:00:00");


const PHASE1_DAILY =
    5000;


const PHASE1_TARGET =
    300000;


const PHASE2_DAILY =
    8333;


const INITIAL_SAVINGS =
    40000;


const SURPLUS_WITHDRAWAL_TARGET =
    300000;


const SURPLUS_WITHDRAWAL_DATE =
    "11 Oct 2026";


const STORAGE_KEY =
    "lifeos_fte_surplus_withdrawn";


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


function sameDay(a, b) {

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


function formatINR(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(amount) || 0
    );
}


// ==========================================
// Projection
// ==========================================

function project(date) {

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
            phase: 0,
            dayNumber: 0,
            dailyEstimate: 0,
            estimatedProfit: 0
        };

    }


    // ======================================
    // PHASE 1
    // ======================================

    if (
        target <= FTE_MILESTONE
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

            phase: 1,

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
                FTE_PHASE2_START
            ) /
            86400000
        ) + 1;


    return {

        phase: 2,

        dayNumber:
            phase2Days,

        dailyEstimate:
            PHASE2_DAILY,

        estimatedProfit:
            phase2Days *
            PHASE2_DAILY

    };
}


// ==========================================
// Actual Trade Guardian
// ==========================================

async function fetchComparison(dateStr) {

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
                month: "long",
                year: "numeric"
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

async function renderDetail(dt) {

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
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
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
    // ACTUAL TRADE GUARDIAN DATA
    // ======================================

    if (
        cmp
    ) {

        const ahead =
            cmp.status === "ahead";


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
    // FUTURE PROJECTION
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


    const vault =
        document.getElementById(
            "fteSurplusVault"
        );


    const button =
        document.getElementById(
            "fteWithdrawButton"
        );


    if (!vault)
        return;


    const withdrawn =
        localStorage.getItem(
            STORAGE_KEY
        ) === "true";


    // ======================================
    // AFTER WITHDRAWAL
    // ======================================

    if (
        withdrawn
    ) {

        vault.textContent =
            "₹0";


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Withdrawn";

        }


        return;
    }


    // ======================================
    // SURPLUS VAULT = ACTUAL PROFIT
    // ======================================

    vault.textContent =
        formatINR(
            actualProfit
        );


    // ======================================
    // WITHDRAW BUTTON
    // ======================================

    if (button) {

        button.disabled =
            actualProfit <
            SURPLUS_WITHDRAWAL_TARGET;

    }

}


// ==========================================
// WITHDRAW SURPLUS VAULT
// ==========================================

function withdrawSurplus() {

    const today =
        todayMidnight();


    const cmp =
        comparisonCache[
            toISO(today)
        ];


    const actualProfit =
        cmp
            ? Number(
                cmp.actualTotal
            )
            : 0;


    if (
        actualProfit <
        SURPLUS_WITHDRAWAL_TARGET
    ) {

        return;
    }


    /*
      Important:

      Withdrawal Amount is NOT connected
      to this ₹3L withdrawal.

      We only mark the Surplus Vault
      as withdrawn.
    */

    localStorage.setItem(
        STORAGE_KEY,
        "true"
    );


    const vault =
        document.getElementById(
            "fteSurplusVault"
        );


    const button =
        document.getElementById(
            "fteWithdrawButton"
        );


    if (vault) {

        vault.textContent =
            "₹0";

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Withdrawn";

    }
}


// ==========================================
// PHASE 2 FUNDS
// ==========================================

function renderPhase2Funds() {

    const savings =
        document.getElementById(
            "fteSavings"
        );


    const freedom =
        document.getElementById(
            "fteFreedomFund"
        );


    const emergency =
        document.getElementById(
            "fteEmergencyFund"
        );


    if (
        !savings ||
        !freedom ||
        !emergency
    ) {

        return;
    }


    const today =
        todayMidnight();


    // Before 11 Oct
    if (
        today <
        FTE_PHASE2_START
    ) {

        savings.textContent =
            "₹40,000";

        freedom.textContent =
            "₹0";

        emergency.textContent =
            "₹0";

        return;
    }


    const days =
        Math.floor(
            (
                today -
                FTE_PHASE2_START
            ) /
            86400000
        ) + 1;


    /*
      Distribution percentages are
      intentionally kept hidden.

      Savings = 20%
      Freedom Fund = 70%
      Emergency Fund = 10%
    */

    const savingsGrowth =
        PHASE2_DAILY *
        0.20 *
        days;


    const freedomGrowth =
        PHASE2_DAILY *
        0.70 *
        days;


    const emergencyGrowth =
        PHASE2_DAILY *
        0.10 *
        days;


    savings.textContent =
        formatINR(
            INITIAL_SAVINGS +
            savingsGrowth
        );


    freedom.textContent =
        formatINR(
            freedomGrowth
        );


    emergency.textContent =
        formatINR(
            emergencyGrowth
        );
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
// Jump to Date
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
// INITIAL LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        renderGrid();

        await renderDetail(
            selected
        );

        await renderSurplusVault();

        renderPhase2Funds();

    }
);


// ==========================================
// WITHDRAW BUTTON
// ==========================================

document.getElementById(
    "fteWithdrawButton"
).addEventListener(
    "click",
    withdrawSurplus
);
