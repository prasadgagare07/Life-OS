// ===============================
// LifeOS Finance
// Part 1
// ===============================

const FINANCE_GOAL = 5000000;

const FINANCE_THOUGHTS = [
"₹2,000/day = ₹60,000/month.",
"₹1,000/day = ₹30,000/month.",
"Small savings become big wealth.",
"Assets make money. Liabilities cost money.",
"Every rupee should have a purpose.",
"Consistency builds wealth.",
"Invest first. Spend later.",
"Money follows value.",
"Skills create income.",
"Wealth grows patiently."
];

let hideSavings=
JSON.parse(localStorage.getItem("hideSavings")) ?? true;

let timelineExpanded=false;
let lastTimelineEntries=[];

const FINANCE_LOCK_KEY="financeLastSavedDate";

function getLocalDateKey(){

const d=new Date();

return d.getFullYear()+"-"+
String(d.getMonth()+1).padStart(2,"0")+"-"+
String(d.getDate()).padStart(2,"0");

}

function isFinanceLockedToday(){

return localStorage.getItem(FINANCE_LOCK_KEY)===getLocalDateKey();

}

function lockFinanceForm(){

const form=document.getElementById("finance-form");

const msg=document.getElementById("financeLockMessage");

if(!form) return;

form.querySelectorAll("input").forEach(input=>{

input.disabled=true;

});

const btn=form.querySelector(".save-btn");

if(btn) btn.disabled=true;

if(msg) msg.classList.remove("hidden");

}

function unlockFinanceForm(){

const form=document.getElementById("finance-form");

const msg=document.getElementById("financeLockMessage");

if(!form) return;

form.querySelectorAll("input").forEach(input=>{

input.disabled=false;

});

const btn=form.querySelector(".save-btn");

if(btn) btn.disabled=false;

if(msg) msg.classList.add("hidden");

}

setInterval(()=>{

if(!isFinanceLockedToday()){

unlockFinanceForm();

}

},60000);

let hideGrowth=
JSON.parse(localStorage.getItem("hideGrowth")) ?? true;

let hideEmergency=
JSON.parse(localStorage.getItem("hideEmergency")) ?? true;

let goals = [];

function saveGoals() {
  return;
}
function renderGoals(){

const list=document.getElementById("goalList");

if(!list) return;

const wealth=
(Number(document.getElementById("wealthAmount")?.textContent.replace(/[₹,]/g,""))||0);

const totalGoals=
goals.reduce((sum,g)=>sum+Number(g.target),0);

list.innerHTML=goals.map((goal,index)=>{

const progress=
totalGoals>0
?Math.min(100,(wealth/totalGoals)*100)
:0;

const saved=
Math.round((progress/100)*goal.target);

const completed=saved>=goal.target;

return `

<div class="goal-item">

<div class="goal-left">

<h4>
${goal.name}
${completed?'<span class="goal-complete">✅</span>':''}
</h4>

<p>
${formatINR(saved)}
 /
${formatINR(goal.target)}
</p>

<div class="goal-progress">

<div
class="goal-progress-fill"
style="width:${progress}%">
</div>

</div>

</div>

<div class="goal-right">

<button onclick="editGoal(${index})">✏️</button>

<button onclick="deleteGoal(${index})">🗑</button>

</div>

</div>

`;

}).join("");

}



function showCelebration(message){

const modal=document.getElementById("celebrationModal");

const text=document.getElementById("celebrationText");

if(!modal || !text) return;

text.textContent=message;

modal.classList.remove("hidden");

setTimeout(()=>{

modal.classList.add("hidden");

},4000);

}
window.editGoal=function(index){

const goal=goals[index];

document.getElementById("goalNameInput").value=goal.name;

document.getElementById("goalAmountInput").value=goal.target;

goalModal.classList.remove("hidden");

document.getElementById("saveGoalBtn").onclick=function(){

const name=document.getElementById("goalNameInput").value.trim();

const amount=Number(document.getElementById("goalAmountInput").value);

if(name===""){

alert("Enter goal name");

return;

}

if(amount<=0){

alert("Enter valid amount");

return;

}

goals[index]={

name,

target:amount

};

saveGoals();

renderGoals();

goalModal.classList.add("hidden");

};

};

