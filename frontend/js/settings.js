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
// --- Active Devices ---------------------------------------------------

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

async function loadSessions() {
  const listEl = document.getElementById('sessions-list');

  try {
    const result = await api.get('/auth/sessions');

    console.log('Active sessions response:', result);

    const sessions = result?.sessions || [];

    if (sessions.length === 0) {
      listEl.innerHTML = '<p class="sessions-empty">No active devices.</p>';
      return;
    }

    listEl.innerHTML = sessions.map((s) => `
      <div class="session-row" data-id="${s.id}">
        <div>
          <div class="session-device">
            ${s.device}${s.isCurrent ? ' <span class="session-current">This device</span>' : ''}
          </div>
          <div class="session-meta">
            ${s.page} · ${s.ip || 'Unknown IP'} · last active ${timeAgo(s.lastSeenAt)}
          </div>
        </div>
        ${s.isCurrent ? '' : `<button class="btn-secondary session-revoke" data-id="${s.id}">Log out</button>`}
      </div>
    `).join('');

    listEl.querySelectorAll('.session-revoke').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Logging out…';

        try {
          await api.del(`/auth/sessions/${btn.dataset.id}`);
          loadSessions();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Log out';
          alert(err.message || 'Could not log out that device.');
        }
      });
    });

  } catch (err) {
    console.error('Active Devices error:', err);

    listEl.innerHTML =
      `<p class="sessions-empty">Could not load devices: ${err.message || 'Unknown error'}</p>`;
  }
}

document.getElementById('revoke-others-btn').addEventListener('click', async () => {
  const btn = document.getElementById('revoke-others-btn');
  btn.disabled = true;
  btn.textContent = 'Logging out other devices…';
  try {
    await api.del('/auth/sessions');
    loadSessions();
  } catch (err) {
    alert(err.message || 'Could not log out other devices.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log out all other devices';
  }
});

loadSessions();
