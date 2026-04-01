const express = require("express");
const router = express.Router();
const { registerPlayer, getPlayersByTeam } = require("../controllers/playerController");

// Register a new player (via share link from captain)
router.post("/register", registerPlayer);

// Get all players in a team
router.get("/team/:team_id", getPlayersByTeam);

module.exports = router;
//