async function saveWealthHistory(snapshot){

const wealth=
Number(snapshot.bank_balance||0)+
Number(snapshot.market_funds||0)+
Number(snapshot.emergency_fund||0);

const today=new Date().toISOString().split("T")[0];

const lastDate=localStorage.getItem("wealthHistoryDate");

if(lastDate===today) return;

localStorage.setItem("wealthHistoryDate",today);

try{

await api.post("/finance/history",{

date:today,

wealth

});

}catch(e){

console.log(e);

}

}

async function loadFinance(){

try{

const snapshot=await api.get("/finance");

document.getElementById("bank_balance").value=snapshot.bank_balance;

document.getElementById("market_funds").value=snapshot.market_funds;

document.getElementById("emergency_fund").value=snapshot.emergency_fund;

document.getElementById("goal_amount").value=snapshot.goal_amount;

if(isFinanceLockedToday()){

lockFinanceForm();

}

renderSummary(snapshot);

await saveWealthHistory(snapshot);

const timeline = await api.get("/finance/timeline?limit=730");

lastTimelineEntries = timeline;

const stats = await api.get("/finance/statistics");

renderTimeline(timeline);

renderWealthCalendar(timeline);
renderWealthChart(timeline);
renderDailyChange(timeline);
goals = await api.get("/finance/goals");
renderGoals();

renderStatistics(stats);

}catch(err){

showToast(err.message,"error");

}

}

function renderSummary(snapshot){

const savings=Number(snapshot.bank_balance)||0;

const growth=Number(snapshot.market_funds)||0;

const emergency=Number(snapshot.emergency_fund)||0;
 
const wealth =
  savings +
  growth +
  emergency;
document.getElementById("savingAmount").textContent =
hideSavings ? "••••••" : formatINR(savings);

document.getElementById("growthAmount").textContent =
hideGrowth ? "••••••" : formatINR(growth);

document.getElementById("emergencyAmount").textContent =
hideEmergency ? "••••••" : formatINR(emergency);


animateValue(
document.getElementById("wealthAmount"),
0,
wealth,
800
);
renderWealthLevel(wealth);

renderAssetChart(
savings,
growth,
emergency
);

renderBreakdown(
savings,
growth,
emergency
);

const freedom = Number(snapshot.goal_amount) || 0;

const goal = 5000000;
   
renderHealthScore(
  savings,
  growth,
  emergency,
  goal
);
  
document.getElementById("freedomFund").textContent=formatINR(freedom);

const percent =
Math.min(100, (freedom / goal) * 100);

document.getElementById("goalPercent").textContent=Math.round(percent)+"%";


const goalText=document.getElementById("goalCaption");

if(goalText){

if(percent>=100){

goalText.textContent="🎉 Financial Freedom Achieved!";

}else if(percent>=75){

goalText.textContent="🚀 Almost there! Keep going.";

}else if(percent>=50){

goalText.textContent="💪 Halfway to Financial Freedom.";

}else if(percent>=25){

goalText.textContent="📈 Great progress. Stay consistent.";

}else{

goalText.textContent="🌱 Every rupee invested builds your future.";

}

}
animateProgressBar(percent);

renderGoalRing(percent);

drawGoalRing(percent);

const today=new Date();

const target=new Date("2027-03-30");

const days=Math.max(0,Math.ceil((target-today)/86400000));

document.getElementById("daysRemaining").textContent=days;

const remaining = Math.max(0, goal - freedom);

document.getElementById("remainingAmount").textContent = formatINR(remaining);

document.getElementById("perDayNeed").textContent =
formatINR(Math.ceil(remaining / Math.max(days,1)));

document.getElementById("financeThought").textContent=

FINANCE_THOUGHTS[today.getDate()%FINANCE_THOUGHTS.length];

const hour = new Date().getHours();

if(hour < 12){

document.getElementById("financeThought").textContent +=
" ☀️ Good morning! Build wealth today.";

}else if(hour < 18){

document.getElementById("financeThought").textContent +=
" 💼 Keep investing in your future.";

}else{

document.getElementById("financeThought").textContent +=
" 🌙 Review today's financial progress.";

}

renderMilestones(freedom);

if(typeof renderStatistics==="function"){

api.get("/finance/statistics")

.then(renderStatistics)

.catch(()=>{});

}

document.getElementById("toggleSavings").textContent=
hideSavings ? "👁" : "🙈";

document.getElementById("toggleGrowth").textContent=
hideGrowth ? "👁" : "🙈";

document.getElementById("toggleEmergency").textContent=
hideEmergency ? "👁" : "🙈";

}
function renderGoalRing(percent){

const canvas=document.getElementById("goalRing");

if(!canvas) return;

const ctx=canvas.getContext("2d");

const size=canvas.width;

const r=70;

let current=0;

function draw(){

ctx.clearRect(0,0,size,size);

ctx.lineWidth=12;

ctx.strokeStyle="#1E293B";

ctx.beginPath();

ctx.arc(size/2,size/2,r,0,Math.PI*2);

ctx.stroke();

ctx.strokeStyle="#10B981";

ctx.beginPath();

ctx.arc(
size/2,
size/2,
r,
-Math.PI/2,
(-Math.PI/2)+(Math.PI*2*(current/100))
);

ctx.stroke();

if(current<percent){

current+=1;

requestAnimationFrame(draw);

}

}

draw();

}

