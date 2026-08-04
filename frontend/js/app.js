// Renders the sidebar nav into any element with id="sidebar",
// highlighting the current page. Also builds the mobile hamburger
// toggle and overlay so the sidebar can act as an off-canvas drawer
// on small screens — this runs on every page automatically.
const NAV_ITEMS = [
  { href: 'dashboard.html', icon: '🏠', label: 'Dashboard' },
  { href: 'daily-standards.html', icon: '🌱', label: 'Daily Standards' },
  { href: 'finance.html', icon: '💰', label: 'Finance' },
  { href: 'financial-time-explorer.html', icon: '⏳', label: 'Financial Time Explorer' },
  { href: 'fitness.html', icon: '💪', label: 'Fitness' },
  { href: 'vision.html', icon: '🌟', label: 'Vision Board' },
  { href: 'trading.html', icon: '🛡️', label: 'Trade Guardian' },
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

  setupMobileDrawer(el);
}

function setupMobileDrawer(sidebarEl) {
  if (document.querySelector('.sidebar-toggle')) return; // already set up

  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(toggle);

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function closeDrawer() {
    sidebarEl.classList.remove('open');
    overlay.classList.remove('visible');
  }

  toggle.addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
    overlay.classList.toggle('visible');
  });

  overlay.addEventListener('click', closeDrawer);

  sidebarEl.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeDrawer();
  });
}

document.addEventListener('DOMContentLoaded', renderSidebar);
