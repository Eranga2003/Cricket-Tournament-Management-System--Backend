const express = require("express");
const router = express.Router();
const { registerPlayer, loginPlayer, getPlayersByTeam } = require("../controllers/playerController");
const upload = require("../middleware/upload");

// Register a new player (via share link from captain)
router.post("/register", upload.single("image"), registerPlayer);

// Login as a player
router.post("/login", loginPlayer);

// Get all players in a team
router.get("/team/:team_id", getPlayersByTeam);

module.exports = router;