async function loadFinance() {
  try {
    const snapshot = await api.get('/finance');

    document.getElementById('bank_balance').value = snapshot.bank_balance;
    document.getElementById('market_funds').value = snapshot.market_funds;
    document.getElementById('emergency_fund').value = snapshot.emergency_fund;
    document.getElementById('goal_amount').value = snapshot.goal_amount;

    renderSummary(snapshot);

    const timeline = await api.get('/finance/timeline?limit=30');

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
    renderTimeline(timeline);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

const FINANCE_THOUGHTS = [
"₹2,000/day = ₹60,000/month.",
"₹1,000/day = ₹30,000/month.",
"Assets make money. Liabilities cost money.",
"Small savings become big wealth.",
"Every rupee should have a purpose.",
"Pay yourself before paying others.",
"Wealth grows quietly.",
"Income grows when skills grow.",
"Spend less than you earn.",
"Consistency beats intensity."
];

function renderSummary(snapshot){

const savings=Number(snapshot.bank_balance)||0;

const growth=Number(snapshot.market_funds)||0;

const emergency=Number(snapshot.emergency_fund)||0;

const freedom=Number(snapshot.goal_amount)||0;

const wealth=savings+growth+emergency;

document.getElementById("wealthAmount").textContent=formatINR(wealth);

document.getElementById("savingAmount").textContent=formatINR(savings);

document.getElementById("growthAmount").textContent=formatINR(growth);

document.getElementById("emergencyAmount").textContent=formatINR(emergency);

document.getElementById("freedomFund").textContent=formatINR(freedom);

const percent=Math.min(100,(freedom/5000000)*100);

document.getElementById("goalPercent").textContent=Math.round(percent)+"%";

document.getElementById("goalBar").style.width=percent+"%";

const today=new Date();

const target=new Date("2027-03-30");

const days=Math.max(0,Math.ceil((target-today)/86400000));

document.getElementById("daysRemaining").textContent=days;

const remain=Math.max(0,5000000-freedom);

document.getElementById("remainingAmount").textContent=formatINR(remain);

document.getElementById("perDayNeed").textContent=formatINR(Math.ceil(remain/Math.max(days,1)));

const thought=today.getDate()%FINANCE_THOUGHTS.length;

document.getElementById("financeThought").textContent=FINANCE_THOUGHTS[thought];

renderMilestones(freedom);

}

function renderTimeline(entries) {
  const el = document.getElementById('timeline-list');
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">📈</span>No history yet — save an update to start your wealth timeline.</div>`;
    return;
  }
  const max = Math.max(...entries.map(e => Number(e.total_wealth)));
  el.innerHTML = entries.slice().reverse().map(e => `
    <div class="timeline-row">
      <span class="timeline-date">${new Date(e.recorded_on).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
      <div class="timeline-bar-track">
        <div class="timeline-bar" style="width:${max ? (Number(e.total_wealth) / max) * 100 : 0}%"></div>
      </div>
      <span class="numeric">${formatINR(e.total_wealth)}</span>
    </div>
  `).join('');
}

document.getElementById('finance-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    bank_balance: Number(document.getElementById('bank_balance').value),
    market_funds: Number(document.getElementById('market_funds').value),
    emergency_fund: Number(document.getElementById('emergency_fund').value),
    goal_amount: Number(document.getElementById('goal_amount').value),
  };

  try {
    const updated = await api.put('/finance', payload);
    renderSummary(updated);
    const timeline = await api.get('/finance/timeline?limit=30');
    renderTimeline(timeline);
    showToast('Finance snapshot updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadFinance();
