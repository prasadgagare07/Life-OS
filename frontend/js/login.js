document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const passcode = document.getElementById('passcode').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  try {
    const { token } = await api.post('/auth/login', { passcode });
    localStorage.setItem('lifeos_token', token);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message || 'Incorrect passcode';
  }
});
