const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { 
  startInnings, 
  recordBall, 
  changeBatsman, 
  changeBowler, 
  setBattingOrder, 
  undoLastBall, 
  restartMatch,
  transitionInnings 
} = require("../controllers/scoringController");

// ONLY Secure validated Organizers can formally inject Live Scores
router.post("/:match_id/start", verifyToken, startInnings);
router.post("/:match_id/batting-order", verifyToken, setBattingOrder);
router.post("/:match_id/ball", verifyToken, recordBall);
router.post("/:match_id/batsman", verifyToken, changeBatsman);
router.post("/:match_id/bowler", verifyToken, changeBowler);
router.post("/:match_id/undo", verifyToken, undoLastBall);
router.post("/:match_id/switch-innings", verifyToken, transitionInnings);
router.delete("/:match_id/reset", verifyToken, restartMatch);

module.exports = router;
