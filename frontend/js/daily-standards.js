// =======================================
// LifeOS Daily Standards
// Part 1
// =======================================

const API_BASE = "/api/standards";

function authHeaders(){
  const token = localStorage.getItem("lifeos_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
}

const defaultHabits = [
{ name:"Naam Jap", icon:"🙏", color:"#A855F7", value:9 },
{ name:"Meditation", icon:"🧘", color:"#3B82F6", value:8 },
{ name:"Yoga + Manifestation", icon:"🌅", color:"#14B8A6", value:10 },
{ name:"Sleep Schedule", icon:"🌙", color:"#6366F1", value:9 },
{ name:"Screen Glasses", icon:"👓", color:"#06B6D4", value:7 },
{ name:"Hair, Face Care & Hygiene", icon:"✨", color:"#22C55E", value:10 },
{ name:"Read 20 Pages", icon:"📖", color:"#F97316", value:8 },
{ name:"Phone Discipline", icon:"📱", color:"#EF4444", value:6 },
{ name:"English Speaking (10 min)", icon:"🗣️", color:"#EAB308", value:7 },
{ name:"Daily Review", icon:"📝", color:"#EC4899", value:9 }
];

let habits =
JSON.parse(localStorage.getItem("lifeos_habits"))
|| defaultHabits;

// --- Daily lock: once saved, sliders are frozen until the next day (12:00 AM–11:59 PM) ---
function getTodayKey(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

const todayKey = getTodayKey();
const storedDate = localStorage.getItem("lifeos_habits_date");

let locked = localStorage.getItem("lifeos_habits_locked") === "true";

if (storedDate !== todayKey) {
  habits = habits.map(h => ({ ...h, value: 0 }));
  locked = false;
  localStorage.setItem("lifeos_habits_date", todayKey);
  localStorage.setItem("lifeos_habits_locked", "false");
  localStorage.setItem("lifeos_habits", JSON.stringify(habits));
}

function isLockedToday(){
  return locked;
}

const habitList =
document.getElementById("habitList");

const today =
new Date();

document.getElementById("todayDate").innerText =
today.toLocaleDateString("en-GB",{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
});

function saveHabitsLocal(){

localStorage.setItem(
"lifeos_habits",
JSON.stringify(habits)
);

}

function updateSummary(){

const total =
habits.reduce((a,b)=>a+b.value,0);

const avg =
total / habits.length;

document.getElementById("averageScore").innerText =
avg.toFixed(1)+"/10";

document.getElementById("averagePercent").innerText =
Math.round(avg*10)+"%";

const storedBest =
Number(localStorage.getItem("lifeos_best_score")) || 0;

const bestScore =
Math.max(avg, storedBest);

localStorage.setItem("lifeos_best_score", bestScore);

document.getElementById("bestScore").innerText =
bestScore.toFixed(1)+"/10";

saveHabitsLocal();

}

function createHabits(){

habitList.innerHTML="";

habits.forEach((habit,index)=>{

const card =
document.createElement("div");

card.className="habit-card"+(isLockedToday()?" locked":"");

card.style.setProperty("--accent",habit.color);

card.innerHTML=`

<div class="habit-top">

<div class="left">

<div class="badge"
style="
background:${habit.color}22;
border:2px solid ${habit.color};
color:${habit.color};
">

${habit.icon}

</div>

<div class="name">

${habit.name} ${isLockedToday() ? '<span class="lock-icon">🔒</span>' : ''}

</div>

</div>

<div class="score"
style="color:${habit.color};">

${habit.value}<span>/10</span>

</div>

</div>

<input
type="range"
min="0"
max="10"
value="${habit.value}"
class="slider">

`;

const slider =
card.querySelector(".slider");

if (isLockedToday()) {
  slider.disabled = true;
}

slider.style.accentColor =
habit.color;
slider.style.background =
`linear-gradient(to right,
${habit.color} 0%,
${habit.color} ${habit.value*10}%,
#222C43 ${habit.value*10}%,
#222C43 100%)`;

slider.oninput = ()=>{

habit.value =
Number(slider.value);

updateSummary();

createHabits();

};

habitList.appendChild(card);

});

}
// =======================================
// Part 2
// Manage Habits
// =======================================

const modal =
document.getElementById("habitModal");

const editor =
document.getElementById("habitEditor");

const addHabitForm =
document.getElementById("addHabitForm");

let selectedEmoji="🙏";
let selectedColor="#A855F7";

document
.getElementById("manageHabitsBtn")
.addEventListener("click",openManager);

document
.getElementById("closeModal")
.addEventListener("click",()=>{

modal.style.display="none";

});

function openManager(){

editor.innerHTML="";

habits.forEach((habit,index)=>{

const row=document.createElement("div");

row.className="editor-row";

row.innerHTML=`

<span>

${habit.icon} ${habit.name}

</span>

<button
onclick="deleteHabit(${index})">

🗑️

</button>

`;

editor.appendChild(row);

});

modal.style.display="flex";

}

window.deleteHabit=function(index){

if(!confirm("Delete this habit?")) return;

habits.splice(index,1);

saveHabitsLocal();

createHabits();

updateSummary();

openManager();

};

document
.getElementById("addHabitBtn")
.addEventListener("click",()=>{

addHabitForm.style.display=

addHabitForm.style.display==="none"

?

"block"

:

"none";

});

document
.getElementById("saveHabitBtn")
.addEventListener("click",()=>{

const name=

document
.getElementById("habitName")
.value
.trim();

if(name===""){

alert("Enter habit name");

return;

}

habits.push({

name:name,

icon:selectedEmoji,

color:selectedColor,

value:5

});

document
.getElementById("habitName")
.value="";

saveHabitsLocal();

createHabits();

updateSummary();

openManager();

addHabitForm.style.display="none";

});
// =======================================
// Part 3
// Emoji Picker
// Colour Picker
// Start App
// =======================================

// Emoji Picker
document.querySelectorAll("#emojiPicker span").forEach((emoji)=>{

emoji.addEventListener("click",()=>{

document
.querySelectorAll("#emojiPicker span")
.forEach(e=>e.classList.remove("selected"));

emoji.classList.add("selected");

selectedEmoji=emoji.textContent;

});

});

// Colour Picker
document.querySelectorAll("#colorPicker .color").forEach((color)=>{

color.addEventListener("click",()=>{

document
.querySelectorAll("#colorPicker .color")
.forEach(c=>c.classList.remove("selected"));

color.classList.add("selected");

selectedColor=color.dataset.color;

});

});

// Select defaults
const firstEmoji=document.querySelector("#emojiPicker span");
if(firstEmoji){
firstEmoji.classList.add("selected");
selectedEmoji=firstEmoji.textContent;
}

const firstColor=document.querySelector("#colorPicker .color");
if(firstColor){
firstColor.classList.add("selected");
selectedColor=firstColor.dataset.color;
}

// Close modal when clicking outside
window.addEventListener("click",(e)=>{

if(e.target===modal){

modal.style.display="none";

}

});

// --- Save button ---
const saveBtn = document.getElementById("saveHabitsBtn");

function refreshSaveButton(){
  if (isLockedToday()) {
    saveBtn.textContent = "✅ Saved for Today";
    saveBtn.disabled = true;
    saveBtn.classList.add("saved");
  } else {
    saveBtn.textContent = "💾 Save Today's Ratings";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
  }
}

// --- History (last 30 days, local fallback) + real streak ---
function getHistory(){
  return JSON.parse(localStorage.getItem("lifeos_history")) || [];
}

function saveTodayToHistoryLocal(){
  const history = getHistory();
  const key = getTodayKey();
  const total = habits.reduce((a,b)=>a+b.value,0);
  const avg = total / habits.length;

  const existing = history.find(h => h.date === key);
  if (existing) {
    existing.avg = avg;
  } else {
    history.push({ date: key, avg: avg });
  }

  const trimmed = history.slice(-30);
  localStorage.setItem("lifeos_history", JSON.stringify(trimmed));
}

function computeStreak(){
  const history = getHistory();
  const dates = new Set(history.map(h => h.date));
  let streak = 0;
  let d = new Date();

  if (!dates.has(getTodayKey())) {
    d.setDate(d.getDate()-1);
  }

  while (true) {
    const key = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate()-1);
    } else {
      break;
    }
  }

  return streak;
}

