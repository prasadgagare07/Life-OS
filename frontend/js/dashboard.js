async function loadDashboard() {
  document.getElementById('quote').textContent = getDailyQuote();
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  try {
    const [standards, finance, fitnessGoal, fitnessEntries] = await Promise.all([
      api.get('/standards/today'),
      api.get('/finance'),
      api.get('/fitness/goal'),
      api.get('/fitness?limit=1'),
    ]);

    // Standards score
    const score = standards ? Number(standards.avg_score) : 0;
    renderSunriseArc(document.getElementById('standards-arc'), score * 10, score.toFixed(1));
    document.getElementById('standards-status').textContent = standards
      ? 'Logged for today'
      : 'Not logged yet today';

    // Finance
    const total = Number(finance.bank_balance) + Number(finance.market_funds) + Number(finance.emergency_fund);
    const goalPct = (total / Number(finance.goal_amount)) * 100;
    renderSunriseArc(document.getElementById('finance-arc'), goalPct, Math.round(goalPct) + '%');
    document.getElementById('finance-total').textContent = formatINR(total);
    document.getElementById('finance-goal').textContent = `of ${formatINR(finance.goal_amount)} goal`;

    // Fitness
    const latestWeight = fitnessEntries[0]?.weight;
    if (latestWeight && fitnessGoal) {
      const start = fitnessGoal.start_weight || latestWeight;
      const totalToLose = start - fitnessGoal.goal_weight;
      const doneSoFar = start - latestWeight;
      const fitPct = totalToLose > 0 ? (doneSoFar / totalToLose) * 100 : 0;
      renderSunriseArc(document.getElementById('fitness-arc'), fitPct, `${latestWeight}kg`);
      document.getElementById('fitness-status').textContent = `Goal: ${fitnessGoal.goal_weight}kg`;
    } else {
      renderSunriseArc(document.getElementById('fitness-arc'), 0, '—');
      document.getElementById('fitness-status').textContent = 'No entries yet';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

loadDashboard();
