// ===============================
// LifeOS — Financial Time Explorer
//
// Tracking starts: 12 Aug 2026
// Planned profit: ₹5,000/day
// Actual profit: Trade Guardian
// ===============================

const FTE_START = new Date(2026, 7, 12);
FTE_START.setHours(0, 0, 0, 0);

const P1_DAILY = 5000;
const TARGET = 300000;

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

function project(date) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  let days = Math.floor(
    (target - FTE_START) / 86400000
  );

  days = Math.max(days, 0);

  // 12 Aug = Day 1
  // 13 Aug = Day 2
  const dayNumber = days + 1;

  const plannedProfit = dayNumber * P1_DAILY;

  return {
    days,
    dayNumber,
    plannedProfit,
    total: plannedProfit,

    isMilestoneDay:
      plannedProfit === TARGET,

    milestoneReached:
      plannedProfit >= TARGET
  };
}

let viewYear = FTE_START.getFullYear();
let viewMonth = FTE_START.getMonth();

let selected = new Date(FTE_START);

const comparisonCache = {};

async function fetchComparison(dateStr) {

  if (dateStr in comparisonCache) {
    return comparisonCache[dateStr];
  }

  try {

    const res = await api.get(
      `/time-explorer?date=${dateStr}`
    );

    comparisonCache[dateStr] =
      res.comparison || null;

  } catch (error) {

    console.error(
      'Financial Time Explorer error:',
      error
    );

    comparisonCache[dateStr] = null;
  }

  return comparisonCache[dateStr];
}

function renderMonthLabel() {

  document.getElementById(
    'fteYmLabel'
  ).textContent =
    new Date(
      viewYear,
      viewMonth,
      1
    ).toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric'
      }
    );
}

async function renderGrid() {

  const grid =
    document.getElementById('fteGrid');

  grid.innerHTML = '';

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

  // Empty cells before first day
  for (
    let i = 0;
    i < firstDow;
    i++
  ) {

    const e =
      document.createElement('div');

    e.className =
      'fte-cell empty';

    grid.appendChild(e);
  }

  const cellRefs = [];

  for (
    let d = 1;
    d <= daysInMonth;
    d++
  ) {

    const dt =
      new Date(
        viewYear,
        viewMonth,
        d
      );

    const e =
      document.createElement('div');

    e.className =
      'fte-cell';

    e.textContent = d;

    // Before tracking started
    if (
      dt < FTE_START &&
      !sameDay(dt, FTE_START)
    ) {

      e.classList.add(
        'disabled'
      );

    } else {

      const p =
        project(dt);

      e.classList.add(
        p.isMilestoneDay
          ? 'milestone-day'
          : 'phase1'
      );

      if (
        sameDay(dt, today)
      ) {
        e.classList.add(
          'today'
        );
      }

      if (
        sameDay(dt, selected)
      ) {
        e.classList.add(
          'selected'
        );
      }

      e.addEventListener(
        'click',
        () => {

          selected = dt;

          renderGrid();

          renderDetail(dt);
        }
      );

      // Only dates that have actually arrived
      // can have Trade Guardian data.
      if (dt <= today) {

        cellRefs.push({
          dt,
          el: e
        });

      }
    }

    grid.appendChild(e);
  }

  renderMonthLabel();

  // Compare actual Trade Guardian result
  // against the ₹5,000/day plan.
  await Promise.all(
    cellRefs.map(
      async ({ dt, el }) => {

        const cmp =
          await fetchComparison(
            toISO(dt)
          );

        if (!cmp) return;

        if (
          cmp.status === 'ahead'
        ) {

          el.classList.add(
            'actual-good'
          );

        } else {

          el.classList.add(
            'actual-bad'
          );
        }
      }
    )
  );
}

