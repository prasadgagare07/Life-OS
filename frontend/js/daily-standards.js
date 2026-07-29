const habits = [
  { name: "Naam Jap", icon: "🙏", color: "#A855F7", value: 9 },
  { name: "Meditation", icon: "🧘", color: "#3B82F6", value: 8 },
  { name: "Yoga + Manifestation", icon: "🌅", color: "#14B8A6", value: 10 },
  { name: "Sleep Schedule", icon: "🌙", color: "#6366F1", value: 9 },
  { name: "Screen Glasses", icon: "👓", color: "#06B6D4", value: 7 },
  { name: "Hair, Face Care & Hygiene", icon: "✨", color: "#22C55E", value: 10 },
  { name: "Read 20 Pages", icon: "📖", color: "#F97316", value: 8 },
  { name: "Phone Discipline", icon: "📱", color: "#EF4444", value: 6 },
  { name: "English Speaking (10 min)", icon: "🗣️", color: "#EAB308", value: 7 },
  { name: "Daily Review", icon: "📝", color: "#EC4899", value: 9 }
];

const list = document.getElementById("habitList");

function updateSummary() {
  const total = habits.reduce((a, b) => a + b.value, 0);
  const avg = total / habits.length;

  document.getElementById("averageScore").innerText = avg.toFixed(1) + "/10";
  document.getElementById("averagePercent").innerText =
    Math.round(avg * 10) + "%";

  document.getElementById("bestScore").innerText =
    Math.max(...habits.map(h => h.value)) + "/10";
}

function createHabits() {

  list.innerHTML = "";

  habits.forEach((habit, index) => {

    const card = document

    // ===== Manage Habits Popup =====

const modal = document.getElementById("habitModal");
const editor = document.getElementById("habitEditor");

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
            <button onclick="deleteHabit(${index})">🗑️</button>
        `;

        editor.appendChild(row);

    });

    modal.style.display = "flex";
}
// Delete Habit
window.deleteHabit = function(index) {

    if (!confirm("Delete this habit?")) return;

    habits.splice(index, 1);

    createHabits();

    updateSummary();

    openManager();

};

  const addHabitForm = document.getElementById("addHabitForm");

document.getElementById("addHabitBtn").addEventListener("click", () => {

    addHabitForm.style.display =
        addHabitForm.style.display === "none" ? "block" : "none";

});

document.getElementById("saveHabitBtn").addEventListener("click", () => {

    const name = document.getElementById("habitName").value.trim();
    const icon = selectedEmoji;
    const color = selectedColor;

    if (!name || !icon) {
        alert("Please enter both a habit name and an emoji.");
        return;
    }

    habits.push({
        name,
        icon,
        color,
        value: 5
    });

    createHabits();
    updateSummary();
    openManager();

    document.getElementById("habitName").value = "";
    document.getElementById("habitIcon").value = "";
    document.getElementById("habitColor").value = "#7C5CFF";

    addHabitForm.style.display = "none";

});

  // ===== Emoji Picker =====

let selectedEmoji = "⭐";

document.querySelectorAll("#emojiPicker span").forEach((emoji) => {

    emoji.addEventListener("click", () => {

        document
            .querySelectorAll("#emojiPicker span")
            .forEach(e => e.classList.remove("selected"));

        emoji.classList.add("selected");

        selectedEmoji = emoji.textContent;

        document.getElementById("habitIcon").value = selectedEmoji;

    });

});
// ===== Colour Picker =====

let selectedColor = "#A855F7";

document.querySelectorAll("#colorPicker .color").forEach((color) => {

    color.addEventListener("click", () => {

        document
            .querySelectorAll("#colorPicker .color")
            .forEach(c => c.classList.remove("selected"));

        color.classList.add("selected");

        selectedColor = color.dataset.color;

        document.getElementById("habitColor").value = selectedColor;

    });

});
