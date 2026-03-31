const express = require("express");
const router = express.Router();
const { registerCaptain, loginCaptain } = require("../controllers/captainController");

// Register new captain
router.post("/register", registerCaptain);

// Login captain
router.post("/login", loginCaptain);

module.exports = router;