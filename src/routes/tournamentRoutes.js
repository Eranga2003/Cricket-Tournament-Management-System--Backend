const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
    createTournament,
    getTournaments,
    getTournamentsByOrganizer,
    getMyTournaments
} = require("../controllers/tournamentController");

// Protected routes (Requires JWT Authorization)
router.post("/create", verifyToken, createTournament);
router.get("/my", verifyToken, getMyTournaments);

// Public routes
router.get("/", getTournaments);
router.get("/organizer/:organizer_id", getTournamentsByOrganizer);

module.exports = router;