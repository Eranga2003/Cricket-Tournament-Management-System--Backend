const express = require("express");
const router = express.Router();
const { registerOrganizer, loginOrganizer, listOrganizers } = require("../controllers/organizerController");

// Register new organizer
router.post("/register", registerOrganizer);

// Login organizer
router.post("/login", loginOrganizer);

// List organizers (optional)
router.get("/", listOrganizers);

module.exports = router;