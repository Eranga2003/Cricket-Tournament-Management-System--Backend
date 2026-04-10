const express = require("express");
const router = express.Router();
const { registerCaptain, loginCaptain, getCaptainProfile } = require("../controllers/captainController");
const { verifyToken } = require("../middleware/authMiddleware");

// Register new captain
router.post("/register", registerCaptain);

// Login captain
router.post("/login", loginCaptain);

// Get current profile
router.get("/profile", verifyToken, getCaptainProfile);

module.exports = router;