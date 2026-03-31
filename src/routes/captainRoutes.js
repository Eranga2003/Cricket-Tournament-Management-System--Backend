const express = require("express");
const router = express.Router();

const { registerCaptain } = require("../controllers/captainController");

// Register captain
router.post("/register", registerCaptain);

module.exports = router;