function drawGoalRing(percent){

const canvas=document.getElementById("goalRing");

if(!canvas) return;

const ctx=canvas.getContext("2d");

const w=canvas.width;
const h=canvas.height;

const cx=w/2;
const cy=h/2;

const r=75;

ctx.clearRect(0,0,w,h);

// Background Ring
ctx.beginPath();
ctx.arc(cx,cy,r,0,Math.PI*2);
ctx.lineWidth=14;
ctx.strokeStyle="#1E293B";
ctx.stroke();

// Progress Ring
ctx.beginPath();
ctx.arc(
cx,
cy,
r,
-Math.PI/2,
(-Math.PI/2)+(Math.PI*2*(percent/100))
);

ctx.lineWidth=14;
ctx.lineCap="round";

const gradient=ctx.createLinearGradient(0,0,w,0);
gradient.addColorStop(0,"#10B981");
gradient.addColorStop(1,"#34D399");

ctx.strokeStyle=gradient;
ctx.stroke();

}
// ===============================
// Part 2
// Milestones + Wealth Calendar
// ===============================

function renderMilestones(freedom){

const levels=[
100000,
500000,
1000000,
1500000,
2000000,
2500000,
3000000,
3500000,
4000000,
4500000,
5000000
];

const box=document.getElementById("milestones");

if(!box) return;

box.innerHTML=levels.map(level=>{

const done=freedom>=level;

const key="milestone_"+level;

if(done && !localStorage.getItem(key)){

showCelebration(
`🎉 Congratulations!\nFreedom Fund reached ${formatINR(level)}`
);

localStorage.setItem(key,"true");

}

return `

<div class="milestone ${done?"done":""}">

<div class="dot">

${done?"✓":""}

</div>

<span>${formatINR(level)}</span>

</div>

`;

}).join("");

}

let calendarViewDate=new Date();

