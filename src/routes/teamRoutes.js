const express = require("express");
const router = express.Router();
const { registerTeam, getTeams } = require("../controllers/teamController");

// Create a team
router.post("/register", registerTeam);

// List all teams
router.get("/", getTeams);

module.exports = router;