let currentGoal = null;

async function loadFitness() {
  try {
    currentGoal = await api.get('/fitness/goal');
    document.getElementById('goal_weight').value = currentGoal.goal_weight;

    const entries = await api.get('/fitness?limit=30');
    renderSummary(entries);
    renderHistory(entries);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSummary(entries) {
  const latest = entries[0];
  const latestWeight = latest?.weight;

  if (latestWeight && currentGoal) {
    const start = currentGoal.start_weight || latestWeight;
    const totalToLose = start - currentGoal.goal_weight;
    const doneSoFar = start - latestWeight;
    const pct = totalToLose > 0 ? (doneSoFar / totalToLose) * 100 : 0;
    renderSunriseArc(document.getElementById('fitness-arc'), pct, `${latestWeight}kg`);
    document.getElementById('fitness-caption').textContent = `Goal: ${currentGoal.goal_weight}kg`;
  } else {
    renderSunriseArc(document.getElementById('fitness-arc'), 0, '—');
    document.getElementById('fitness-caption').textContent = 'Log your weight to start tracking';
  }
}

function renderHistory(entries) {
  const el = document.getElementById('fitness-history');
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">💪</span>No entries yet. Log today's weight and workout below.</div>`;
    return;
  }
  el.innerHTML = entries.map(e => `
    <div class="history-row">
      <span>${new Date(e.entry_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
      <span class="numeric">${e.weight ? e.weight + 'kg' : '—'}</span>
      <span class="badge ${e.workout_done ? 'good' : 'warn'}">${e.workout_done ? 'Workout done' : 'Rest day'}</span>
    </div>
  `).join('');
}

document.getElementById('fitness-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    date: todayISO(),
    weight: Number(document.getElementById('weight').value),
    workout_done: document.getElementById('workout_done').checked,
    notes: document.getElementById('notes').value,
  };

  try {
    await api.post('/fitness', payload);
    showToast('Fitness entry saved', 'success');
    loadFitness();
    e.target.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('goal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    currentGoal = await api.put('/fitness/goal', {
      goal_weight: Number(document.getElementById('goal_weight').value),
    });
    showToast('Goal weight updated', 'success');
    loadFitness();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadFitness();
