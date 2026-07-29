const STANDARD_FIELDS = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'workout', label: 'Workout' },
  { key: 'diet', label: 'Diet' },
  { key: 'reading', label: 'Reading' },
  { key: 'meditation', label: 'Meditation' },
  { key: 'no_junk', label: 'No Junk / No Distraction' },
];

function buildSliders(existing) {
  const container = document.getElementById('sliders');
  container.innerHTML = STANDARD_FIELDS.map(f => `
    <div class="slider-row">
      <div class="slider-label">
        <span>${f.label}</span>
        <span class="numeric slider-value" id="val-${f.key}">${existing?.[f.key] ?? 5}</span>
      </div>
      <input type="range" min="0" max="10" step="1"
             id="input-${f.key}" value="${existing?.[f.key] ?? 5}"
             oninput="document.getElementById('val-${f.key}').textContent = this.value; updateAverage();">
    </div>
  `).join('');
}

function updateAverage() {
  const total = STANDARD_FIELDS.reduce((sum, f) => sum + Number(document.getElementById(`input-${f.key}`).value), 0);
  const avg = total / STANDARD_FIELDS.length;
  document.getElementById('live-average').textContent = avg.toFixed(1);
}

async function loadStandards() {
  try {
    const today = await api.get('/standards/today');
    buildSliders(today);
    updateAverage();

    const recent = await api.get('/standards?limit=14');
    renderHistory(recent);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderHistory(entries) {
  const el = document.getElementById('history-list');
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">🌱</span>No entries yet. Log today's standards to start your streak.</div>`;
    return;
  }
  el.innerHTML = entries.map(e => `
    <div class="history-row">
      <span>${new Date(e.entry_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
      <span class="numeric">${Number(e.avg_score).toFixed(1)}</span>
    </div>
  `).join('');
}

document.getElementById('standards-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = { date: todayISO() };
  STANDARD_FIELDS.forEach(f => {
    payload[f.key] = Number(document.getElementById(`input-${f.key}`).value);
  });

  try {
    await api.post('/standards', payload);
    showToast('Saved today\'s standards', 'success');
    loadStandards();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadStandards();
