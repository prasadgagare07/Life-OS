// Dream Reactor — logs what charges the dream life vs what cracks it.
// State lives on the server (reactor_entries table); this file renders
// it and posts new entries. auth.js has already confirmed there's a
// valid token for this page before any of this runs.

let charge = 0;      // 0–100, current reactor charge for today
let todayEntries = []; // {id, text, created_at, kind: 'charge'|'leak'} — feeds the bar chart

function localDateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderRow(entry) {
  const targetLog = document.getElementById(entry.type === 'charge' ? 'logCharge' : 'logLeak');
  const row = document.createElement('div');
  row.className = 'row ' + entry.type;
  row.dataset.id = entry.id;
  row.innerHTML = `
    <div class="dot"></div>
    <div class="txt"><b>${escapeHtml(entry.text)}</b><span>${timeLabel(entry.created_at)} · today</span></div>
    <button class="del" title="Remove">✕</button>
  `;
  row.querySelector('.del').addEventListener('click', () => removeEntry(entry.id, row));
  targetLog.appendChild(row);
}

async function removeEntry(id, row) {
  try {
    const { charge: newCharge, leaks } = await api.del(`/reactor/${id}`);
    row.remove();
    charge = newCharge;
    document.getElementById('chargeVal').textContent = Math.round(charge) + '%';
    document.getElementById('leakVal').textContent = leaks;
    todayEntries = todayEntries.filter(e => e.id !== id);
    renderTodayChart();
    maybeShowEmpty('logCharge', 'emptyCharge', 'No charge yet — log the first good thing you did.');
    maybeShowEmpty('logLeak', 'emptyLeak', 'No cracks yet — good. Keep it sealed.');
    updateCounts();
  } catch (err) {
    showToast(err.message || 'Could not remove entry', 'error');
  }
}

function maybeShowEmpty(logId, emptyId, message) {
  const log = document.getElementById(logId);
  if (log.querySelectorAll('.row').length === 0 && !document.getElementById(emptyId)) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.id = emptyId;
    empty.textContent = message;
    log.appendChild(empty);
  }
}

function updateCounts() {
  document.getElementById('chargeCount').textContent = document.querySelectorAll('#logCharge .row').length;
  document.getElementById('leakCount').textContent = document.querySelectorAll('#logLeak .row').length;
}

async function loadToday() {
  try {
    const data = await api.get('/reactor/today');
    charge = data.charge;

    document.getElementById('chargeVal').textContent = Math.round(charge) + '%';
    document.getElementById('leakVal').textContent = data.leaks;

    const dateLabel = new Date(data.date + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('reactorDate').textContent = dateLabel;

    data.charges.forEach(renderRow);
    data.leakEntries.forEach(renderRow);

    todayEntries = [
      ...data.charges.map(e => ({ ...e, kind: 'charge' })),
      ...data.leakEntries.map(e => ({ ...e, kind: 'leak' })),
    ];
    renderTodayChart();

    if (data.charges.length) document.getElementById('emptyCharge')?.remove();
    if (data.leakEntries.length) document.getElementById('emptyLeak')?.remove();
    updateCounts();
  } catch (err) {
    showToast(err.message || 'Could not load today\'s reactor', 'error');
  }
}

/* --- Input modal --- */
let pendingType = null;
const modalBack = document.getElementById('modalBack');
const modalTitle = document.getElementById('modalTitle');
const modalHint = document.getElementById('modalHint');
const modalInput = document.getElementById('modalInput');
const modalSubmit = document.getElementById('modalSubmit');

function openModal(type) {
  pendingType = type;
  modalTitle.textContent = type === 'charge' ? 'What moved you toward the dream?' : 'What pulled you away from it?';
  modalTitle.className = type;
  modalHint.textContent = type === 'charge' ? 'One line is enough — be specific.' : 'Be honest. This is just for you.';
  modalInput.placeholder = type === 'charge' ? 'e.g. Studied EC2 for 1 hour' : 'e.g. Skipped practice, doomscrolled 2hrs';
  modalSubmit.className = 'modalBtn submit ' + type;
  modalSubmit.textContent = type === 'charge' ? 'Charge It' : 'Crack It';
  modalInput.value = '';
  modalBack.classList.add('open');
  setTimeout(() => modalInput.focus(), 100);
}

function closeModal() {
  modalBack.classList.remove('open');
  pendingType = null;
}

document.getElementById('chargeBtn').addEventListener('click', () => openModal('charge'));
document.getElementById('leakBtn').addEventListener('click', () => openModal('leak'));
document.getElementById('modalCancel').addEventListener('click', closeModal);
modalInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitEntry(); });
modalSubmit.addEventListener('click', submitEntry);

