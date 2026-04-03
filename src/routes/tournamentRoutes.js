const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
    createTournament,
    getTournaments,
    getTournamentById, // Added single tournament detail
    getTournamentsByOrganizer,
    getMyTournaments,
    getWeather // Added weather wrapper
} = require("../controllers/tournamentController");

// Protected routes (Requires JWT Authorization)
router.post("/create", verifyToken, upload.array("ground_images", 5), createTournament);
router.get("/my", verifyToken, getMyTournaments);

// Public routes
router.get("/weather", getWeather); // Fetch weather by location/date
router.get("/", getTournaments);
router.get("/:id", getTournamentById); // Public route for tournament details
router.get("/organizer/:organizer_id", getTournamentsByOrganizer);

module.exports = router;