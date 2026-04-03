const express = require("express");
const router = express.Router();
const { registerTeam, loginTeam, getAllTeams } = require("../controllers/teamController");
const upload = require("../middleware/upload"); // Added upload middleware

router.post("/register", upload.single("logo"), registerTeam);
router.post("/login", loginTeam); // Native Team Auth Route
router.get("/", getAllTeams);

module.exports = router;