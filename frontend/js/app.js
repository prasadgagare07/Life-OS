// Renders the sidebar nav into any element with id="sidebar",
// highlighting the current page.
const NAV_ITEMS = [
  { href: 'dashboard.html', icon: '🏠', label: 'Dashboard' },
  { href: 'standards.html', icon: '🌱', label: 'Daily Standards' },
  { href: 'finance.html', icon: '💰', label: 'Finance' },
  { href: 'fitness.html', icon: '💪', label: 'Fitness' },
  { href: 'vision.html', icon: '🌟', label: 'Vision Board' },
  { href: 'settings.html', icon: '⚙️', label: 'Settings' },
];

function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const current = window.location.pathname.split('/').pop() || 'dashboard.html';

  el.innerHTML = `
    <div class="brand">
      <span class="mark">🌄</span>
      <span>LifeOS</span>
    </div>
    <nav class="nav-links">
      ${NAV_ITEMS.map(item => `
        <a class="nav-link ${item.href === current ? 'active' : ''}" href="${item.href}">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
      <a class="nav-link" href="#" onclick="logout(); return false;">
        <span class="icon">🚪</span>
        <span>Log out</span>
      </a>
    </nav>
    <div class="sidebar-footer">LifeOS v1.0</div>
  `;
}

document.addEventListener('DOMContentLoaded', renderSidebar);
