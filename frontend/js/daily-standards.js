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
