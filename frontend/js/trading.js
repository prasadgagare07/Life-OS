// Trade Guardian — daily trading discipline journal.
//
// Persistence: currently uses localStorage so the page fully works right
// now, with no backend changes required. It also *tries* the real API
// first (api.get('/trading/entries') / api.post('/trading/entries')) so
// that once you add a `trading_entries` table + routes on the backend
// (see TODO at bottom), this file starts using them with zero changes
// needed here — it already prefers the API when available.

const TARGET = 5000;
const INITIAL_CAPITAL = 8500;
const START_DATE_STR = '2026-08-02'; // fixed baseline — change to your real start date
const STORAGE_KEY = 'lifeos_trading_entries';

function dstr(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmt(n) { return (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN'); }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function loadLocalEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(e => ({ date: new Date(e.date), profit: e.profit }));
  } catch { return []; }
}

function saveLocalEntries(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(
    list.map(e => ({ date: e.date.toISOString().slice(0, 10), profit: e.profit }))
  ));
}

let entries = [];

async function loadEntries() {
  try {
    const remote = await api.get('/trading/entries');
    if (Array.isArray(remote)) {
      return remote.map(e => ({ date: new Date(e.entry_date || e.date), profit: Number(e.profit) }));
    }
  } catch (e) {}
  return loadLocalEntries();
}

function monthKey(d) { return d.getFullYear() + '-' + d.getMonth(); }
function monthLabel(d) { return d.toLocaleDateString('en-US', { month: 'short' }); }

function computeAll() {
  let capital = INITIAL_CAPITAL, cum = 0;
  const start = new Date(START_DATE_STR);
  const points = [{ date: start, capital, profit: 0 }];
  entries.forEach(e => {
    capital += e.profit;
    cum += e.profit;
    points.push({ date: e.date, capital, profit: e.profit });
  });
  return { points, totalProfit: cum, finalCapital: capital };
}

function drawChart(points) {
  const svg = document.getElementById('chart-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const w = 620, h = 180, padL = 44, padR = 10, padT = 10, padB = 22;
  const n = points.length;
  const caps = points.map(p => p.capital);
  const paceCaps = points.map((p, i) => INITIAL_CAPITAL + i * TARGET);
  const allVals = caps.concat(paceCaps);
  const min = Math.min(...allVals), max = Math.max(...allVals, INITIAL_CAPITAL + 1);
  const range = (max - min) || 1;
  const stepX = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const toX = i => padL + i * stepX;
  const toY = v => h - padB - ((v - min) / range) * (h - padT - padB);

  for (let g = 0; g <= 2; g++) {
    const val = min + (range * g / 2);
    const y = toY(val);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padL); line.setAttribute('x2', w - padR);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', 4); lbl.setAttribute('y', y + 3);
    lbl.setAttribute('class', 'tg-chart-xlabel');
    lbl.textContent = '₹' + Math.round(val / 1000) + 'k';
    svg.appendChild(lbl);
  }

  function pathFor(vals) {
    let d = '';
    vals.forEach((v, i) => { d += (i === 0 ? 'M' : 'L') + toX(i) + ',' + toY(v) + ' '; });
    return d.trim();
  }

  if (n > 1) {
    const paceLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    paceLine.setAttribute('d', pathFor(paceCaps));
    paceLine.setAttribute('class', 'tg-chart-line pace');
    svg.appendChild(paceLine);

    const actualLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    actualLine.setAttribute('d', pathFor(caps));
    actualLine.setAttribute('class', 'tg-chart-line actual');
    svg.appendChild(actualLine);
  }

  points.forEach((p, i) => {
    if (i > 0 && i % 4 !== 0 && i !== n - 1) return;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', toX(i)); c.setAttribute('cy', toY(p.capital));
    c.setAttribute('r', i === n - 1 ? 4.5 : 2.8);
    c.setAttribute('fill', p.profit < 0 ? 'var(--bad)' : 'var(--tg-cyan-a, #5FF7E0)');
    svg.appendChild(c);
  });

  const labelEvery = Math.max(1, Math.ceil(n / 7));
  points.forEach((p, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return;
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', toX(i)); lbl.setAttribute('y', h - 4);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 'tg-chart-xlabel');
    lbl.textContent = dstr(p.date);
    svg.appendChild(lbl);
  });
}

