function formatINR(amount) {
  const n = Number(amount) || 0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// Renders a sunrise-arc progress element into the given container.
// pct: 0-100. label: text shown under the arc (e.g. "7.4" or "62%").
function renderSunriseArc(container, pct, label) {
  const safePct = clamp(pct, 0, 100);
  container.style.setProperty('--pct', safePct);
  container.innerHTML = `
    <svg viewBox="0 0 140 84">
      <defs>
        <linearGradient id="sunriseGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FF8A4C" />
          <stop offset="100%" stop-color="#FFC15E" />
        </linearGradient>
      </defs>
      <path class="track" d="M10,80 A60,60 0 0,1 130,80" />
      <path class="fill" d="M10,80 A60,60 0 0,1 130,80" />
    </svg>
    <div class="arc-label">${label}</div>
  `;
}

function showToast(message, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
