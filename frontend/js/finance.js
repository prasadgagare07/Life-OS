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

async function loadFinance(){

try{

const snapshot=await api.get("/finance");

document.getElementById("bank_balance").value=snapshot.bank_balance;

document.getElementById("market_funds").value=snapshot.market_funds;

document.getElementById("emergency_fund").value=snapshot.emergency_fund;

document.getElementById("goal_amount").value=snapshot.goal_amount;

renderSummary(snapshot);

const timeline=await api.get("/finance/timeline?limit=365");

renderTimeline(timeline);

renderWealthCalendar(timeline);

}catch(err){

showToast(err.message,"error");

}

}

function renderSummary(snapshot){

const savings=Number(snapshot.bank_balance)||0;

const growth=Number(snapshot.market_funds)||0;

const emergency=Number(snapshot.emergency_fund)||0;

const freedom=Number(snapshot.goal_amount)||0;

const wealth=savings+growth+emergency;

document.getElementById("savingAmount").textContent=formatINR(savings);

document.getElementById("growthAmount").textContent=formatINR(growth);

document.getElementById("emergencyAmount").textContent=formatINR(emergency);

document.getElementById("wealthAmount").textContent=formatINR(wealth);

document.getElementById("freedomFund").textContent=formatINR(freedom);

const percent=Math.min(100,(freedom/FINANCE_GOAL)*100);

document.getElementById("goalPercent").textContent=Math.round(percent)+"%";

document.getElementById("goalBar").style.width=percent+"%";

const today=new Date();

const target=new Date("2027-03-30");

const days=Math.max(0,Math.ceil((target-today)/86400000));

document.getElementById("daysRemaining").textContent=days;

const remaining=Math.max(0,FINANCE_GOAL-freedom);

document.getElementById("remainingAmount").textContent=formatINR(remaining);

document.getElementById("perDayNeed").textContent=formatINR(Math.ceil(remaining/Math.max(days,1)));

document.getElementById("financeThought").textContent=

FINANCE_THOUGHTS[today.getDate()%FINANCE_THOUGHTS.length];

renderMilestones(freedom);

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

function renderWealthCalendar(entries){

const cal=document.getElementById("wealthCalendar");

if(!cal) return;

if(!entries || entries.length===0){

cal.innerHTML=`
<div class="empty-state">
📅 No wealth history yet
</div>
`;

return;

}

const data=entries.slice().reverse();

cal.innerHTML=data.map((item,index)=>{

let icon="⚪";

if(index>0){

const previous=Number(data[index-1].total_wealth);

const current=Number(item.total_wealth);

if(current>previous){

icon="🟢";

}else if(current<previous){

icon="🔴";

}

}

return `

<div class="calendar-day">

<div class="calendar-icon">

${icon}

</div>

<div class="calendar-date">

${new Date(item.recorded_on).toLocaleDateString("en-IN",{
day:"numeric",
month:"short"
})}

</div>

<div class="calendar-value">

${formatINR(item.total_wealth)}

</div>

</div>

`;

}).join("");

}
