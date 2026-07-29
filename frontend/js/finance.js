async function loadFinance() {
  try {
    const snapshot = await api.get('/finance');

    document.getElementById('bank_balance').value = snapshot.bank_balance;
    document.getElementById('market_funds').value = snapshot.market_funds;
    document.getElementById('emergency_fund').value = snapshot.emergency_fund;
    document.getElementById('goal_amount').value = snapshot.goal_amount;

    renderSummary(snapshot);

    const timeline = await api.get('/finance/timeline?limit=30');
    renderTimeline(timeline);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSummary(snapshot) {
  const total = Number(snapshot.bank_balance) + Number(snapshot.market_funds) + Number(snapshot.emergency_fund);
  const pct = (total / Number(snapshot.goal_amount)) * 100;

  document.getElementById('total-wealth').textContent = formatINR(total);
  document.getElementById('goal-caption').textContent = `${Math.min(100, Math.round(pct))}% of ${formatINR(snapshot.goal_amount)} goal`;
  renderSunriseArc(document.getElementById('finance-arc'), pct, Math.round(pct) + '%');
}

function renderTimeline(entries) {
  const el = document.getElementById('timeline-list');
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">📈</span>No history yet — save an update to start your wealth timeline.</div>`;
    return;
  }
  const max = Math.max(...entries.map(e => Number(e.total_wealth)));
  el.innerHTML = entries.slice().reverse().map(e => `
    <div class="timeline-row">
      <span class="timeline-date">${new Date(e.recorded_on).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
      <div class="timeline-bar-track">
        <div class="timeline-bar" style="width:${max ? (Number(e.total_wealth) / max) * 100 : 0}%"></div>
      </div>
      <span class="numeric">${formatINR(e.total_wealth)}</span>
    </div>
  `).join('');
}

document.getElementById('finance-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    bank_balance: Number(document.getElementById('bank_balance').value),
    market_funds: Number(document.getElementById('market_funds').value),
    emergency_fund: Number(document.getElementById('emergency_fund').value),
    goal_amount: Number(document.getElementById('goal_amount').value),
  };

  try {
    const updated = await api.put('/finance', payload);
    renderSummary(updated);
    const timeline = await api.get('/finance/timeline?limit=30');
    renderTimeline(timeline);
    showToast('Finance snapshot updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadFinance();
