// Dream Reactor — logs what charges the dream life vs what cracks it.
// State lives on the server (reactor_entries table); this file renders
// it and posts new entries. auth.js has already confirmed there's a
// valid token for this page before any of this runs.

const canvas = document.getElementById('reactorCanvas');
const ctx = canvas.getContext('2d');

let charge = 0;   // 0–100, current reactor charge for today
let cracks = [];  // angle (radians) for each leak logged today, purely visual
let t = 0;

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();
addEventListener('resize', resizeCanvas);

function drawReactor() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const baseR = 30 + (charge / 100) * 34;

  for (let i = 0; i < 3; i++) {
    const r = baseR + 18 + i * 16 + Math.sin(t * 0.04 + i) * 4;
    ctx.strokeStyle = `rgba(0,229,255,${0.18 - i * 0.05 + (charge / 100) * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.8);
  grad.addColorStop(0, `rgba(124,249,255,${0.7 + (charge / 100) * 0.3})`);
  grad.addColorStop(0.5, 'rgba(0,229,255,0.35)');
  grad.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, baseR * 1.8, 0, 7); ctx.fill();

  ctx.fillStyle = '#EAFEFF';
  ctx.beginPath(); ctx.arc(cx, cy, baseR * 0.4, 0, 7); ctx.fill();

  ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, baseR, -Math.PI / 2, -Math.PI / 2 + (charge / 100) * Math.PI * 2);
  ctx.stroke();

  cracks.forEach(ang => {
    ctx.strokeStyle = 'rgba(255,27,76,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath();
    const x1 = cx + Math.cos(ang) * baseR * 0.5, y1 = cy + Math.sin(ang) * baseR * 0.5;
    const x2 = cx + Math.cos(ang) * (baseR * 1.5), y2 = cy + Math.sin(ang) * (baseR * 1.5);
    const midx = cx + Math.cos(ang + 0.15) * baseR * 1.0, midy = cy + Math.sin(ang + 0.15) * baseR * 1.0;
    ctx.moveTo(x1, y1); ctx.lineTo(midx, midy); ctx.lineTo(x2, y2); ctx.stroke();
  });

  t++;
  requestAnimationFrame(drawReactor);
}
requestAnimationFrame(drawReactor);

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
    cracks = data.leakEntries.map(() => Math.random() * Math.PI * 2);

    document.getElementById('chargeVal').textContent = Math.round(charge) + '%';
    document.getElementById('leakVal').textContent = data.leaks;

    const dateLabel = new Date(data.date + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('reactorDate').textContent = dateLabel;

    data.charges.forEach(renderRow);
    data.leakEntries.forEach(renderRow);

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
      cracks.push(Math.random() * Math.PI * 2);
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

function renderTrajectory(trajectory) {
  const svg = document.getElementById('trajectorySvg');
  if (!trajectory.length) {
    svg.innerHTML = '<text x="10" y="90" fill="#5C7A94" font-size="11">Log a few days to see your trajectory.</text>';
    return;
  }

  const maxVal = Math.max(
    1,
    ...trajectory.map((d) => d.goodCumulative),
    ...trajectory.map((d) => d.badCumulative)
  );
  const W = 600, H = 160, PAD = 10;
  const n = trajectory.length;
  const xStep = n > 1 ? (W - PAD * 2) / (n - 1) : 0;

  const toY = (v) => H - PAD - (v / maxVal) * (H - PAD * 2);
  const toX = (i) => PAD + i * xStep;

  const goodPts = trajectory.map((d, i) => `${toX(i)},${toY(d.goodCumulative)}`).join(' ');
  const badPts = trajectory.map((d, i) => `${toX(i)},${toY(d.badCumulative)}`).join(' ');

  const last = trajectory[trajectory.length - 1];

  svg.innerHTML = `
    <polyline points="${goodPts}" fill="none" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${badPts}" fill="none" stroke="#FF1B4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    <circle cx="${toX(n - 1)}" cy="${toY(last.goodCumulative)}" r="4" fill="#7CF9FF"/>
    <circle cx="${toX(n - 1)}" cy="${toY(last.badCumulative)}" r="4" fill="#FF6B8F"/>
    <text x="${PAD}" y="${H - 2}" fill="#5C7A94" font-size="9" font-family="JetBrains Mono">${fmtDateShort(trajectory[0].date)}</text>
    <text x="${W - 60}" y="${H - 2}" fill="#5C7A94" font-size="9" font-family="JetBrains Mono">${fmtDateShort(last.date)}</text>
  `;
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
    renderTrajectory(data.trajectory);
    updateLockdownBanner(data.lockdownUntil);
  } catch (err) {
    showToast(err.message || 'Could not load reactor stats', 'error');
  }
}

loadStats();