async function submitEntry() {
  const text = modalInput.value.trim();
  if (!text) { modalInput.focus(); return; }

  const type = pendingType;
  modalSubmit.disabled = true;

  try {
    const { entry, charge: newCharge, leaks, race, raceResolved } = await api.post('/reactor', { type, text });

    document.getElementById(type === 'charge' ? 'emptyCharge' : 'emptyLeak')?.remove();
    renderRow(entry);
    updateCounts();
    closeModal();

    charge = newCharge;
    document.getElementById('chargeVal').textContent = Math.round(charge) + '%';
    document.getElementById('leakVal').textContent = leaks;
    todayEntries.push({ ...entry, kind: type });
    renderTodayChart();

    if (race) renderRace(race);

    if (raceResolved) {
      showOutcome(raceResolved);
    } else {
      loadStats();
    }

    const toast = document.getElementById('rxToast');
    toast.textContent = type === 'charge' ? '⚡ Logged — power rising' : '☢️ Logged — containment breached';
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast ' + type; }, 1700);

    if (type === 'leak') {
      const flash = document.getElementById('leakFlash');
      flash.className = 'leakFlash show';
      setTimeout(() => { flash.className = 'leakFlash'; }, 700);
      document.body.classList.remove('rx-shake');
      void document.body.offsetWidth;
      document.body.classList.add('rx-shake');
    }
  } catch (err) {
    showToast(err.message || 'Could not save entry', 'error');
  } finally {
    modalSubmit.disabled = false;
  }
}

loadToday();

/* --- Race, points, trajectory, lockdown (added) --- */

// Set your own reward text here — shown on the IGNITION screen.
const REWARD_TEXT = 'You earned it — go treat yourself to whatever you\'ve been holding off on.';

function fmtDateShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// One bar per entry logged today, showing the running charge % right
// after that entry — cyan/rising for a charge (+12%), red/falling for
// a leak (−8%). Y-axis runs 10→100%, with a 125% headroom line.
const RX_CHARGE_STEP = 12, RX_LEAK_STEP = 8, RX_MAX_AXIS = 125;
const RX_TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function renderTodayChart() {
  const yAxisEl = document.getElementById('rxYAxis');
  const gridEl = document.getElementById('rxGridLines');
  const barsEl = document.getElementById('rxBarsRow');

  yAxisEl.innerHTML = `<span class="headroom">125</span>` +
    RX_TICKS.slice().reverse().map(t => `<span>${t}</span>`).join('');

  gridEl.innerHTML = [...RX_TICKS, 125].map(t =>
    `<div class="gridLine ${t === 125 ? 'headroom' : ''}" style="bottom:${(t / RX_MAX_AXIS) * 100}%"></div>`
  ).join('');

  if (!todayEntries.length) {
    barsEl.innerHTML = '<span style="font-size:.68rem;color:var(--rx-muted);align-self:center;">Log something to see today\'s chart.</span>';
    return;
  }

  const sorted = [...todayEntries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let running = 0;
  const points = sorted.map(e => {
    running = e.kind === 'charge'
      ? Math.min(100, running + RX_CHARGE_STEP)
      : Math.max(0, running - RX_LEAK_STEP);
    return { kind: e.kind, value: running };
  });

  barsEl.innerHTML = points.map((p, i) => `
    <div class="barItem">
      <span class="barPct">${p.value}%</span>
      <div class="barShape ${p.kind === 'charge' ? 'up' : 'down'}" style="height:${(p.value / RX_MAX_AXIS) * 100}%"></div>
      <span class="barIdx">${i + 1}</span>
    </div>
  `).join('');
}

// One cell per calendar day, colored by that day's net score (that day's
// good points minus bad points — not cumulative). Days with no entries
// carry the cumulative total forward flat, so they net to zero and render
// as neutral. No axis, so a lopsided total (e.g. 70 good vs 10 bad) never
// distorts the chart the way a dual-line graph on a shared scale would.
function renderHeatmap(trajectory) {
  const grid = document.getElementById('heatGrid');
  if (!trajectory.length) {
    grid.innerHTML = '<span style="grid-column:1/-1;font-size:.75rem;color:var(--rx-muted);text-align:center;padding:20px 0;">Log a few days to see your trajectory.</span>';
    return;
  }

  const byDate = {};
  trajectory.forEach(d => { byDate[d.date] = d; });

  const start = new Date(trajectory[0].date + 'T00:00:00');
  const end = new Date(trajectory[trajectory.length - 1].date + 'T00:00:00');

  let prevGood = 0, prevBad = 0;
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = localDateKey(d);
    const entry = byDate[key];
    const good = entry ? entry.goodCumulative : prevGood;
    const bad = entry ? entry.badCumulative : prevBad;
    const net = (good - prevGood) - (bad - prevBad);
    cells.push({ date: key, net });
    prevGood = good;
    prevBad = bad;
  }

  const maxAbs = Math.max(1, ...cells.map(c => Math.abs(c.net)));

  grid.innerHTML = cells.map(c => {
    let bg;
    if (c.net > 0) bg = `rgba(0,229,255,${0.15 + Math.min(1, c.net / maxAbs) * 0.65})`;
    else if (c.net < 0) bg = `rgba(255,27,76,${0.15 + Math.min(1, Math.abs(c.net) / maxAbs) * 0.65})`;
    else bg = 'rgba(255,255,255,.04)';
    const dayNum = new Date(c.date + 'T00:00:00').getDate();
    return `<div class="heatCell" style="background:${bg};" title="${fmtDateShort(c.date)}: ${c.net >= 0 ? '+' : ''}${c.net}">${dayNum}</div>`;
  }).join('');
}

