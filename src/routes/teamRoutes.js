const express = require("express");
const router = express.Router();
const { registerTeam, loginTeam, getAllTeams } = require("../controllers/teamController");

router.post("/register", registerTeam);
router.post("/login", loginTeam); // Native Team Auth Route
router.get("/", getAllTeams);

module.exports = router;