async function renderDetail(dt) {

  const p =
    project(dt);

  const today =
    todayMidnight();

  document.getElementById(
    'fteDHead'
  ).textContent =
    dt.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  const tag =
    document.getElementById(
      'fteDTag'
    );

  const rows =
    document.getElementById(
      'fteRows'
    );

  const totalEl =
    document.getElementById(
      'fteTotal'
    );

  // Before 12 Aug
  if (dt < FTE_START) {

    tag.textContent =
      '⏳ Before tracking started';

    tag.className =
      'fte-dtag phase1';

    totalEl.textContent =
      formatINR(0);

    rows.innerHTML = `
      <div class="fte-delta info">
        Financial Time Explorer starts on 12 Aug 2026.
      </div>
    `;

    return;
  }

  let cmp = null;

  // Actual dates can use Trade Guardian
  if (
    dt <= today &&
    dt >= FTE_START
  ) {

    cmp =
      await fetchComparison(
        toISO(dt)
      );
  }

  // =====================================
  // ACTUAL TRADE GUARDIAN DATA
  // =====================================

  if (cmp) {

    const ahead =
      cmp.status === 'ahead';

    tag.textContent =
      ahead
        ? '✅ Ahead of plan'
        : '⚠️ Behind plan';

    tag.className =
      'fte-dtag ' +
      (
        ahead
          ? 'actual-good'
          : 'actual-bad'
      );

    totalEl.textContent =
      formatINR(
        cmp.actualTotal
      );

    const delta =
      Math.abs(cmp.delta);

    rows.innerHTML = `

      <div class="fte-row">
        <div class="n">
          Today's profit
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

      <div class="fte-delta ${
        ahead
          ? 'good'
          : 'bad'
      }">

        ${
          ahead
            ? '📈 Ahead by'
            : '📉 Behind by'
        }

        ${formatINR(delta)}

      </div>

    `;

    return;
  }

  // =====================================
  // REAL DATE BUT NO TRADE GUARDIAN ENTRY
  // =====================================

  if (dt <= today) {

    tag.textContent =
      '⏳ Waiting for Trade Guardian';

    tag.className =
      'fte-dtag phase1';

    totalEl.textContent =
      formatINR(
        p.plannedProfit
      );

    rows.innerHTML = `

      <div class="fte-row">

        <div class="n">
          Estimated cumulative profit
        </div>

        <div class="v">
          ${formatINR(
            p.plannedProfit
          )}
        </div>

      </div>

      <div class="fte-delta info">

        No Trade Guardian result
        has been logged for this date yet.

      </div>

    `;

    return;
  }

  // =====================================
  // FUTURE PROJECTION
  // =====================================

  tag.textContent =
    p.isMilestoneDay
      ? '🏁 ₹3L milestone'
      : '📈 Projected';

  tag.className =
    'fte-dtag ' +
    (
      p.isMilestoneDay
        ? 'milestone-day'
        : 'phase1'
    );

  totalEl.textContent =
    formatINR(
      p.plannedProfit
    );

  rows.innerHTML = `

    <div class="fte-row">

      <div class="n">
        Estimated cumulative profit
      </div>

      <div class="v">
        ${formatINR(
          p.plannedProfit
        )}
      </div>

    </div>

    <div class="fte-delta info">

      Day ${p.dayNumber}
      • ₹5,000/day projection

    </div>

  `;
}

async function renderMilestone() {

  const today =
    todayMidnight();

  const p =
    project(today);

  const el =
    document.getElementById(
      'fteMilestone'
    );

  const cmp =
    await fetchComparison(
      toISO(today)
    );

  if (cmp) {

    const ahead =
      cmp.status === 'ahead';

    el.innerHTML = `

      🔥

      <b>
        ${formatINR(
          cmp.actualTotal
        )}
      </b>

      actual of

      <b>
        ${formatINR(
          cmp.estimatedTotal
        )}
      </b>

      planned ·

      ${
        ahead
          ? `${formatINR(
              Math.abs(cmp.delta)
            )} ahead of pace`
          : `${formatINR(
              Math.abs(cmp.delta)
            )} behind pace`
      }

    `;

    return;
  }

  el.innerHTML = `

    🔥 Day

    <b>
      ${p.dayNumber}
    </b>

    ·

    <b>
      ${formatINR(
        p.plannedProfit
      )}
    </b>

    estimated at ₹5,000/day

  `;
}

// =====================================
// MONTH / YEAR NAVIGATION
// =====================================

document.getElementById(
  'ftePrevM'
).onclick = () => {

  viewMonth--;

  if (viewMonth < 0) {

    viewMonth = 11;
    viewYear--;

  }

  renderGrid();
};

document.getElementById(
  'fteNextM'
).onclick = () => {

  viewMonth++;

  if (viewMonth > 11) {

    viewMonth = 0;
    viewYear++;

  }

  renderGrid();
};

document.getElementById(
  'ftePrevY'
).onclick = () => {

  viewYear--;

  renderGrid();
};

document.getElementById(
  'fteNextY'
).onclick = () => {

  viewYear++;

  renderGrid();
};

// =====================================
// JUMP TO DATE
// =====================================

const jumpInput =
  document.getElementById(
    'fteJumpInput'
  );

document.getElementById(
  'fteJumpToggle'
).onclick = () => {

  jumpInput.classList.toggle(
    'show'
  );
};

document.getElementById(
  'fteJumpGo'
).onclick = () => {

  const v =
    document.getElementById(
      'fteJumpDate'
    ).value;

  if (!v) return;

  const dt =
    new Date(
      v + 'T00:00:00'
    );

  if (dt < FTE_START) return;

  viewYear =
    dt.getFullYear();

  viewMonth =
    dt.getMonth();

  selected =
    dt;

  renderGrid();

  renderDetail(dt);

  jumpInput.classList.remove(
    'show'
  );
};

// =====================================
// INITIAL LOAD
// =====================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    renderGrid();

    renderDetail(
      selected
    );

    renderMilestone();

  }
);
