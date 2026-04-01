const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
  setupSchedule,
  slotTeams,
  declareWinner,
  getSchedule
} = require("../controllers/matchController");

// 👔 Exclusively heavily protected Organizer paths
router.post("/schedule", verifyToken, setupSchedule);
router.put("/:match_id/teams", verifyToken, slotTeams);
router.put("/:match_id/winner", verifyToken, declareWinner);

// 🌍 Globally universally viewable
router.get("/tournament/:tournament_id", getSchedule);

module.exports = router;
