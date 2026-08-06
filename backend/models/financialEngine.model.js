const engine = require("../services/financialEngine.service");
const financeModel = require("./finance.model");

async function getSimulation(date) {

    const simulation = engine.calculate(date);

    if (simulation.actualAvailable) {

        simulation.actualWealth =
            await financeModel.getActualWealthByDate(date);

    }

    return simulation;

}

module.exports = {

    getSimulation

};
