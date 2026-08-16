// Every page has its own passcode, so the login screen unlocks whichever
// page it was sent here for (?page=finance), defaulting to the dashboard
// if opened directly.
const PAGE_LABELS = {
  dashboard: 'Dashboard',
  'daily-standards': 'Daily Standards',
  standards: 'Daily Standards',
  finance: 'Finance',
  'financial-time-explorer': 'Financial Time Explorer',
  'time-explorer': 'Time Explorer',
  fitness: 'Fitness',
  vision: 'Vision Board',
  trading: 'Trade Guardian',
  settings: 'Settings',
  reactor: 'Dream Reactor',   // ← make sure this exact line is present
  betterme: 'BetterMe',
};

function getRequestedPage() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  return page && PAGE_LABELS[page] ? page : 'dashboard';
}

const requestedPage = getRequestedPage();
document.getElementById('login-subtitle').textContent =
  `Enter the ${PAGE_LABELS[requestedPage]} passcode to continue`;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const passcode = document.getElementById('passcode').value.trim();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  try {
    const { token } = await api.post('/auth/login', { page: requestedPage, passcode });
    localStorage.setItem(`lifeos_token_${requestedPage}`, token);
    window.location.href = `/${requestedPage}.html`;
  } catch (err) {
    errorEl.textContent = err.message || 'Incorrect passcode';
  }
});
