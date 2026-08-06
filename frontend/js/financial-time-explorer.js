// ===============================
// LifeOS — Financial Time Explorer
// Tap any date — days, months, or years away — to see projected Trade
// Guardian capital. Past/current growth-phase dates are checked against
// real logged trades (see backend/models/trading.model.js); everything
// else is pure projection, using the same formula as
// backend/services/financialEngine.service.js so results never drift.
// ===============================

const FTE_START = new Date(2026, 7, 4); FTE_START.setHours(0, 0, 0, 0); // 4 Aug 2026 — keep in sync with backend START_DATE
const P1_DAILY = 5000, TARGET = 300000, P2_DAILY = 8333, BACKUP_SEED = 40000;

function todayMidnight() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Mirrors backend/services/financialEngine.service.js exactly, so tapping a
// date years out doesn't need a round trip to the server.
function project(date) {
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  let days = Math.floor((target - FTE_START) / 86400000);
  days = Math.max(days, 0);

  let cash = 0, freedom = 0, savings = 0, emergency = 0;
  let diversified = false, diversifiedDay = null;

  for (let i = 0; i <= days; i++) {
    if (!diversified) {
      cash += P1_DAILY;
      if (cash >= TARGET) {
        diversified = true;
        diversifiedDay = i;
        cash = 0;
        savings += BACKUP_SEED;
        continue;
      }
    } else {
      freedom += P2_DAILY * 0.70;
      savings += P2_DAILY * 0.20;
      emergency += P2_DAILY * 0.10;
    }
  }

  const total = diversified ? (freedom + savings + emergency) : cash;
  return {
    days, diversified, diversifiedDay,
    cash: Math.round(cash), freedom: Math.round(freedom),
    savings: Math.round(savings), emergency: Math.round(emergency),
    total: Math.round(total),
    isMilestoneDay: diversified && diversifiedDay === days
  };
}

let viewYear = FTE_START.getFullYear(), viewMonth = FTE_START.getMonth();
let selected = new Date(FTE_START);

const comparisonCache = {}; // dateStr -> comparison object or null

async function fetchComparison(dateStr) {
  if (dateStr in comparisonCache) return comparisonCache[dateStr];
  try {
    const res = await api.get(`/time-explorer?date=${dateStr}`);
    comparisonCache[dateStr] = res.comparison || null;
  } catch {
    comparisonCache[dateStr] = null;
  }
  return comparisonCache[dateStr];
}

function renderMonthLabel() {
  document.getElementById('fteYmLabel').textContent =
    new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

async function renderGrid() {
  const grid = document.getElementById('fteGrid');
  grid.innerHTML = '';
  const today = todayMidnight();
  const first = new Date(viewYear, viewMonth, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDow; i++) {
    const e = document.createElement('div'); e.className = 'fte-cell empty'; grid.appendChild(e);
  }

  const cellRefs = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    const e = document.createElement('div');
    e.className = 'fte-cell';
    e.textContent = d;

    if (dt < FTE_START && !sameDay(dt, FTE_START)) {
      e.classList.add('disabled');
    } else {
      const p = project(dt);
      e.classList.add(p.isMilestoneDay ? 'milestone-day' : (p.diversified ? 'phase2' : 'phase1'));
      if (sameDay(dt, today)) e.classList.add('today');
      if (sameDay(dt, selected)) e.classList.add('selected');
      e.addEventListener('click', () => { selected = dt; renderGrid(); renderDetail(dt); });
      if (dt <= today && !p.diversified) cellRefs.push({ dt, el: e });
    }
    grid.appendChild(e);
  }
  renderMonthLabel();

  // Overlay real actual-vs-plan color for growth-phase days up to today.
  cellRefs.forEach(async ({ dt, el }) => {
    const cmp = await fetchComparison(toISO(dt));
    if (cmp) el.classList.add(cmp.status === 'ahead' ? 'actual-good' : 'actual-bad');
  });
}

