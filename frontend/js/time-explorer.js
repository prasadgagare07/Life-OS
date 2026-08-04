const dateInput = document.getElementById("simulationDate");

const freedomFund = document.getElementById("freedomFund");
const savings = document.getElementById("savings");
const emergencyFund = document.getElementById("emergencyFund");

const comparisonTitle = document.getElementById("comparisonTitle");
const comparisonMessage = document.getElementById("comparisonMessage");


function formatMoney(value) {

    return "₹" + Number(value || 0).toLocaleString("en-IN");

}


async function loadSimulation(date) {

    try {

        const token = localStorage.getItem("token");

        const res = await fetch(

            `/api/time-explorer?date=${date}`,

            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }

        );

        if (!res.ok) {

            throw new Error("Failed");

        }

        const data = await res.json();

        freedomFund.textContent =
            formatMoney(data.estimated.freedomFund);

        savings.textContent =
            formatMoney(data.estimated.savings);

        emergencyFund.textContent =
            formatMoney(data.estimated.emergencyFund);


        if (data.type === "future") {

            comparisonTitle.textContent = "Estimated";

            comparisonMessage.textContent =
                "These values represent your estimated financial position if you continue following your plan.";

        }

        else if (data.type === "current") {

            comparisonTitle.textContent = "Estimated vs Actual";

            comparisonMessage.textContent =
                "Today's estimated values are compared with your actual balances.";

        }

        else {

            comparisonTitle.textContent = "Past Comparison";

            comparisonMessage.textContent =
                "Compare your historical performance against your original financial plan.";

        }

    }

    catch (err) {

        console.error(err);

        comparisonTitle.textContent = "Error";

        comparisonMessage.textContent =
            "Unable to load simulation.";

    }

}


const today = new Date();

const yyyy = today.getFullYear();

const mm = String(today.getMonth() + 1).padStart(2, "0");

const dd = String(today.getDate()).padStart(2, "0");

dateInput.value = `${yyyy}-${mm}-${dd}`;

loadSimulation(dateInput.value);


dateInput.addEventListener("change", () => {

    loadSimulation(dateInput.value);

});
