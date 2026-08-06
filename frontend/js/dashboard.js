async function loadDashboard() {
  document.getElementById('quote').textContent = getDailyQuote();
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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

function renderFitness(goal, entries) {
  const latestWeight = entries?.[0]?.weight;
  if (latestWeight && goal) {
    const start = goal.start_weight || latestWeight;
    const totalToLose = start - goal.goal_weight;
    const doneSoFar = start - latestWeight;
    const fitPct = totalToLose > 0 ? (doneSoFar / totalToLose) * 100 : 0;
    renderSunriseArc(document.getElementById('fitness-arc'), fitPct, `${latestWeight}kg`);
    document.getElementById('fitness-status').textContent = `Goal: ${goal.goal_weight}kg`;
    return latestWeight;
  }
  renderSunriseArc(document.getElementById('fitness-arc'), 0, '—');
  document.getElementById('fitness-status').textContent = 'No entries yet';
  return null;
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
