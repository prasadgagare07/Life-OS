// =======================================
// LifeOS Daily Standards
// Ratings are saved to the backend (daily_entries table) and locked
// once saved for the day — the lock is driven by the server's own
// "locked" flag on today's entry, not just a local browser flag.
// =======================================

const defaultHabits = [
  { name: "Naam Jap", icon: "🙏", color: "#A855F7" },
  { name: "Meditation", icon: "🧘", color: "#3B82F6" },
  { name: "Yoga + Manifestation", icon: "🌅", color: "#14B8A6" },
  { name: "Sleep Schedule", icon: "🌙", color: "#6366F1" },
  { name: "Screen Glasses", icon: "👓", color: "#06B6D4" },
  { name: "Hair, Face Care & Hygiene", icon: "✨", color: "#22C55E" },
  { name: "Read 20 Pages", icon: "📖", color: "#F97316" },
  { name: "Phone Discipline", icon: "📱", color: "#EF4444" },
  { name: "English Speaking (10 min)", icon: "🗣️", color: "#EAB308" },
  { name: "Daily Review", icon: "📝", color: "#EC4899" }
];

let habits = [];        // [{ id?, name, icon, color, value }]
let lockedToday = false;
let bestScore = 0;
let historyEntries = []; // oldest-first: [{ entry_date, avg_score, ... }]

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const habitList = document.getElementById("habitList");

document.getElementById("todayDate").innerText =
  new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// ---------- Summary ----------

function updateSummary() {
  const total = habits.reduce((a, b) => a + b.value, 0);
  const avg = habits.length ? total / habits.length : 0;

  document.getElementById("averageScore").innerText = avg.toFixed(1) + "/10";
  document.getElementById("averagePercent").innerText = Math.round(avg * 10) + "%";
  document.getElementById("bestScore").innerText = Math.max(avg, bestScore).toFixed(1) + "/10";
}

// ---------- Habit cards ----------

function createHabits() {
  habitList.innerHTML = "";

  habits.forEach((habit) => {
    const card = document.createElement("div");
    card.className = "habit-card" + (lockedToday ? " locked" : "");
    card.style.setProperty("--accent", habit.color);

    card.innerHTML = `
      <div class="habit-top">
        <div class="left">
          <div class="badge" style="background:${habit.color}22;border:2px solid ${habit.color};color:${habit.color};">
            ${habit.icon}
          </div>
          <div class="name">${habit.name} ${lockedToday ? '<span class="lock-icon">🔒</span>' : ''}</div>
        </div>
        <div class="score" style="color:${habit.color};">${habit.value}<span>/10</span></div>
      </div>
      <input type="range" min="0" max="10" value="${habit.value}" class="slider">
    `;

    const slider = card.querySelector(".slider");
    slider.disabled = lockedToday;
    slider.style.accentColor = habit.color;

    const dotLayers = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      .map(p => `radial-gradient(circle, #ffffffcc 2px, transparent 2.5px) ${p}% center/6px 6px no-repeat`)
      .join(', ');

    slider.style.background =
      `${dotLayers}, linear-gradient(to right, ${habit.color} 0%, ${habit.color} ${habit.value * 10}%, #222C43 ${habit.value * 10}%, #222C43 100%)`;

    slider.oninput = () => {
      habit.value = Number(slider.value);
      updateSummary();
      createHabits();
    };

    habitList.appendChild(card);
  });
}

// ---------- Load today's state from the backend ----------

async function loadHabits() {
  try {
    const habitDefs = await api.get("/standards/habits");
    const todayData = await api.get("/standards/today"); // { entry, best }

    bestScore = Number(todayData.best) || 0;

    const baseDefs = (habitDefs && habitDefs.length) ? habitDefs : defaultHabits;

    if (todayData.entry) {
      const valueByName = {};
      todayData.entry.habits.forEach(h => { valueByName[h.name] = h.value; });

      habits = baseDefs.map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        value: valueByName[h.name] !== undefined ? valueByName[h.name] : 0
      }));
      lockedToday = !!todayData.entry.locked;
    } else {
      habits = baseDefs.map(h => ({ id: h.id, name: h.name, icon: h.icon, color: h.color, value: 0 }));
      lockedToday = false;
    }

    createHabits();
    updateSummary();
    refreshSaveButton();
    await loadHistory();
  } catch (err) {
    showToast(err.message, "error");
    habits = defaultHabits.map(h => ({ ...h, value: 0 }));
    createHabits();
    updateSummary();
  }
}

// ---------- Save ----------

const saveBtn = document.getElementById("saveHabitsBtn");

function refreshSaveButton() {
  if (lockedToday) {
    saveBtn.textContent = "✅ Saved for Today";
    saveBtn.disabled = true;
    saveBtn.classList.add("saved");
  } else {
    saveBtn.textContent = "💾 Save Today's Ratings";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
  }
}

