const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { startInnings, recordBall, changeBatsman, changeBowler } = require("../controllers/scoringController");

// ONLY Secure validated Organizers can formally inject Live Scores
router.post("/:match_id/start", verifyToken, startInnings);
router.post("/:match_id/ball", verifyToken, recordBall);
router.post("/:match_id/batsman", verifyToken, changeBatsman);
router.post("/:match_id/bowler", verifyToken, changeBowler);

module.exports = router;