function renderWealthCalendar(entries){

const cal=document.getElementById("wealthCalendar");

const label=document.getElementById("calMonthLabel");

if(!cal) return;

const byDate={};

(entries||[]).forEach(e=>{

const key=new Date(e.recorded_on).toISOString().split("T")[0];

byDate[key]=Number(e.total_wealth);

});

const sortedKeys=Object.keys(byDate).sort();

const year=calendarViewDate.getFullYear();

const month=calendarViewDate.getMonth();

if(label){

label.textContent=calendarViewDate.toLocaleDateString("en-IN",{

month:"long",

year:"numeric"

});

}

const firstOfMonth=new Date(year,month,1);

const daysInMonth=new Date(year,month+1,0).getDate();

let startOffset=firstOfMonth.getDay()-1;

if(startOffset<0) startOffset=6;

const cells=[];

for(let i=0;i<startOffset;i++){

cells.push(`<div class="calendar-day empty"></div>`);

}

for(let day=1;day<=daysInMonth;day++){

const dateObj=new Date(year,month,day);

const key=dateObj.toISOString().split("T")[0];

const isToday=dateObj.toDateString()===new Date().toDateString();

if(byDate[key]===undefined){

cells.push(`<div class="calendar-day empty ${isToday?"today":""}">${day}</div>`);

continue;

}

const idx=sortedKeys.indexOf(key);

let status="neutral";

if(idx>0){

const prevVal=byDate[sortedKeys[idx-1]];

const curVal=byDate[key];

if(curVal>prevVal){

status="up";

}else if(curVal<prevVal){

status="down";

}

}

const fullDate=dateObj.toLocaleDateString("en-IN",{

day:"numeric",

month:"long",

year:"numeric"

});

cells.push(`

<div

class="calendar-day ${status} ${isToday?"today":""}"

title="${fullDate}: ${formatINR(byDate[key])}"

>

${day}

</div>

`);

}

cal.innerHTML=cells.join("");

}

function updateViewAllBtn(btnId,total,expanded){

const btn=document.getElementById(btnId);

if(!btn) return;

if(total<=7){

btn.style.display="none";

return;

}

btn.style.display="inline-flex";

btn.textContent=expanded?"Show Less":"View All";

}
// ===============================
// Part 3
// Timeline + Statistics
// ===============================

function renderTimeline(entries){

const el=document.getElementById("timeline-list");

if(!el) return;

if(!entries || entries.length===0){

el.innerHTML=`
<div class="empty-state">
📈 No history yet
</div>
`;

document.getElementById("highestWealth").textContent="₹0";
document.getElementById("monthlyGrowth").textContent="₹0";
document.getElementById("bestDay").textContent="₹0";
document.getElementById("bestDate").textContent="--";

updateViewAllBtn("timelineViewAllBtn",0,timelineExpanded);

return;

}

const history=entries.slice().reverse();

const highest=Math.max(...history.map(e=>Number(e.total_wealth)));

const first=Number(history[0].total_wealth);

const last=Number(history[history.length-1].total_wealth);

const growth=last-first;

const best=history.reduce((a,b)=>
Number(a.total_wealth)>Number(b.total_wealth)?a:b
);

document.getElementById("highestWealth").textContent=
formatINR(highest);

document.getElementById("monthlyGrowth").textContent=formatINR(highest);

document.getElementById("monthlyGrowth").textContent=
formatINR(growth);

document.getElementById("bestDay").textContent=
formatINR(best.total_wealth);

document.getElementById("bestDate").textContent=
new Date(best.recorded_on).toLocaleDateString(
"en-IN",
{
day:"numeric",
month:"long",
year:"numeric"
}
);

const max=Math.max(...history.map(e=>Number(e.total_wealth)));

const rows=history.map(item=>`

<div class="timeline-row">

<div class="timeline-date">

${new Date(item.recorded_on).toLocaleDateString(
"en-IN",
{
day:"numeric",
month:"short"
}
)}

</div>

<div class="timeline-bar-track">

<div
class="timeline-bar"
style="width:${max?(Number(item.total_wealth)/max)*100:0}%">

</div>

</div>

<div class="numeric">

${formatINR(item.total_wealth)}

</div>

</div>

`);

const visible=timelineExpanded?rows:rows.slice(0,7);

el.innerHTML=visible.join("");

updateViewAllBtn("timelineViewAllBtn",rows.length,timelineExpanded);

}

