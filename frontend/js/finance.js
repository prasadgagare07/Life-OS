// ===============================
// LifeOS Finance
// Wealth (Savings+Growth+Emergency) and Freedom Fund are
// tracked as two distinct things, current + change.
// Tap any calendar date to see that date's status.
// ===============================

const FINANCE_GOAL = 5000000; // ₹50,00,000
const FINANCE_LOCK_KEY = "financeLastSavedDate";

let calendarViewDate = new Date();
let historyEntries = [];      // most-recent-first, full breakdown per day
let historyByDate = {};       // "YYYY-MM-DD" -> entry

function getLocalDateKey(d = new Date()) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function isFinanceLockedToday() {
  return localStorage.getItem(FINANCE_LOCK_KEY) === getLocalDateKey();
}

function lockFinanceForm() {
  const form = document.getElementById("finance-form");
  const msg = document.getElementById("financeLockMessage");
  if (!form) return;
  form.querySelectorAll("input").forEach(input => input.disabled = true);
  const btn = form.querySelector(".save-btn");
  if (btn) btn.disabled = true;
  if (msg) msg.classList.remove("hidden");
}

function unlockFinanceForm() {
  const form = document.getElementById("finance-form");
  const msg = document.getElementById("financeLockMessage");
  if (!form) return;
  form.querySelectorAll("input").forEach(input => input.disabled = false);
  const btn = form.querySelector(".save-btn");
  if (btn) btn.disabled = false;
  if (msg) msg.classList.add("hidden");
}

setInterval(() => {
  if (!isFinanceLockedToday()) unlockFinanceForm();
}, 60000);

// ---------- Summary: Wealth + Freedom Fund ----------

function deltaHTML(curr, prev) {
  if (prev === undefined || prev === null) return "—";
  const diff = curr - prev;
  if (diff === 0) return `<span class="delta neutral">No change</span>`;
  const sign = diff > 0 ? "+" : "";
  const cls = diff > 0 ? "up" : "down";
  return `<span class="delta ${cls}">${sign}${formatINR(diff)} vs last</span>`;
}

function renderSummary(snapshot) {
  const savings = Number(snapshot.bank_balance) || 0;
  const growth = Number(snapshot.market_funds) || 0;
  const emergency = Number(snapshot.emergency_fund) || 0;
  const freedom = Number(snapshot.goal_amount) || 0;
  const wealth = savings + growth + emergency;

  document.getElementById("wealthAmount").textContent = formatINR(wealth);
  document.getElementById("freedomAmount").textContent = formatINR(freedom);

  const todayKey = getLocalDateKey();
  const prev = historyEntries.find(e => e.recorded_on.slice(0, 10) !== todayKey);
  const prevWealth = prev
    ? Number(prev.bank_balance) + Number(prev.market_funds) + Number(prev.emergency_fund)
    : undefined;

  document.getElementById("wealthDelta").innerHTML = deltaHTML(wealth, prevWealth);
  document.getElementById("freedomDelta").innerHTML =
    deltaHTML(freedom, prev ? Number(prev.goal_amount) : undefined);

  const pct = Math.min(100, (freedom / FINANCE_GOAL) * 100);
  document.getElementById("freedomGoalFill").style.width = pct + "%";
  document.getElementById("freedomGoalCaption").textContent =
    `${Math.round(pct)}% of ${formatINR(FINANCE_GOAL)}`;

  renderWealthBreakdown(
    { savings, growth, emergency },
    prev ? { savings: Number(prev.bank_balance), growth: Number(prev.market_funds), emergency: Number(prev.emergency_fund) } : null
  );
}

function bdDeltaHTML(curr, prev) {
  if (prev === undefined || prev === null) return "";
  const diff = curr - prev;
  if (diff === 0) return `<span class="bd-delta neutral">No change</span>`;
  const sign = diff > 0 ? "+" : "";
  const cls = diff > 0 ? "up" : "down";
  return `<span class="bd-delta ${cls}">${sign}${formatINR(diff)}</span>`;
}

function renderWealthBreakdown(curr, prev) {
  const box = document.getElementById("wealthBreakdown");
  if (!box) return;

  box.innerHTML = `
    <div class="bd-row">
      <span class="bd-label">💰 Savings</span>
      <span>
        <span class="bd-amount">${formatINR(curr.savings)}</span>
        ${bdDeltaHTML(curr.savings, prev ? prev.savings : undefined)}
      </span>
    </div>
    <div class="bd-row">
      <span class="bd-label">🛡 Emergency Fund</span>
      <span>
        <span class="bd-amount">${formatINR(curr.emergency)}</span>
        ${bdDeltaHTML(curr.emergency, prev ? prev.emergency : undefined)}
      </span>
    </div>
    <div class="bd-row">
      <span class="bd-label">🌱 Growth Fund</span>
      <span>
        <span class="bd-amount">${formatINR(curr.growth)}</span>
        ${bdDeltaHTML(curr.growth, prev ? prev.growth : undefined)}
      </span>
    </div>
  `;
}

const wealthCardEl = document.getElementById("wealthCard");
const wealthBreakdownEl = document.getElementById("wealthBreakdown");
const wealthToggleHintEl = document.getElementById("wealthToggleHint");

wealthCardEl?.addEventListener("click", () => {
  const isOpen = !wealthBreakdownEl.classList.contains("hidden");
  wealthBreakdownEl.classList.toggle("hidden");
  wealthCardEl.setAttribute("aria-expanded", String(!isOpen));
  wealthToggleHintEl.textContent = isOpen ? "Tap to see breakdown ▾" : "Hide breakdown ▴";
});

// ---------- Calendar ----------

let dayTrend = {}; // "YYYY-MM-DD" -> "up" | "down" | "neutral"

