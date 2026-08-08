document.getElementById('logout-btn').addEventListener('click', logout);

document.getElementById('passcode-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const page = document.getElementById('passcode-page').value;
  const currentPasscode = document.getElementById('current-passcode').value;
  const newPasscode = document.getElementById('new-passcode').value;
  const confirmPasscode = document.getElementById('confirm-passcode').value;
  const messageEl = document.getElementById('passcode-message');

  messageEl.textContent = '';
  messageEl.classList.remove('success', 'error');

  if (newPasscode !== confirmPasscode) {
    messageEl.textContent = 'New passcode and confirmation do not match.';
    messageEl.classList.add('error');
    return;
  }

  try {
    await api.post('/auth/change-passcode', { page, currentPasscode, newPasscode });

    messageEl.textContent = `Passcode for ${page} updated successfully.`;
    messageEl.classList.add('success');

    document.getElementById('passcode-form').reset();
  } catch (err) {
    messageEl.textContent = err.message || 'Could not update passcode.';
    messageEl.classList.add('error');
  }
});