function refreshStreak(){
  const streakEl = document.getElementById("currentStreak");
  if (streakEl) streakEl.innerText = computeStreak();
}

function renderHistory(){
  const bars = document.getElementById("historyBars");
  if (!bars) return;

  const last7 = getHistory().slice(-7);
  bars.innerHTML = "";

  last7.forEach(day => {
    const label = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
    const isToday = day.date === getTodayKey();

    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar${isToday ? " today" : ""}" style="height:${Math.max(day.avg*10,4)}%"></div>
      <div class="bar-val">${day.avg.toFixed(1)}</div>
      <div class="bar-label">${label}</div>
    `;
    bars.appendChild(col);
  });
}

// --- Backend sync ---
async function loadTodayFromServer(){
  try {
    const res = await fetch(`${API_BASE}/today`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();

    if (data.entry) {
      habits = data.entry.habits;
      locked = !!data.entry.locked;
      localStorage.setItem("lifeos_habits", JSON.stringify(habits));
      localStorage.setItem("lifeos_habits_locked", locked ? "true" : "false");
    }

    if (typeof data.best === "number") {
      const storedBest = Number(localStorage.getItem("lifeos_best_score")) || 0;
      localStorage.setItem("lifeos_best_score", Math.max(data.best, storedBest));
    }

    createHabits();
    updateSummary();
    refreshSaveButton();
  } catch (err) {
    console.warn("Could not reach server, using local data:", err);
  }
}

async function loadHistoryFromServer(){
  try {
    const res = await fetch(`${API_BASE}?limit=7`, { headers: authHeaders() });
    if (!res.ok) return;
    const entries = await res.json();

    const ascending = entries.slice().reverse();
    localStorage.setItem("lifeos_history", JSON.stringify(
      ascending.map(e => ({ date: e.entry_date, avg: Number(e.avg_score) }))
    ));

    renderHistory();
    refreshStreak();
  } catch (err) {
    console.warn("Could not load history from server:", err);
  }
}

saveBtn.addEventListener("click", async () => {
  if (isLockedToday()) return;
  if (!confirm("Once saved, you can't change today's ratings. Continue?")) return;

  locked = true;
  localStorage.setItem("lifeos_habits_locked", "true");
  saveHabitsLocal();
  saveTodayToHistoryLocal();

  createHabits();
  refreshSaveButton();
  refreshStreak();
  renderHistory();

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ habits, locked: true })
    });

    if (res.ok) {
      const data = await res.json();
      const storedBest = Number(localStorage.getItem("lifeos_best_score")) || 0;
      const best = Math.max(data.best, storedBest);
      localStorage.setItem("lifeos_best_score", best);
      document.getElementById("bestScore").innerText = best.toFixed(1)+"/10";
      await loadHistoryFromServer();
    }
  } catch (err) {
    console.warn("Saved locally, but could not sync to server:", err);
  }
});

// Initialise page (instant local render, then sync with server)
createHabits();
updateSummary();
refreshSaveButton();
refreshStreak();
renderHistory();

loadTodayFromServer();
loadHistoryFromServer();
