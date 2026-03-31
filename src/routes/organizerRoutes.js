const express = require("express");
const router = express.Router();
const { registerOrganizer, listOrganizers } = require("../controllers/organizerController");

// Register new organizer
router.post("/", registerOrganizer);

// List all organizers
router.get("/", listOrganizers);

module.exports = router;