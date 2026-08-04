const engine = require("../services/financialEngine.service");

async function getSimulation(date) {

    return engine.calculate(date);

}

module.exports = {

    getSimulation

};
