// =======================================
// LifeOS Daily Standards
// Part 1
// =======================================

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

function saveHabits(){

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

document.getElementById("bestScore").innerText =
Math.max(...habits.map(h=>h.value))+"/10";

saveHabits();

}

function createHabits(){

habitList.innerHTML="";

habits.forEach((habit,index)=>{

const card =
document.createElement("div");

card.className="habit-card";

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

${habit.name}

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

slider.style.accentColor =
habit.color;

slider.style.background =
`radial-gradient(circle, #ffffff80 2px, transparent 2.5px) left center/10% 100% repeat-x,
linear-gradient(to right,
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

saveHabits();

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

saveHabits();

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

// Initialise page
createHabits();
updateSummary();
