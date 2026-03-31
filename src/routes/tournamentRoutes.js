const express = require("express");
const router = express.Router();

const {
    createTournament,
    getTournaments,
    getTournamentsByOrganizer
} = require("../controllers/tournamentController");

// Create tournament
router.post("/", createTournament);

// Get all tournaments
router.get("/", getTournaments);

// Get tournaments by organizer
router.get("/organizer/:organizer_id", getTournamentsByOrganizer);

module.exports = router;