function renderStatistics(stats){

if(!stats) return;

const growthEl=document.getElementById("monthlyGrowth");

if(growthEl){

growthEl.textContent=formatINR(stats.monthlyGrowth);

growthEl.style.color=
stats.monthlyGrowth>0
?"#22C55E"
:stats.monthlyGrowth<0
?"#EF4444"
:"#FFFFFF";

}

const highestEl=document.getElementById("highestWealth");

if(highestEl) highestEl.textContent=formatINR(stats.highestWealth);

const bestDayEl=document.getElementById("bestDay");

if(bestDayEl) bestDayEl.textContent=formatINR(stats.bestDay);

const bestDateEl=document.getElementById("bestDate");

if(bestDateEl){

bestDateEl.textContent=
stats.bestDate
?new Date(stats.bestDate).toLocaleDateString(
"en-IN",
{
day:"numeric",
month:"short",
year:"numeric"
}
)
:"--";

}

const wealthDaysEl=document.getElementById("wealthDays");

if(wealthDaysEl) wealthDaysEl.textContent = `${stats.wealthDays} Days`;

const avgEl=document.getElementById("averageGrowth");

if(avgEl){

avgEl.textContent=formatINR(stats.averageGrowth);

avgEl.style.color=
stats.averageGrowth>0
?"#22C55E"
:stats.averageGrowth<0
?"#EF4444"
:"#FFFFFF";

}

}
function renderWealthLevel(wealth){

const el=document.getElementById("wealthLevel");

if(!el) return;

if(wealth>=5000000){

el.textContent="👑 Financial Freedom";

}else if(wealth>=2500000){

el.textContent="💎 Wealth Builder";

}else if(wealth>=1000000){

el.textContent="🚀 Investor";

}else if(wealth>=500000){

el.textContent="🌱 Growing";

}else{

el.textContent="🌿 Beginner";

}

}

function renderAssetChart(savings,growth,emergency){

const canvas=document.getElementById("assetChart");

if(!canvas) return;

const ctx=canvas.getContext("2d");

ctx.clearRect(0,0,300,300);

const total=savings+growth+emergency;

const legend=document.getElementById("assetLegend");

if(total===0){

if(legend) legend.innerHTML="";

return;

}

const colors=["#3B82F6","#10B981","#F59E0B"];

const labels=["Savings","Growth Fund","Emergency Fund"];

const values=[savings,growth,emergency];

let start=-Math.PI/2;

values.forEach((value,index)=>{

const angle=(value/total)*Math.PI*2;

ctx.beginPath();

ctx.moveTo(150,150);

ctx.arc(150,150,110,start,start+angle);

ctx.closePath();

ctx.fillStyle=colors[index];

ctx.fill();

start+=angle;

});

if(legend){

legend.innerHTML=values.map((value,index)=>{

const pct=total?((value/total)*100).toFixed(1):"0.0";

return `

<div class="legend-item">

<span class="legend-dot" style="background:${colors[index]}"></span>

<span class="legend-label">${labels[index]}</span>

<span class="legend-pct">${pct}%</span>

</div>

`;

}).join("");

}

}

function renderBreakdown(savings,growth,emergency){

const total=savings+growth+emergency;

const box=document.getElementById("wealthBreakdown");

if(!box) return;

box.innerHTML=`

<div class="breakdown-row">

<span>💰 Savings</span>

<b>${formatINR(savings)}</b>

</div>

<div class="breakdown-row">

<span>🌱 Growth Fund</span>

<b>${formatINR(growth)}</b>

</div>

<div class="breakdown-row">

<span>🛡 Emergency Fund</span>

<b>${formatINR(emergency)}</b>

</div>

<hr>

<div class="breakdown-row total">

<span>Total</span>

<b>${formatINR(total)}</b>

</div>

`;

}

