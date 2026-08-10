async function loadDashboard() {
  document.getElementById('quote').textContent = getDailyQuote();
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    // was: const weight = renderFitness(val(fitnessGoalR, null), val(fitnessEntriesR, []));
renderFitness(val(fitnessEntriesR, [])[0] || null);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const [standardsR, financeR, fitnessGoalR, fitnessEntriesR, visionR, tradingR, engineR] =
    await Promise.allSettled([
      api.get('/standards/today'),
      api.get('/finance'),
      api.get('/fitness/goal'),
      api.get('/fitness?limit=1'),
      api.get('/vision'),
      api.get('/trading/entries'),
      api.get(`/financial-engine?date=${todayStr}`),
    ]);

  // Each section renders independently — one failed endpoint no longer
  // blanks out the whole dashboard.
  const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);

  const standardsScore = renderStandards(val(standardsR, null));
  const financeTotal = renderFinance(val(financeR, null));
  const weight = renderFitness(val(fitnessGoalR, null), val(fitnessEntriesR, []));
  renderVision(val(visionR, []));
  const { streak, guarded } = renderTradeGuardian(val(tradingR, []), val(engineR, null));

  renderQuickStats({ standardsScore, financeTotal, streak, guarded, weight });

  [standardsR, financeR, fitnessGoalR, fitnessEntriesR, visionR, tradingR, engineR]
    .filter(r => r.status === 'rejected')
    .forEach(r => console.error(r.reason));
}

function renderStandards(data) {
  // /standards/today returns { entry, best } — not the entry itself.
  const entry = data?.entry;
  const score = entry ? Number(entry.avg_score) : 0;
  renderSunriseArc(document.getElementById('standards-arc'), score * 10, score.toFixed(1));
  document.getElementById('standards-status').textContent = entry
    ? 'Logged for today'
    : 'Not logged yet today';
  return score;
}

function renderFinance(finance) {
  if (!finance) {
    renderSunriseArc(document.getElementById('finance-arc'), 0, '—');
    document.getElementById('finance-total').textContent = '—';
    document.getElementById('finance-goal').textContent = 'Unable to load';
    return 0;
  }
  const total = Number(finance.bank_balance) + Number(finance.market_funds) + Number(finance.emergency_fund);
  const goalPct = finance.goal_amount ? (total / Number(finance.goal_amount)) * 100 : 0;
  renderSunriseArc(document.getElementById('finance-arc'), goalPct, Math.round(goalPct) + '%');
  document.getElementById('finance-total').textContent = formatINR(total);
  document.getElementById('finance-goal').textContent = `of ${formatINR(finance.goal_amount)} goal`;
  return total;
}

const FITNESS_TARGETS = { steps:10000, protein_g:100, water_l:3, sleep_hours:7, workout_minutes:45 };
const RADAR_AXES = [
  { key:'steps',           label:'STEPS',   unit:'' },
  { key:'protein_g',       label:'PROTEIN', unit:'g' },
  { key:'water_l',         label:'WATER',   unit:'L' },
  { key:'sleep_hours',     label:'SLEEP',   unit:'h' },
  { key:'workout_minutes', label:'WORKOUT', unit:'min' },
];