function indexHistory(timeline) {
  historyEntries = timeline; // most-recent-first
  historyByDate = {};
  timeline.forEach(entry => {
    historyByDate[entry.recorded_on.slice(0, 10)] = entry;
  });

  // Compare each day's grand total (wealth + freedom fund) against the
  // entry right before it chronologically, so the calendar dot can be
  // green (grew) or red (shrank).
  dayTrend = {};
  const chronological = [...timeline].reverse(); // oldest-first
  const grandTotal = e =>
    Number(e.bank_balance) + Number(e.market_funds) + Number(e.emergency_fund) + Number(e.goal_amount);

  chronological.forEach((entry, i) => {
    const key = entry.recorded_on.slice(0, 10);
    if (i === 0) {
      dayTrend[key] = "neutral";
    } else {
      const diff = grandTotal(entry) - grandTotal(chronological[i - 1]);
      dayTrend[key] = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
    }
  });
}

function renderCalendar() {
  const grid = document.getElementById("wealthCalendar");
  const picker = document.getElementById("calMonthPicker");
  if (!grid) return;

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  if (picker) {
    picker.value = year + "-" + String(month + 1).padStart(2, "0");
  }

  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay();       // 0 = Sunday
  startWeekday = (startWeekday + 6) % 7;      // shift to Monday = 0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = getLocalDateKey();

  let html = "";
  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const key = getLocalDateKey(dateObj);
    const hasData = !!historyByDate[key];
    const trendClass = hasData ? `day-${dayTrend[key] || "neutral"}` : "";
    const isToday = key === todayKey;
    html += `<button type="button" class="calendar-day ${trendClass} ${isToday ? "today" : ""}" data-date="${key}">${d}</button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".calendar-day[data-date]").forEach(btn => {
    btn.addEventListener("click", () => showDateDetail(btn.dataset.date));
  });
}

function showDateDetail(dateKey) {
  const panel = document.getElementById("dateDetail");
  const title = document.getElementById("dateDetailTitle");
  const body = document.getElementById("dateDetailBody");
  if (!panel) return;

  const entry = historyByDate[dateKey];
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  title.textContent = dateObj.toLocaleDateString("default", { day: "numeric", month: "long", year: "numeric" });

  if (!entry) {
    body.innerHTML = `<p class="no-data">No balance recorded on this date.</p>`;
  } else {
    const savings = Number(entry.bank_balance) || 0;
    const growth = Number(entry.market_funds) || 0;
    const emergency = Number(entry.emergency_fund) || 0;
    const freedom = Number(entry.goal_amount) || 0;
    const wealth = savings + growth + emergency;

    body.innerHTML = `
      <div class="detail-freedom">
        <span>🎯 Freedom Fund</span>
        <b>${formatINR(freedom)}</b>
      </div>
      <div class="detail-wealth">
        <div class="detail-wealth-total">
          <span>🪷 Wealth</span>
          <b>${formatINR(wealth)}</b>
        </div>
        <div class="detail-wealth-breakdown">
          <span>💰 Savings ${formatINR(savings)}</span>
          <span>🌱 Growth ${formatINR(growth)}</span>
          <span>🛡 Emergency ${formatINR(emergency)}</span>
        </div>
      </div>
    `;
  }

  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

document.getElementById("closeDateDetail")?.addEventListener("click", () => {
  document.getElementById("dateDetail").classList.add("hidden");
});

document.getElementById("calPrevBtn")?.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
  renderCalendar();
});

document.getElementById("calNextBtn")?.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
  renderCalendar();
});

// Native month/year picker — tap it to jump straight to any month + year
document.getElementById("calMonthPicker")?.addEventListener("change", (e) => {
  const [y, m] = e.target.value.split("-").map(Number);
  if (!y || !m) return;
  calendarViewDate = new Date(y, m - 1, 1);
  renderCalendar();
});

// ---------- Load + Save ----------

async function loadFinance() {
  try {
    const snapshot = await api.get("/finance");

    document.getElementById("bank_balance").value = snapshot.bank_balance;
    document.getElementById("market_funds").value = snapshot.market_funds;
    document.getElementById("emergency_fund").value = snapshot.emergency_fund;
    document.getElementById("goal_amount").value = snapshot.goal_amount;

    const timeline = await api.get("/finance/timeline?limit=1000");
    indexHistory(timeline);

    // Locked if either this browser already saved today, or the server
    // already has today's entry (covers switching devices/browsers —
    // requires migration 005 to have been run so today's date shows up
    // in the timeline; falls back to the local flag either way).
    const todayKey = getLocalDateKey();
    const alreadySavedToday = isFinanceLockedToday() || !!historyByDate[todayKey];
    if (alreadySavedToday) {
      localStorage.setItem(FINANCE_LOCK_KEY, todayKey);
      lockFinanceForm();
    }

    renderSummary(snapshot);
    renderCalendar();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("finance-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    bank_balance: Number(document.getElementById("bank_balance").value) || 0,
    market_funds: Number(document.getElementById("market_funds").value) || 0,
    emergency_fund: Number(document.getElementById("emergency_fund").value) || 0,
    goal_amount: Number(document.getElementById("goal_amount").value) || 0
  };

  try {
    const updated = await api.put("/finance", payload);
    localStorage.setItem(FINANCE_LOCK_KEY, getLocalDateKey());
    lockFinanceForm();

    const timeline = await api.get("/finance/timeline?limit=1000");
    indexHistory(timeline);

    renderSummary(updated);
    renderCalendar();
    showToast("Finance updated successfully", "success");

    const details = document.getElementById("updateDetails");
    if (details) details.open = false;
  } catch (err) {
    showToast(err.message, "error");
  }
});

loadFinance();
