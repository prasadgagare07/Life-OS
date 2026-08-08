// Include this on every protected page (dashboard, standards, finance,
// fitness, vision, trading, settings) — it bounces to that page's own
// login screen if there's no token for THIS specific page. A token for one
// page never unlocks another.
(function guardPage() {
  const page = getCurrentPage();
  const token = localStorage.getItem(getPageTokenKey(page));
  if (!token) {
    window.location.href = `/index.html?page=${encodeURIComponent(page)}`;
  }
})();

// Logs out of every page at once (used by the "Log out" links/buttons).
function logout() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('lifeos_token_'))
    .forEach((key) => localStorage.removeItem(key));
  window.location.href = '/index.html';
}
