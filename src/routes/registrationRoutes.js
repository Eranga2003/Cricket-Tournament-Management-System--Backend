const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
    applyTournament,
    getTournamentRegistrations,
    getMyRegistrations,
    approveOrReject
} = require("../controllers/registrationController");

// Captain applies for tournament
router.post("/apply", verifyToken, applyTournament);

// Captain views their registration statuses
router.get("/my", verifyToken, getMyRegistrations);

// Organizer views requests for a specific tournament
router.get("/tournament/:id", verifyToken, getTournamentRegistrations);

// Organizer approves / rejects a registration
router.put("/:id/status", verifyToken, approveOrReject);

module.exports = router;
