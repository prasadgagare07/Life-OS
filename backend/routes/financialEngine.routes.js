const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/auth");

const controller = require("../controllers/financialEngine.controller");

router.use(requireAuth);

router.get("/", controller.getSimulation);

module.exports = router;
