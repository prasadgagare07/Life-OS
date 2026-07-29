// Include this on every protected page (dashboard, standards, finance,
// fitness, vision, settings) — it bounces to login if there's no token.
(function guardPage() {
  const token = localStorage.getItem('lifeos_token');
  if (!token) {
    window.location.href = '/index.html';
  }
})();

function logout() {
  localStorage.removeItem('lifeos_token');
  window.location.href = '/index.html';
}