function renderWealthChart(entries) {

  const canvas = document.getElementById("wealthChart");
  if (!canvas) return;

  canvas.width = 600;
  canvas.height = 250;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (entries.length < 2) return;

  const data = entries.slice().reverse();

  const values = data.map(e => Number(e.total_wealth));

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  const padding = 30;

  ctx.beginPath();

  data.forEach((item, index) => {

    const x = padding + (index * (canvas.width - padding * 2)) / (data.length - 1);

    const y =
      canvas.height -
      padding -
      ((Number(item.total_wealth) - min) / range) *
      (canvas.height - padding * 2);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

  });

  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

data.forEach((item, index) => {

  const x = 30 + (index * (canvas.width - 60)) / (data.length - 1);

  const y =
    canvas.height -
    30 -
    ((Number(item.total_wealth) - min) / range) *
    (canvas.height - 60);

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#10B981";
  ctx.fill();

});
}

function renderHealthScore(savings,growth,emergency,goal){

const scoreEl=document.getElementById("healthScore");

const msg=document.getElementById("healthMessage");

if(!scoreEl || !msg) return;

const wealth=savings+growth+emergency;

const score=Math.min(100,Math.round((wealth/goal)*100));

scoreEl.textContent=score+"%";

if(score>=100){

msg.textContent="🏆 Financial Freedom Achieved";

}else if(score>=80){

msg.textContent="🚀 Excellent financial progress";

}else if(score>=60){

msg.textContent="💪 Strong financial position";

}else if(score>=40){

msg.textContent="📈 Building wealth steadily";

}else if(score>=20){

msg.textContent="🌱 Good start. Keep investing.";

}else{

msg.textContent="💰 Focus on saving consistently.";

}

}

function renderDailyChange(entries){

const el=document.getElementById("dailyChange");

if(!el||entries.length<2) return;

const today=Number(entries[0].total_wealth);

const yesterday=Number(entries[1].total_wealth);

const diff=today-yesterday;

const icon=diff>0?"🟢":diff<0?"🔴":"⚪";

el.textContent=
`${icon} ${diff>=0?"+":""}${formatINR(diff)}`;

}

function animateValue(element,start,end,duration){

if(!element) return;

let startTime=null;

function step(timestamp){

if(!startTime) startTime=timestamp;

const progress=Math.min((timestamp-startTime)/duration,1);

const value=Math.floor(start+(end-start)*progress);

element.textContent=formatINR(value);

if(progress<1){

requestAnimationFrame(step);

}

}

requestAnimationFrame(step);

}
function animateProgressBar(percent){

const bar=document.getElementById("goalBar");

if(!bar) return;

bar.style.width="0%";

requestAnimationFrame(()=>{

bar.style.transition="width 1s ease";

bar.style.width=percent+"%";

});

}
// ==============================
// Part 4
// Save + Refresh + Initialize
// ===============================

document.getElementById("finance-form").addEventListener("submit",async(e)=>{

e.preventDefault();

const payload={

bank_balance:Number(document.getElementById("bank_balance").value)||0,

market_funds:Number(document.getElementById("market_funds").value)||0,

emergency_fund:Number(document.getElementById("emergency_fund").value)||0,

goal_amount:Number(document.getElementById("goal_amount").value)||0

};

try{

const updated=await api.put("/finance",payload);

localStorage.setItem(FINANCE_LOCK_KEY,getLocalDateKey());

lockFinanceForm();

renderSummary(updated);

const timeline = await api.get('/finance/timeline?limit=730');

lastTimelineEntries = timeline;

const stats = await api.get('/finance/statistics');

renderTimeline(timeline);

renderWealthCalendar(timeline);

renderStatistics(stats);

showToast("Finance updated successfully","success");

renderGoals();

renderDailyChange(timeline);

renderWealthCalendar(timeline);

checkCelebration(updated.goal_amount);

showToast("Finance updated successfully","success");

}catch(err){

showToast(err.message,"error");

}

});

