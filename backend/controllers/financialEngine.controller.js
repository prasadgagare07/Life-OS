const FinancialEngine = require("../models/financialEngine.model");

async function getSimulation(req, res) {

    try {

        const { date } = req.query;

        if (!date) {

            return res.status(400).json({

                error: "Date is required"

            });

        }

        const simulation =
            await FinancialEngine.getSimulation(date);

        res.json(simulation);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Simulation failed"

        });

    }

}

module.exports = {

    getSimulation

};
