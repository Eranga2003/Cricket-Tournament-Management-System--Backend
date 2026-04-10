const express = require("express");
const router = express.Router();
const { registerOrganizer, listOrganizers, loginOrganizer, getOrganizerProfile } = require("../controllers/organizerController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Register
router.post("/register", upload.single("logo"), registerOrganizer);

// Login
router.post("/login", loginOrganizer);

// Profile
router.get("/profile", verifyToken, getOrganizerProfile);

// List organizers
router.get("/", listOrganizers);

module.exports = router;