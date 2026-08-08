// Central place for talking to the backend.
// If you deploy the frontend separately from the backend, change API_BASE
// to your backend's full URL, e.g. 'https://lifeos-api.onrender.com/api'.
const API_BASE = '/api';

// Each page has its own passcode and its own token, stored under its own
// localStorage key, so unlocking one page never unlocks another.
function getCurrentPage() {
  const file = window.location.pathname.split('/').pop() || 'dashboard.html';
  return file.replace(/\.html$/, '') || 'dashboard';
}

function getPageTokenKey(page) {
  return `lifeos_token_${page}`;
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const page = getCurrentPage();
  const token = localStorage.getItem(getPageTokenKey(page));

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // A 401 from the login endpoint itself means "wrong passcode" — that should
  // show as an error message, not trigger a logout-redirect (there's no
  // session to log out of yet). Only auto-redirect on 401s from *other*
  // endpoints, which mean an existing token expired or was invalidated.
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem(getPageTokenKey(page));
    window.location.href = `/index.html?page=${encodeURIComponent(page)}`;
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
    throw new Error(err.error || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
};