async function saveHabits() {
  try {
    const { entry, best } = await api.post("/standards", { habits, locked: true });
    lockedToday = !!entry.locked;
    bestScore = Number(best) || 0;

    createHabits();
    updateSummary();
    refreshSaveButton();
    await loadHistory();
    showToast("Today's ratings saved", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

saveBtn.addEventListener("click", () => {
  if (lockedToday) return;
  if (!confirm("Once saved, you can't change today's ratings. Continue?")) return;
  saveHabits();
});

// ---------- History / streak (from the backend, not localStorage) ----------

function computeStreak(entriesDescending) {
  const dates = new Set(entriesDescending.map(e => e.entry_date));
  let streak = 0;
  let d = new Date();

  if (!dates.has(getTodayKey())) d.setDate(d.getDate() - 1);

  while (true) {
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function renderHistoryBars(entriesOldestFirst) {
  const bars = document.getElementById("historyBars");
  if (!bars) return;

  const last7 = entriesOldestFirst.slice(-7);
  bars.innerHTML = "";

  last7.forEach(day => {
    const [yy, mm, dd] = day.entry_date.split('-').map(Number);
    const label = new Date(yy, mm - 1, dd).toLocaleDateString("en-US", { weekday: "short" });
    const isToday = day.entry_date === getTodayKey();
    const score = Number(day.avg_score);

    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar${isToday ? " today" : ""}" style="height:${Math.max(score * 10, 4)}%"></div>
      <div class="bar-val">${score.toFixed(1)}</div>
      <div class="bar-label">${label}</div>
    `;
    bars.appendChild(col);
  });
}

function renderFullHistory(entriesOldestFirst) {
  const historyListEl = document.getElementById("historyList");
  if (entriesOldestFirst.length === 0) {
    historyListEl.innerHTML = `<div class="history-empty">No history yet — save your first day to see it here.</div>`;
    return;
  }

  const newestFirst = [...entriesOldestFirst].reverse();
  historyListEl.innerHTML = newestFirst.map(day => {
    const [yy, mm, dd] = day.entry_date.split('-').map(Number);
    const d = new Date(yy, mm - 1, dd);
    const dateLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const score = Number(day.avg_score);
    const color = score >= 8 ? "#22C55E" : score >= 5 ? "#EAB308" : "#EF4444";
    return `
      <div class="history-row">
        <span class="h-date">${dateLabel}<span class="h-day">${dayLabel}</span></span>
        <span class="h-score" style="color:${color}">${score.toFixed(1)}/10</span>
      </div>`;
  }).join('');
}

async function loadHistory() {
  try {
    const entriesDescending = await api.get("/standards?limit=60"); // most-recent-first
    historyEntries = [...entriesDescending].reverse(); // oldest-first

    document.getElementById("currentStreak").innerText = computeStreak(entriesDescending);
    renderHistoryBars(historyEntries);
  } catch (err) {
    // History is supplementary — don't block the page over it.
    console.error(err);
  }
}

document.getElementById("viewAllHistoryBtn").addEventListener("click", () => {
  renderFullHistory(historyEntries);
  historyModal.style.display = "flex";
});

// =======================================
// Manage Habits modal
// =======================================

const modal = document.getElementById("habitModal");
const editor = document.getElementById("habitEditor");
const addHabitForm = document.getElementById("addHabitForm");

let selectedEmoji = "🙏";
let selectedColor = "#A855F7";

document.getElementById("manageHabitsBtn").addEventListener("click", openManager);

document.getElementById("closeModal").addEventListener("click", () => {
  modal.style.display = "none";
});

function openManager() {
  editor.innerHTML = "";

  habits.forEach((habit, index) => {
    const row = document.createElement("div");
    row.className = "editor-row";
    row.innerHTML = `
      <span>${habit.icon} ${habit.name}</span>
      <button data-index="${index}">🗑️</button>
    `;
    row.querySelector("button").addEventListener("click", () => deleteHabit(index));
    editor.appendChild(row);
  });

  modal.style.display = "flex";
}

async function deleteHabit(index) {
  if (!confirm("Delete this habit?")) return;

  const habit = habits[index];
  try {
    if (habit.id !== undefined) {
      await api.del(`/standards/habits/${habit.id}`);
    }
    habits.splice(index, 1);
    createHabits();
    updateSummary();
    openManager();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("addHabitBtn").addEventListener("click", () => {
  addHabitForm.style.display = addHabitForm.style.display === "none" ? "block" : "none";
});

document.getElementById("saveHabitBtn").addEventListener("click", async () => {
  const name = document.getElementById("habitName").value.trim();
  if (name === "") {
    showToast("Enter a habit name", "error");
    return;
  }

  try {
    await api.post("/standards/habits", { name, icon: selectedEmoji, color: selectedColor });
    await loadHabits();
    document.getElementById("habitName").value = "";
    openManager();
    addHabitForm.style.display = "none";
    showToast("Habit added", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Emoji picker
document.querySelectorAll("#emojiPicker span").forEach((emoji) => {
  emoji.addEventListener("click", () => {
    document.querySelectorAll("#emojiPicker span").forEach(e => e.classList.remove("selected"));
    emoji.classList.add("selected");
    selectedEmoji = emoji.textContent;
  });
});

// Colour picker
document.querySelectorAll("#colorPicker .color").forEach((color) => {
  color.addEventListener("click", () => {
    document.querySelectorAll("#colorPicker .color").forEach(c => c.classList.remove("selected"));
    color.classList.add("selected");
    selectedColor = color.dataset.color;
  });
});

const firstEmoji = document.querySelector("#emojiPicker span");
if (firstEmoji) {
  firstEmoji.classList.add("selected");
  selectedEmoji = firstEmoji.textContent;
}

const firstColor = document.querySelector("#colorPicker .color");
if (firstColor) {
  firstColor.classList.add("selected");
  selectedColor = firstColor.dataset.color;
}

// Close modals when clicking outside
const historyModal = document.getElementById("historyModal");

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
  if (e.target === historyModal) historyModal.style.display = "none";
});

document.getElementById("closeHistoryModal").addEventListener("click", () => {
  historyModal.style.display = "none";
});

// ---------- Start ----------

loadHabits();
