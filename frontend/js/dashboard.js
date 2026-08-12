async function loadDashboard() {
  document.getElementById('quote').textContent = getDailyQuote();
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const [standardsR, financeR, fitnessEntriesR, visionR, tradingR, engineR, reactorTodayR, reactorStatsR] =
    await Promise.allSettled([
      api.get('/standards/today'),
      api.get('/finance'),
      api.get('/fitness?limit=1'),
      api.get('/vision'),
      api.get('/trading/entries'),
      api.get(`/financial-engine?date=${todayStr}`),
      api.get('/reactor/today'),
      api.get('/reactor/stats?days=30'),
    ]);

  // Each section renders independently — one failed endpoint no longer
  // blanks out the whole dashboard.
  const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);

  const standardsScore = renderStandards(val(standardsR, null));
  const financeTotal = renderFinance(val(financeR, null));
  const disciplinePct = renderFitness(val(fitnessEntriesR, [])[0] || null);
  renderVision(val(visionR, []));
  const { streak, guarded } = renderTradeGuardian(val(tradingR, []), val(engineR, null));
  renderReactorMini(val(reactorTodayR, null), val(reactorStatsR, null));

  renderQuickStats({ standardsScore, financeTotal, streak, guarded, disciplinePct });

  [standardsR, financeR, fitnessEntriesR, visionR, tradingR, engineR, reactorTodayR, reactorStatsR]
    .filter(r => r.status === 'rejected')
    .forEach(r => console.error(r.reason));
}

/* ===== Daily Standards — radial burst dial ===== */
function renderStandards(data) {
  const entry = data?.entry;
  const score = entry ? Number(entry.avg_score) : 0;

  const g = document.getElementById('standards-ticks');
  g.innerHTML = '';
  const total = 24, lit = Math.round(total * (score / 10));
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 360;
    const rad = angle * Math.PI / 180;
    const cx = 100, cy = 75, r1 = 50, r2 = 62;
    const x1 = cx + r1 * Math.cos(rad), y1 = cy + r1 * Math.sin(rad);
    const x2 = cx + r2 * Math.cos(rad), y2 = cy + r2 * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', i < lit ? 'url(#tickGrad)' : 'rgba(255,255,255,.15)');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    g.appendChild(line);
  }

  document.getElementById('standards-big').textContent = score.toFixed(1);
  document.getElementById('standards-status').textContent = entry ? 'Logged for today' : 'Not logged yet today';
  return score;
}

/* ===== Finance — liquid capsule gauge ===== */
function renderFinance(finance) {
  const fill = document.getElementById('finance-fill');
  const label = document.getElementById('finance-total');
  const goal = document.getElementById('finance-goal');
  const badge = document.getElementById('finance-badge');

  if (!finance) {
    fill.style.width = '0%';
    label.textContent = '—';
    goal.textContent = 'Unable to load';
    badge.textContent = '—';
    badge.className = 'badge';
    return 0;
  }

  const total = Number(finance.bank_balance) + Number(finance.market_funds) + Number(finance.emergency_fund);
  const goalAmount = Number(finance.goal_amount) || 0;
  const rawPct = goalAmount ? (total / goalAmount) * 100 : 0;
  const shownPct = Math.min(rawPct, 100);

  fill.style.width = shownPct + '%';
  label.textContent = formatINR(total);

  if (rawPct > 100) {
    goal.textContent = `Past your ${formatINR(goalAmount)} goal — worth raising it`;
    badge.textContent = 'Goal reached';
    badge.className = 'badge warn';
  } else {
    goal.textContent = `of ${formatINR(goalAmount)} goal`;
    badge.textContent = Math.round(rawPct) + '%';
    badge.className = 'badge good';
  }

  return total;
}

/* ===== Fitness — Discipline Radar (unchanged logic) ===== */
const FITNESS_TARGETS = { steps: 10000, protein_g: 100, water_l: 3, sleep_hours: 7, workout_minutes: 45 };
const RADAR_AXES = [
  { key: 'steps',           label: 'STEPS',   unit: '' },
  { key: 'protein_g',       label: 'PROTEIN', unit: 'g' },
  { key: 'water_l',         label: 'WATER',   unit: 'L' },
  { key: 'sleep_hours',     label: 'SLEEP',   unit: 'h' },
  { key: 'workout_minutes', label: 'WORKOUT', unit: 'min' },
];

