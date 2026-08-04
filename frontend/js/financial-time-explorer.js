alert("VERSION 2 - " + new Date().toISOString());
const dateInput = document.getElementById("simulationDate");

const freedomFund = document.getElementById("freedomFund");
const savings = document.getElementById("savings");
const emergencyFund = document.getElementById("emergencyFund");

const comparisonTitle = document.getElementById("comparisonTitle");
const comparisonMessage = document.getElementById("comparisonMessage");

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

async function loadSimulation(date) {

    try {

        alert("1");

        const token = localStorage.getItem("token");

        alert("2");

        const response = await fetch(
            `/api/financial-engine?date=${date}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        alert("3 Status = " + response.status);

        const text = await response.text();

        alert("4 Response = " + text);

    } catch (err) {

        alert("ERROR: " + err.message);
        console.error(err);

    }

}

 const dateInput = document.getElementById("simulationDate");

const freedomFund = document.getElementById("freedomFund");
const savings = document.getElementById("savings");
const emergencyFund = document.getElementById("emergencyFund");

const comparisonTitle = document.getElementById("comparisonTitle");
const comparisonMessage = document.getElementById("comparisonMessage");

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

async function loadSimulation(date) {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/financial-engine?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        freedomFund.textContent = money(data.freedomFund);
        savings.textContent = money(data.savings);
        emergencyFund.textContent = money(data.emergencyFund);

        comparisonTitle.textContent = data.diversified
            ? "Future Projection"
            : "Growth Phase";

        comparisonMessage.textContent = data.diversified
            ? `Income Engine Active • ₹${money(data.currentDailyIncome).replace("₹","")}/day`
            : "Trade Guardian progressing towards ₹3,00,000";

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

const today = new Date().toISOString().split("T")[0];
dateInput.value = today;
loadSimulation(today);

dateInput.addEventListener("change", () => {
    loadSimulation(dateInput.value);
});   

const today = new Date().toISOString().split("T")[0];

dateInput.value = today;

alert("Reached bottom of JS");

loadSimulation(today);

alert("Called loadSimulation");

dateInput.addEventListener("change", () => {
    alert("Date changed");
    loadSimulation(dateInput.value);
});
