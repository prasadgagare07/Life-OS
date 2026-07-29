async function loadVision() {
  try {
    const goals = await api.get('/vision');
    renderGoals(goals);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderGoals(goals) {
  const el = document.getElementById('vision-grid');
  if (!goals.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">🌟</span>Your vision board is empty. Add your first dream below.</div>`;
    return;
  }
  el.innerHTML = goals.map(g => `
    <div class="vision-card" style="${g.image_url ? `background-image:url('${g.image_url}')` : ''}">
      <div class="vision-card-overlay">
        <span class="badge good">${g.category || 'goal'}</span>
        <h3>${g.title}</h3>
        <p>${g.description || ''}</p>
        <button class="btn-secondary" onclick="deleteGoal(${g.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

async function deleteGoal(id) {
  try {
    await api.del(`/vision/${id}`);
    showToast('Removed from vision board', 'success');
    loadVision();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('vision-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    image_url: document.getElementById('image_url').value,
  };

  try {
    await api.post('/vision', payload);
    showToast('Added to vision board', 'success');
    e.target.reset();
    loadVision();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadVision();