function polarPoint(pct, index, total, cx, cy, minR, maxR){
  const angle = (index * (360 / total)) - 90;
  const r = minR + (Math.min(Math.max(pct,0),100) / 100) * (maxR - minR);
  const rad = angle * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function drawRadarGrid(){
  const cx = 110, cy = 92, minR = 14, maxR = 76;
  const grid = document.getElementById('radar-grid');
  const labels = document.getElementById('radar-axis-labels');
  if (!grid || !labels) return;
  grid.innerHTML = ''; labels.innerHTML = '';

  [33, 66, 100].forEach(ringPct => {
    const pts = RADAR_AXES.map((_, i) => polarPoint(ringPct, i, RADAR_AXES.length, cx, cy, minR, maxR).join(',')).join(' ');
    grid.innerHTML += `<polygon points="${pts}"/>`;
  });

  RADAR_AXES.forEach((axis, i) => {
    const [x, y] = polarPoint(118, i, RADAR_AXES.length, cx, cy, minR, maxR);
    labels.innerHTML += `<text x="${x}" y="${y}">${axis.label}</text>`;
  });
}
drawRadarGrid();

function renderFitness(entry){
  const badge = document.getElementById('fitness-badge');
  const status = document.getElementById('fitness-status');
  const shape = document.getElementById('radar-shape');
  const dotsG = document.getElementById('radar-dots');
  const legend = document.getElementById('fitness-legend');
  const cx = 110, cy = 92, minR = 14, maxR = 76;

  if (!entry) {
    shape.setAttribute('points', RADAR_AXES.map((_, i) => polarPoint(0, i, RADAR_AXES.length, cx, cy, minR, maxR).join(',')).join(' '));
    dotsG.innerHTML = '';
    legend.innerHTML = '';
    badge.textContent = 'No data';
    badge.className = 'badge';
    status.textContent = 'No entries yet';
    return;
  }

  const pcts = RADAR_AXES.map(axis => {
    const val = Number(entry[axis.key]) || 0;
    const target = FITNESS_TARGETS[axis.key];
    return { ...axis, value: val, pct: Math.min((val / target) * 100, 100) };
  });

  const points = pcts.map((a, i) => polarPoint(a.pct, i, pcts.length, cx, cy, minR, maxR));
  shape.setAttribute('points', points.map(p => p.join(',')).join(' '));

  dotsG.innerHTML = points.map(([x, y]) => `<circle class="radar-dot" cx="${x}" cy="${y}" r="2.4"/>`).join('');
  legend.innerHTML = pcts.map(a => `<div>${a.label}<span>${a.value}${a.unit}</span></div>`).join('');

  const avgPct = pcts.reduce((s, a) => s + a.pct, 0) / pcts.length;
  const isToday = entry.entry_date === new Date().toISOString().slice(0, 10);

  badge.textContent = `${Math.round(avgPct)}%`;
  badge.className = 'badge ' + (avgPct >= 70 ? 'good' : avgPct >= 40 ? 'warn' : 'bad');
  status.textContent = isToday ? "Today's balance" : `Last logged ${entry.entry_date}`;
}


function renderVision(goals) {
  const chipsEl = document.getElementById('vision-chips');
  document.getElementById('vision-count').textContent = goals.length;

  if (!goals.length) {
    chipsEl.innerHTML = '<span class="stat-label">No vision goals yet — add your first one.</span>';
    return;
  }

  const byCategory = {};
  goals.forEach(g => {
    const cat = g.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  chipsEl.innerHTML = Object.entries(byCategory)
    .map(([cat, count]) => `<span class="badge vc-chip">${cat} · ${count}</span>`)
    .join('');
}

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
  const fill = document.getElementById('tg-bar-fill');
  const label = document.getElementById('tg-bar-label');

  if (!engine) {
    badge.textContent = 'Unavailable';
    badge.className = 'badge';
    fill.style.width = '0%';
    label.textContent = 'Could not load projection';
    return { streak, guarded };
  }

  if (engine.diversified) {
    badge.textContent = '💎 Diversified';
    badge.className = 'badge good';
    fill.style.width = '100%';
    label.textContent = `Earning ${formatINR(engine.currentDailyIncome)}/day since ${engine.diversificationDate}`;
  } else {
    badge.textContent = '📈 Growth Phase';
    badge.className = 'badge warn';
    const pct = clamp(Math.round((engine.tradeGuardianCash / 300000) * 100), 0, 100);
    fill.style.width = pct + '%';
    label.textContent = `${formatINR(engine.tradeGuardianCash)} of ₹3,00,000 (${pct}%)`;
  }

  return { streak, guarded };
}

function renderQuickStats({ standardsScore, financeTotal, streak, guarded, weight }) {
  document.getElementById('qs-standards').textContent = standardsScore ? `${standardsScore.toFixed(1)}/10` : '—';
  document.getElementById('qs-networth').textContent = formatINR((financeTotal || 0) + (guarded || 0));
  document.getElementById('qs-streak').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
  document.getElementById('qs-weight').textContent = weight ? `${weight} kg` : '—';
}

loadDashboard();
