const express = require("express");
const router = express.Router();
const { registerOrganizer, listOrganizers, loginOrganizer } = require("../controllers/organizerController");

// Register
router.post("/register", registerOrganizer);

// Login
router.post("/login", loginOrganizer);

// List organizers (optional, admin only)
router.get("/", listOrganizers);

module.exports = router;