// ===============================
// LifeOS — Financial Time Explorer
// ===============================

// Must match START_DATE in backend/services/financialEngine.service.js
const FTE_START_DATE = "2026-08-04";
// Must match PHASE1_TARGET in backend/services/financialEngine.service.js
const FTE_PHASE1_TARGET = 300000;

const dateInput = document.getElementById("simulationDate");
const todayBtn = document.getElementById("fteToday");

const fteTotal = document.getElementById("fteTotal");
const fteBadge = document.getElementById("fteBadge");
const fteHeroSub = document.getElementById("fteHeroSub");

const fteProgressCard = document.getElementById("fteProgressCard");
const fteProgressPct = document.getElementById("fteProgressPct");
const fteBarFill = document.getElementById("fteBarFill");
const fteBarCurrent = document.getElementById("fteBarCurrent");

const fteFundGrid = document.getElementById("fteFundGrid");
const freedomFundVal = document.getElementById("freedomFundVal");
const savingsVal = document.getElementById("savingsVal");
const emergencyFundVal = document.getElementById("emergencyFundVal");
const deployedCapitalVal = document.getElementById("deployedCapitalVal");

const fteInfoTitle = document.getElementById("fteInfoTitle");
const fteInfoMessage = document.getElementById("fteInfoMessage");

function setLoading() {
  fteBadge.textContent = "Loading";
  fteBadge.className = "badge";
  fteHeroSub.textContent = "Crunching the numbers…";
  fteInfoTitle.textContent = "Loading…";
  fteInfoMessage.textContent = "Please wait…";
}

async function loadSimulation(date) {
  if (!date) return;
  setLoading();

  try {
    const data = await api.get(`/financial-engine?date=${date}`);
    if (data) render(data);
  } catch (err) {
    console.error(err);
    fteBadge.textContent = "Error";
    fteBadge.className = "badge bad";
    fteHeroSub.textContent = "Could not load this date.";
    fteInfoTitle.textContent = "Something went wrong";
    fteInfoMessage.textContent = err.message || "Please try again.";
    showToast(err.message || "Failed to load simulation", "error");
  }
}

function render(data) {
  const {
    diversified,
    diversificationDate,
    currentDailyIncome,
    tradeGuardianCash,
    deployedCapital,
    backupSavings,
    freedomFund,
    savings,
    emergencyFund
  } = data;

  const totalWealth = diversified
    ? deployedCapital + freedomFund + savings + emergencyFund
    : tradeGuardianCash;

  fteTotal.textContent = formatINR(totalWealth);

  if (diversified) {
    fteBadge.textContent = "Diversified";
    fteBadge.className = "badge good";
    fteHeroSub.textContent =
      `Diversified on ${diversificationDate} • Earning ${formatINR(currentDailyIncome)}/day`;
  } else {
    fteBadge.textContent = "Growth Phase";
    fteBadge.className = "badge warn";
    fteHeroSub.textContent =
      `Trade Guardian earning ${formatINR(currentDailyIncome)}/day toward the ₹3,00,000 target`;
  }

  // Growth-phase progress bar — only relevant before diversification
  fteProgressCard.hidden = diversified;
  if (!diversified) {
    const pct = clamp(Math.round((tradeGuardianCash / FTE_PHASE1_TARGET) * 100), 0, 100);
    fteBarFill.style.width = pct + "%";
    fteProgressPct.textContent = pct + "%";
    fteBarCurrent.textContent = `${formatINR(tradeGuardianCash)} of ₹3,00,000`;
  }

  // Fund breakdown — only meaningful once diversified
  fteFundGrid.hidden = !diversified;
  freedomFundVal.textContent = formatINR(freedomFund);
  savingsVal.textContent = formatINR(savings);
  emergencyFundVal.textContent = formatINR(emergencyFund);
  deployedCapitalVal.textContent = formatINR(deployedCapital);

  // Info card
  if (diversified) {
    fteInfoTitle.textContent = "Future Projection";
    fteInfoMessage.textContent =
      `Income engine active since ${diversificationDate}. ` +
      `${formatINR(deployedCapital)} deployed as working capital, ` +
      `with a ${formatINR(backupSavings)} backup cushion folded into savings.`;
  } else {
    const remaining = Math.max(FTE_PHASE1_TARGET - tradeGuardianCash, 0);
    fteInfoTitle.textContent = "Growth Phase";
    fteInfoMessage.textContent = remaining > 0
      ? `Trade Guardian is progressing toward ₹3,00,000. ${formatINR(remaining)} to go before capital gets deployed.`
      : "Target reached — diversification kicks in on the next simulated day.";
  }
}

const today = todayISO();
dateInput.value = today;
dateInput.min = FTE_START_DATE;

loadSimulation(dateInput.value);

dateInput.addEventListener("change", () => {
  loadSimulation(dateInput.value);
});

todayBtn.addEventListener("click", () => {
  dateInput.value = todayISO();
  loadSimulation(dateInput.value);
});