function renderRace(race) {
  document.getElementById('raceNumber').textContent = race.raceNumber;

  const goodPct = (race.goodPoints / race.target) * 50; // half-track each side
  const badPct = (race.badPoints / race.target) * 50;
  document.getElementById('raceFillGood').style.width = goodPct + '%';
  document.getElementById('raceFillBad').style.width = badPct + '%';

  const lead = race.goodPoints - race.badPoints;
  const leadLabel = document.getElementById('raceLeadLabel');
  if (lead > 0) leadLabel.textContent = `GOOD LEADS BY ${lead}`;
  else if (lead < 0) leadLabel.textContent = `BAD LEADS BY ${-lead}`;
  else leadLabel.textContent = 'EVEN';
}

function showOutcome(resolved) {
  const overlay = document.getElementById('outcomeOverlay');
  const card = document.getElementById('outcomeCard');
  const icon = document.getElementById('outcomeIcon');
  const title = document.getElementById('outcomeTitle');
  const body = document.getElementById('outcomeBody');

  if (resolved.winner === 'good') {
    card.classList.remove('lose');
    icon.textContent = '🏆';
    title.textContent = 'IGNITION';
    body.textContent = `Race #${resolved.raceNumber} won. The dream beat the excuses. ${REWARD_TEXT}`;
  } else {
    card.classList.add('lose');
    icon.textContent = '☢️';
    title.textContent = 'MELTDOWN';
    body.textContent = `Race #${resolved.raceNumber} lost to the cracks. Lockdown: only charges can be logged for the next ${24} hours.`;
  }

  overlay.classList.add('open');
}
document.getElementById('outcomeClose').addEventListener('click', () => {
  document.getElementById('outcomeOverlay').classList.remove('open');
  loadStats();
});

function updateLockdownBanner(lockdownUntil) {
  const banner = document.getElementById('lockdownBanner');
  const leakBtn = document.getElementById('leakBtn');
  if (lockdownUntil && new Date(lockdownUntil) > new Date()) {
    banner.style.display = 'block';
    document.getElementById('lockdownUntil').textContent =
      new Date(lockdownUntil).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    leakBtn.disabled = true;
    leakBtn.style.opacity = '0.4';
  } else {
    banner.style.display = 'none';
    leakBtn.disabled = false;
    leakBtn.style.opacity = '1';
  }
}

async function loadStats() {
  try {
    const data = await api.get('/reactor/stats?days=30');

    document.getElementById('lifetimeGood').textContent = '+' + data.lifetime.goodPoints;
    document.getElementById('lifetimeBad').textContent = data.lifetime.badPoints;
    document.getElementById('streakVal').textContent = '🔥 ' + data.streak;

    renderRace(data.race);
    renderHeatmap(data.trajectory);
    updateLockdownBanner(data.lockdownUntil);
  } catch (err) {
    showToast(err.message || 'Could not load reactor stats', 'error');
  }
}

loadStats();
