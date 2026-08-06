// Time Explorer — tap any date (past, today, or years ahead) to see the
// financial plan for that day. Future dates are pure projection, computed
// instantly in the browser. Past/current dates are compared against real
// numbers pulled from /api/time-explorer, which are kept in sync
// automatically whenever a Trade Guardian entry is logged
// (see backend/models/trading.model.js) — nothing here is manually typed.

const START = new Date(2026, 7, 5); START.setHours(0, 0, 0, 0); // 5 Aug 2026
const P1_DAILY = 5000, TARGET = 300000, P2_DAILY = 8333, BACKUP_SEED = 40000;

function todayMidnight() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toISO(d) { return d.toISOString().slice(0, 10); }
function money(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

// Same formula as backend/models/timeExplorer.model.js — kept identical so
// tapping a date 2 years out doesn't need a round trip to the server.
function project(date) {
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  let days = Math.floor((target - START) / 86400000);
  days = Math.max(days, 0);
  let cash = 0, freedom = 0, savings = 0, emergency = 0, diversified = false, diversifiedDay = null;
  for (let i = 0; i <= days; i++) {
    if (!diversified) {
      cash += P1_DAILY;
      if (cash >= TARGET) { diversified = true; diversifiedDay = i; cash = 0; savings += BACKUP_SEED; continue; }
    } else {
      freedom += P2_DAILY * 0.70; savings += P2_DAILY * 0.20; emergency += P2_DAILY * 0.10;
    }
  }
  const total = diversified ? (freedom + savings + emergency) : cash;
  return {
    days, diversified, diversifiedDay,
    cash: Math.round(cash), freedom: Math.round(freedom), savings: Math.round(savings), emergency: Math.round(emergency),
    total: Math.round(total), isMilestoneDay: diversified && diversifiedDay === days
  };
}

let viewYear = START.getFullYear(), viewMonth = START.getMonth();
let selected = new Date(START);
const actualCache = {}; // dateStr -> comparison result (or null once we know there's none)

async function fetchComparison(dateStr) {
  if (dateStr in actualCache) return actualCache[dateStr];
  try {
    const res = await api.get(`/time-explorer?date=${dateStr}`);
    actualCache[dateStr] = res.comparison || null;
  } catch {
    actualCache[dateStr] = null;
  }
  return actualCache[dateStr];
}

function renderMonthLabel() {
  document.getElementById('teYmLabel').textContent =
    new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

async function renderGrid() {
  const grid = document.getElementById('teGrid');
  grid.innerHTML = '';
  const today = todayMidnight();
  const first = new Date(viewYear, viewMonth, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDow; i++) {
    const e = document.createElement('div'); e.className = 'te-cell empty'; grid.appendChild(e);
  }

  const cellRefs = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    const e = document.createElement('div');
    e.className = 'te-cell';
    e.textContent = d;

    if (dt < START && !sameDay(dt, START)) {
      e.classList.add('disabled');
    } else {
      const p = project(dt);
      e.classList.add(p.isMilestoneDay ? 'milestone-day' : (p.diversified ? 'phase2' : 'phase1'));
      if (sameDay(dt, today)) e.classList.add('today');
      if (sameDay(dt, selected)) e.classList.add('selected');
      e.addEventListener('click', () => { selected = dt; renderGrid(); renderDetail(dt); });
      if (dt <= today) cellRefs.push({ dt, el: e });
    }
    grid.appendChild(e);
  }
  renderMonthLabel();

  // Overlay real actual-vs-plan color for past/current days once we have it.
  cellRefs.forEach(async ({ dt, el }) => {
    const cmp = await fetchComparison(toISO(dt));
    if (cmp) el.classList.add(cmp.status === 'ahead' ? 'actual-good' : 'actual-bad');
  });
}

async function renderDetail(dt) {
  const p = project(dt);
  const today = todayMidnight();
  document.getElementById('teDHead').textContent =
    dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const tag = document.getElementById('teDTag');
  const rows = document.getElementById('teRows');
  const totalEl = document.getElementById('teTotal');

  let cmp = null;
  if (dt <= today) cmp = await fetchComparison(toISO(dt));

  if (cmp) {
    tag.textContent = cmp.status === 'ahead' ? '✅ Ahead of plan' : '⚠️ Behind plan';
    tag.className = 'te-dtag ' + (cmp.status === 'ahead' ? 'actual-good' : 'actual-bad');
    totalEl.textContent = money(cmp.actualTotal);
    rows.innerHTML = `
      <div class="te-row"><div class="n">Actual</div><div class="v">${money(cmp.actualTotal)}</div></div>
      <div class="te-row"><div class="n">Planned</div><div class="v sub">${money(cmp.estimatedTotal)}</div></div>`;
    return;
  }

  tag.textContent = p.isMilestoneDay ? '3L reached today' : p.diversified ? 'Distribution phase' : 'Building phase';
  tag.className = 'te-dtag ' + (p.isMilestoneDay ? 'milestone-day' : (p.diversified ? 'phase2' : 'phase1'));
  totalEl.textContent = money(p.total);
  rows.innerHTML = p.diversified
    ? `<div class="te-row"><div class="n">Freedom Fund</div><div class="v">${money(p.freedom)}</div></div>
       <div class="te-row"><div class="n">Savings</div><div class="v">${money(p.savings)}</div></div>
       <div class="te-row"><div class="n">Emergency Fund</div><div class="v">${money(p.emergency)}</div></div>`
    : `<div class="te-row"><div class="n">Trade Guardian cash (planned)</div><div class="v">${money(p.cash)}</div></div>`;
}

async function renderMilestone() {
  const today = todayMidnight();
  const p = project(today);
  const el = document.getElementById('teMilestone');
  if (p.diversified) {
    el.innerHTML = `<span class="te-flame">🏁</span> 3L reached — now distributing <b>${money(P2_DAILY)}</b>/day`;
    return;
  }
  const cmp = await fetchComparison(toISO(today));
  const daysLeft = Math.max(0, Math.ceil((TARGET - p.cash) / P1_DAILY));
  if (cmp) {
    el.innerHTML = `<span class="te-flame">🔥</span> ${money(cmp.actualTotal)} of ${money(TARGET)} · ${cmp.status === 'ahead' ? 'ahead of' : `${money(Math.abs(cmp.estimatedTotal - cmp.actualTotal))} behind`} pace`;
  } else {
    el.innerHTML = `<span class="te-flame">🔥</span> Day <b>${p.days + 1}</b> · <b>${daysLeft}</b> days to ₹3,00,000 at 5,000/day`;
  }
}

document.getElementById('tePrevM').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderGrid(); };
document.getElementById('teNextM').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderGrid(); };
document.getElementById('tePrevY').onclick = () => { viewYear--; renderGrid(); };
document.getElementById('teNextY').onclick = () => { viewYear++; renderGrid(); };

const jumpInput = document.getElementById('teJumpInput');
document.getElementById('teJumpToggle').onclick = () => jumpInput.classList.toggle('show');
document.getElementById('teJumpGo').onclick = () => {
  const v = document.getElementById('teJumpDate').value;
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
