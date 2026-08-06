const engine = require("../services/financialEngine.service");
const financeModel = require("./finance.model");

async function getSimulation(date) {

    return engine.calculate(date);

}

module.exports = {

    getSimulation

};