function checkCelebration(freedom){

const milestones=[
10000,
25000,
50000,
100000,
200000,
500000,
1000000,
1500000,
2000000,
2500000,
3000000,
3500000,
4000000,
4500000,
5000000
];

const reached=milestones.findLast(v=>freedom>=v);

if(!reached) return;

const key="lifeos_last_milestone";

const last=Number(localStorage.getItem(key)||0);

if(reached<=last) return;

localStorage.setItem(key,reached);

const modal=document.getElementById("celebrationModal");

const text=document.getElementById("celebrationText");

if(modal && text){

text.textContent=`You reached ${formatINR(reached)} in your Freedom Fund!`;

modal.classList.remove("hidden");

setTimeout(()=>{

modal.classList.add("hidden");

},3500);

}

}
document.getElementById("toggleSavings").addEventListener("click",()=>{

hideSavings=!hideSavings;


localStorage.setItem(
"hideSavings",
JSON.stringify(hideSavings)
);
  
renderSummary({
bank_balance:Number(document.getElementById("bank_balance").value)||0,
market_funds:Number(document.getElementById("market_funds").value)||0,
emergency_fund:Number(document.getElementById("emergency_fund").value)||0,
goal_amount:Number(document.getElementById("goal_amount").value)||0
});

});

document.getElementById("toggleGrowth").addEventListener("click",()=>{

hideGrowth=!hideGrowth;

localStorage.setItem(
"hideGrowth",
JSON.stringify(hideGrowth)
);
document.getElementById("toggleGrowth").textContent=
hideGrowth ? "👁" : "🙈";
  
renderSummary({
bank_balance:Number(document.getElementById("bank_balance").value)||0,
market_funds:Number(document.getElementById("market_funds").value)||0,
emergency_fund:Number(document.getElementById("emergency_fund").value)||0,
goal_amount:Number(document.getElementById("goal_amount").value)||0
});

});

document.getElementById("toggleEmergency").addEventListener("click",()=>{

hideEmergency=!hideEmergency;

localStorage.setItem(
"hideEmergency",
JSON.stringify(hideEmergency)
);

document.getElementById("toggleEmergency").textContent=
hideEmergency ? "👁" : "🙈";
  
renderSummary({
bank_balance:Number(document.getElementById("bank_balance").value)||0,
market_funds:Number(document.getElementById("market_funds").value)||0,
emergency_fund:Number(document.getElementById("emergency_fund").value)||0,
goal_amount:Number(document.getElementById("goal_amount").value)||0
});


document.getElementById("toggleSavings").textContent=
hideSavings ? "👁" : "🙈";
  
});

const goalModal=document.getElementById("goalModal");

document.getElementById("addGoalBtn").addEventListener("click",()=>{

document.getElementById("goalNameInput").value="";

document.getElementById("goalAmountInput").value="";

document.getElementById("saveGoalBtn").onclick=null;

goalModal.classList.remove("hidden");

});

document.getElementById("cancelGoalBtn").addEventListener("click",()=>{

goalModal.classList.add("hidden");

}
                                                          
document.getElementById("saveGoalBtn").addEventListener("click", async () => {
const name=document.getElementById("goalNameInput").value.trim();

const amount=Number(document.getElementById("goalAmountInput").value);

if(name===""){

alert("Enter goal name");

return;

}

if(amount<=0){

alert("Enter valid amount");

return;

}

const alreadyExists=goals.some(g=>g.name.trim().toLowerCase()===name.toLowerCase());

if(alreadyExists){

alert("A goal with this name already exists");

return;

}

await api.post("/finance/goals", {
  name,
  target: amount
});

goals = await api.get("/finance/goals");

renderGoals();

goalModal.classList.add("hidden");

});

document.getElementById("calPrevBtn")?.addEventListener("click",()=>{

calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()-1,1);

renderWealthCalendar(lastTimelineEntries);

});

document.getElementById("calNextBtn")?.addEventListener("click",()=>{

calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()+1,1);

renderWealthCalendar(lastTimelineEntries);

});

document.getElementById("timelineViewAllBtn")?.addEventListener("click",()=>{

timelineExpanded=!timelineExpanded;

renderTimeline(lastTimelineEntries);

});

loadFinance();
