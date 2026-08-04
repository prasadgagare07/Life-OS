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

    const token = localStorage.getItem("token");

    const response = await fetch(

        `/api/financial-engine?date=${date}`,

        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

    );

    if (!response.ok) {
        throw new Error("Unable to load simulation");
    }

    const data = await response.json();

    freedomFund.textContent = money(data.freedomFund);
    savings.textContent = money(data.savings);
    emergencyFund.textContent = money(data.emergencyFund);

    if (data.diversified) {

        comparisonTitle.textContent = "Future Projection";

        comparisonMessage.textContent =
            `Income Engine Active • ₹${data.currentDailyIncome.toLocaleString("en-IN")}/day`;

    } else {

        comparisonTitle.textContent = "Growth Phase";

        comparisonMessage.textContent =
            `Trade Guardian progressing towards ₹3,00,000`;

    }

}

const today = new Date().toISOString().split("T")[0];

dateInput.value = today;

loadSimulation(today);

dateInput.addEventListener("change", () => {

    loadSimulation(dateInput.value);

});
