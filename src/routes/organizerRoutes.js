const express = require("express");
const router = express.Router();
const { registerOrganizer, listOrganizers, loginOrganizer } = require("../controllers/organizerController");
const upload = require("../middleware/upload"); // Added upload middleware

// Register
router.post("/register", upload.single("logo"), registerOrganizer);

// Login
router.post("/login", loginOrganizer);

// List organizers (optional, admin only)
router.get("/", listOrganizers);

module.exports = router;