async function renderDetail(dt) {
  const p = project(dt);
  const today = todayMidnight();

  document.getElementById('fteDHead').textContent =
    dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const tag = document.getElementById('fteDTag');
  const rows = document.getElementById('fteRows');
  const totalEl = document.getElementById('fteTotal');

  let cmp = null;
  if (dt <= today && !p.diversified) cmp = await fetchComparison(toISO(dt));

  // Case 1: growth-phase date with real logged trades to compare against
  if (cmp) {
    const ahead = cmp.status === 'ahead';
    tag.textContent = ahead ? '✅ Ahead of plan' : '⚠️ Behind plan';
    tag.className = 'fte-dtag ' + (ahead ? 'actual-good' : 'actual-bad');
    totalEl.textContent = formatINR(cmp.actualTotal);
    const delta = Math.abs(cmp.delta);
    rows.innerHTML = `
      <div class="fte-row"><div class="n">Actual balance</div><div class="v">${formatINR(cmp.actualTotal)}</div></div>
      <div class="fte-row"><div class="n">Estimated balance</div><div class="v sub">${formatINR(cmp.estimatedTotal)}</div></div>
      <div class="fte-delta ${ahead ? 'good' : 'bad'}">
        ${ahead ? '📈 Ahead by' : '📉 Behind by'} ${formatINR(delta)}
      </div>`;
    return;
  }

  // Case 2: growth-phase date, still in the future — pure projection, no actual data yet
  if (!p.diversified) {
    tag.textContent = p.isMilestoneDay ? '🏁 ₹3L milestone' : '📈 Growth phase (projected)';
    tag.className = 'fte-dtag ' + (p.isMilestoneDay ? 'milestone-day' : 'phase1');
    totalEl.textContent = formatINR(p.cash);
    rows.innerHTML = `
      <div class="fte-row"><div class="n">Estimated balance</div><div class="v" style="color:var(--good)">${formatINR(p.cash)}</div></div>
      <div class="fte-delta info">Day ${p.days + 1} of the growth phase • ₹5,000/day, not logged yet</div>`;
    return;
  }

  // Case 3: diversified — capital deployed, income now splits three ways
  tag.textContent = p.isMilestoneDay ? '🏁 ₹3L reached today' : '💎 Diversified';
  tag.className = 'fte-dtag ' + (p.isMilestoneDay ? 'milestone-day' : 'phase2');
  totalEl.textContent = formatINR(p.total);
  rows.innerHTML = `
    <div class="fte-row"><div class="n"><span class="fte-dot freedom"></span>Freedom Fund (70%)</div><div class="v" style="color:var(--accent-2)">${formatINR(p.freedom)}</div></div>
    <div class="fte-row"><div class="n"><span class="fte-dot savings"></span>Savings (20%)</div><div class="v" style="color:#3ECFC0">${formatINR(p.savings)}</div></div>
    <div class="fte-row"><div class="n"><span class="fte-dot emergency"></span>Emergency Fund (10%)</div><div class="v" style="color:#B388FF">${formatINR(p.emergency)}</div></div>
    <div class="fte-delta info">Earning ₹${P2_DAILY.toLocaleString('en-IN')}/day since diversification</div>`;
}

async function renderMilestone() {
  const today = todayMidnight();
  const p = project(today);
  const el = document.getElementById('fteMilestone');

  if (p.diversified) {
    el.innerHTML = `🏁 Diversified — earning <b>${formatINR(P2_DAILY)}</b>/day`;
    return;
  }

  const cmp = await fetchComparison(toISO(today));
  const daysLeft = Math.max(0, Math.ceil((TARGET - p.cash) / P1_DAILY));

  if (cmp) {
    const ahead = cmp.status === 'ahead';
    el.innerHTML = `🔥 <b>${formatINR(cmp.actualTotal)}</b> of ${formatINR(TARGET)} · ${ahead ? 'ahead of pace' : `${formatINR(Math.abs(cmp.delta))} behind pace`}`;
  } else {
    el.innerHTML = `🔥 Day <b>${p.days + 1}</b> · <b>${daysLeft}</b> days to ₹3,00,000 at ₹5,000/day`;
  }
}

document.getElementById('ftePrevM').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderGrid(); };
document.getElementById('fteNextM').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderGrid(); };
document.getElementById('ftePrevY').onclick = () => { viewYear--; renderGrid(); };
document.getElementById('fteNextY').onclick = () => { viewYear++; renderGrid(); };

const jumpInput = document.getElementById('fteJumpInput');
document.getElementById('fteJumpToggle').onclick = () => jumpInput.classList.toggle('show');
document.getElementById('fteJumpGo').onclick = () => {
  const v = document.getElementById('fteJumpDate').value;
  if (!v) return;
  const dt = new Date(v + 'T00:00:00');
  viewYear = dt.getFullYear(); viewMonth = dt.getMonth(); selected = dt;
  renderGrid(); renderDetail(dt); jumpInput.classList.remove('show');
};

document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  renderDetail(selected);
  renderMilestone();
});