function polarPoint(pct, index, total, cx, cy, minR, maxR) {
  const angle = (index * (360 / total)) - 90;
  const r = minR + (Math.min(Math.max(pct, 0), 100) / 100) * (maxR - minR);
  const rad = angle * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function drawRadarGrid() {
  const cx = 110, cy = 92, minR = 14, maxR = 76;
  const grid = document.getElementById('radar-grid');
  const labels = document.getElementById('radar-axis-labels');
  if (!grid || !labels) return;
  grid.innerHTML = '';
  labels.innerHTML = '';

  [33, 66, 100].forEach(ringPct => {
    const pts = RADAR_AXES
      .map((_, i) => polarPoint(ringPct, i, RADAR_AXES.length, cx, cy, minR, maxR).join(','))
      .join(' ');
    grid.innerHTML += `<polygon points="${pts}"/>`;
  });

  RADAR_AXES.forEach((axis, i) => {
    const [x, y] = polarPoint(118, i, RADAR_AXES.length, cx, cy, minR, maxR);
    labels.innerHTML += `<text x="${x}" y="${y}">${axis.label}</text>`;
  });
}
drawRadarGrid();

function renderFitness(entry) {
  const badge = document.getElementById('fitness-badge');
  const status = document.getElementById('fitness-status');
  const shape = document.getElementById('radar-shape');
  const dotsG = document.getElementById('radar-dots');
  const legend = document.getElementById('fitness-legend');
  const cx = 110, cy = 92, minR = 14, maxR = 76;

  if (!entry) {
    shape.setAttribute(
      'points',
      RADAR_AXES.map((_, i) => polarPoint(0, i, RADAR_AXES.length, cx, cy, minR, maxR).join(',')).join(' ')
    );
    dotsG.innerHTML = '';
    legend.innerHTML = '';
    badge.textContent = 'No data';
    badge.className = 'badge';
    status.textContent = 'No entries yet';
    return null;
  }

  const pcts = RADAR_AXES.map(axis => {
    const value = Number(entry[axis.key]) || 0;
    const target = FITNESS_TARGETS[axis.key];
    return { ...axis, value, pct: Math.min((value / target) * 100, 100) };
  });

  const points = pcts.map((a, i) => polarPoint(a.pct, i, pcts.length, cx, cy, minR, maxR));
  shape.setAttribute('points', points.map(p => p.join(',')).join(' '));

  dotsG.innerHTML = points
    .map(([x, y]) => `<circle class="radar-dot" cx="${x}" cy="${y}" r="2.4"/>`)
    .join('');

  legend.innerHTML = pcts
    .map(a => `<div>${a.label}<span>${a.value}${a.unit}</span></div>`)
    .join('');

  const avgPct = pcts.reduce((s, a) => s + a.pct, 0) / pcts.length;
  const isToday = entry.entry_date === new Date().toISOString().slice(0, 10);

  badge.textContent = `${Math.round(avgPct)}%`;
  badge.className = 'badge ' + (avgPct >= 70 ? 'good' : avgPct >= 40 ? 'warn' : 'bad');
  status.textContent = isToday ? "Today's balance" : `Last logged ${entry.entry_date}`;

  return Math.round(avgPct);
}

/* ===== Dream Reactor — mini Spire embedded in the dashboard ===== */
function renderReactorMini(today, stats) {
  const badge = document.getElementById('reactor-badge');
  const chargeEl = document.getElementById('reactor-charge');
  const leaksEl = document.getElementById('reactor-leaks');
  const streakEl = document.getElementById('reactor-streak');
  const stage = document.getElementById('dashReactorStage');

  if (!today) {
    badge.textContent = 'Unavailable';
    badge.className = 'badge';
    chargeEl.textContent = '—';
    leaksEl.textContent = '—';
    streakEl.textContent = '—';
    return;
  }

  const charge = Math.round(today.charge);
  chargeEl.textContent = charge + '%';
  leaksEl.textContent = today.leaks;
  streakEl.textContent = stats ? '🔥 ' + stats.streak : '—';

  badge.textContent = charge + '% charged';
  badge.className = 'badge ' + (charge >= 60 ? 'good' : charge >= 35 ? 'warn' : 'bad');

  // gems dim slightly below half charge — a light echo of the full
  // reactor page's dynamic Spire, without duplicating its whole engine
  const gemOpacity = 0.35 + 0.65 * Math.min(charge / 100, 1);
  stage.querySelectorAll('.dspGem').forEach(el => { el.style.opacity = gemOpacity; });
}

/* ===== Vision Board — constellation ===== */
function renderVision(goals) {
  const chipsEl = document.getElementById('vision-chips');
  document.getElementById('vision-count').textContent = goals.length;

  if (!goals.length) {
    chipsEl.innerHTML = `
      <div class="const-empty">
        <div class="star">✨</div>
        <p>No vision goals yet — add your first one and watch your constellation grow.</p>
      </div>`;
    return;
  }

  const byCategory = {};
  goals.forEach(g => {
    const cat = g.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  chipsEl.innerHTML = '<div class="const-chips">' +
    Object.entries(byCategory)
      .map(([cat, count]) => `<span class="const-chip">✦ ${cat} · ${count}</span>`)
      .join('') +
    '</div>';
}

/* ===== Trade Guardian — shield badge ===== */
function computeGuardianStreak(entries) {
  // entries come back sorted ascending by entry_date (backend/models/trading.model.js)
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (Number(entries[i].profit) >= 0) streak++;
    else break;
  }
  return streak;
}

function renderTradeGuardian(entries, engine) {
  const streak = computeGuardianStreak(entries || []);
  const guarded = (entries || []).reduce((sum, e) => sum + Number(e.profit), 0);

  document.getElementById('tg-streak').textContent = streak;
  document.getElementById('tg-guarded').textContent = formatINR(guarded);

  const badge = document.getElementById('tg-badge');
  const ring = document.getElementById('tg-shield-ring');
  const pctEl = document.getElementById('tg-pct');
  const foot = document.getElementById('tg-bar-label');

  if (!engine) {
    badge.textContent = 'Unavailable';
    badge.className = 'badge';
    ring.style.background = 'conic-gradient(rgba(255,255,255,.15) 0%, rgba(255,255,255,.08) 0)';
    pctEl.textContent = '—';
    foot.textContent = 'Could not load projection';
    return { streak, guarded };
  }

  if (engine.diversified) {
    badge.textContent = '💎 Diversified';
    badge.className = 'badge good';
    ring.style.background = 'conic-gradient(#3ECF8E 100%, rgba(255,255,255,.08) 0)';
    pctEl.textContent = '100%';
    foot.textContent = `Earning ${formatINR(engine.currentDailyIncome)}/day since ${engine.diversificationDate}`;
  } else {
    badge.textContent = '📈 Growth Phase';
    badge.className = 'badge warn';
    const pct = clamp(Math.round((engine.tradeGuardianCash / 300000) * 100), 0, 100);
    ring.style.background = `conic-gradient(#FF6FD8 ${pct}%, rgba(255,255,255,.08) 0)`;
    pctEl.textContent = pct + '%';
    foot.textContent = `${formatINR(engine.tradeGuardianCash)} of ₹3,00,000 toward diversification`;
  }

  return { streak, guarded };
}

function renderQuickStats({ standardsScore, financeTotal, streak, guarded, disciplinePct }) {
  document.getElementById('qs-standards').textContent = standardsScore ? `${standardsScore.toFixed(1)}/10` : '—';
  document.getElementById('qs-networth').textContent = formatINR((financeTotal || 0) + (guarded || 0));
  document.getElementById('qs-streak').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
  document.getElementById('qs-discipline').textContent = disciplinePct != null ? `${disciplinePct}%` : '—';
}

loadDashboard();
