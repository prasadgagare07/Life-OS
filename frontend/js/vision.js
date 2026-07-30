const CATEGORY_META = {
  "financial dreams": { icon: "💰", color: "#3ECF8E" },
  "dream home":        { icon: "🏡", color: "#FFC15E" },
  "dream bike":        { icon: "🏍️", color: "#FF8A4C" },
  "dream car":         { icon: "🚗", color: "#5B8CFF" },
  "world travel":      { icon: "✈️", color: "#4FD1E8" },
  "skills to master":  { icon: "🎓", color: "#B18CFF" },
  "fitness goals":     { icon: "💪", color: "#F2555A" },
  "purpose & impact":  { icon: "❤️", color: "#F27FA0" },
};

const FALLBACK_PALETTE = ["#3ECF8E", "#FFC15E", "#FF8A4C", "#5B8CFF", "#4FD1E8", "#B18CFF"];

function categoryMeta(name) {
  const key = (name || "goal").trim().toLowerCase();
  if (CATEGORY_META[key]) return CATEGORY_META[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return { icon: "🎯", color: FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length] };
}

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

  const groups = {};
  goals.forEach(g => {
    const key = (g.category || "Goals").trim() || "Goals";
    if (!groups[key]) groups[key] = [];
    groups[key].push(g);
  });

  el.innerHTML = Object.entries(groups).map(([category, items]) => {
    const meta = categoryMeta(category);
    const imageItem = items.find(i => i.image_url);

    return `
      <div class="vision-card">
        <div class="vision-card-header" style="background:${meta.color};">
          <span class="cat-icon">${meta.icon}</span>
          <span>${category}</span>
        </div>

        ${imageItem ? `
          <div class="vision-card-image" style="background-image:url('${imageItem.image_url}')">
            <div class="check-badge">✓</div>
          </div>
        ` : ''}

        <div class="vision-card-body">
          <ul class="vision-checklist">
            ${items.map(item => `
              <li>
                <span class="tick">✓</span>
                <span class="item-text">
                  ${item.title}
                  ${item.description ? `<span class="item-desc">${item.description}</span>` : ''}
                </span>
                <button class="remove-btn" title="Remove" onclick="deleteGoal(${item.id})">✕</button>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }).join('');
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