function computeConsistency() {
  const recent = entries.slice(-14);
  if (recent.length < 3) return { score: null, msg: 'Add a few more days to see a real signal.' };
  const mean = recent.reduce((a, b) => a + b.profit, 0) / recent.length;
  const variance = recent.reduce((a, b) => a + Math.pow(b.profit - mean, 2), 0) / recent.length;
  const sd = Math.sqrt(variance);
  const volatilityPenalty = Math.min(70, (sd / TARGET) * 28);
  const missPenalty = recent.filter(e => e.profit < 0).length * 6;
  const score = Math.max(0, Math.min(100, Math.round(100 - volatilityPenalty - missPenalty)));
  let msg;
  if (score >= 80) msg = `<strong>Very disciplined.</strong> Your last 14 days stay close to your ₹5,000 target with few wild swings — this is exactly the pattern that compounds.`;
  else if (score >= 55) msg = `<strong>Mostly steady</strong>, with a few outlier days pulling this down — usually one big win followed by a give-back. Watch for that pattern.`;
  else msg = `<strong>High volatility.</strong> Your results swing far above and below target — a sign of chasing bigger wins instead of repeating the same disciplined one.`;
  return { score, msg };
}

function render() {
  const { points, totalProfit, finalCapital } = computeAll();

  document.getElementById('hero-capital').textContent = fmt(finalCapital);
  document.getElementById('hero-profit').textContent = fmt(totalProfit);
  document.getElementById('hero-days').textContent = entries.length;

  drawChart(points);

  document.getElementById('streak-num').textContent = Math.min(entries.length, 30);

  const ci = computeConsistency();
  document.getElementById('ci-num').textContent = ci.score === null ? '—' : ci.score;
  document.getElementById('ci-msg').innerHTML = ci.msg;
  const fill = document.getElementById('ci-fill');
  const circ = 2 * Math.PI * 42;
  fill.style.strokeDasharray = circ;
  fill.style.strokeDashoffset = ci.score === null ? circ : circ - (circ * ci.score / 100);
  fill.style.stroke = ci.score === null ? 'var(--border)' : ci.score >= 80 ? 'var(--good)' : ci.score >= 55 ? 'var(--accent-2)' : 'var(--bad)';
  if (ci.score !== null && ci.score >= 75) document.getElementById('badge-steady').classList.add('unlocked');

  const monthList = document.getElementById('month-list');
  monthList.innerHTML = '';

  const savingsAmountEl = document.getElementById('savings-amount');
  const swMonthEl = document.getElementById('sw-month');
  const swTotalEl = document.getElementById('sw-total');
  const actualPaceEl = document.getElementById('actual-pace');
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  if (entries.length === 0) {
    monthList.innerHTML = '<div style="color:var(--text-faint);font-size:.8rem;">No months logged yet — add your first day above.</div>';
    savingsAmountEl.textContent = fmt(0);
    swMonthEl.textContent = fmt(0);
    swTotalEl.textContent = fmt(0);
    actualPaceEl.textContent = '—';

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'tg-cal-cell future';
      grid.appendChild(cell);
    }
    return;
  }

  const byMonth = {};
  entries.forEach(e => {
    const k = monthKey(e.date);
    byMonth[k] = byMonth[k] || { label: monthLabel(e.date), total: 0 };
    byMonth[k].total += e.profit;
  });
  const monthVals = Object.values(byMonth);
  const maxMonth = Math.max(...monthVals.map(m => m.total), 1);
  monthVals.forEach(m => {
    const row = document.createElement('div');
    row.className = 'tg-month-row';
    row.innerHTML = `
      <div class="tg-month-name">${m.label}</div>
      <div class="tg-month-bar-track"><div class="tg-month-bar" style="width:${Math.max(6, (m.total / maxMonth) * 100)}%"></div></div>
      <div class="tg-month-amt">${fmt(m.total)}</div>
    `;
    monthList.appendChild(row);
  });

  let totalSweep = 0, monthSweep = 0;
  const curMonthKey = monthKey(entries[entries.length - 1].date);
  entries.forEach(e => {
    const over = Math.max(0, e.profit - TARGET);
    totalSweep += over;
    if (monthKey(e.date) === curMonthKey) monthSweep += over;
  });
  savingsAmountEl.textContent = fmt(totalSweep);
  swMonthEl.textContent = fmt(monthSwe
