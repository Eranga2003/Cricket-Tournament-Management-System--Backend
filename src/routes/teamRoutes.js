const express = require("express");
const router = express.Router();
const { registerTeam, loginTeam, getAllTeams, getTeamById, getTeamProfile } = require("../controllers/teamController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", upload.single("logo"), registerTeam);
router.post("/login", loginTeam); 
router.get("/", getAllTeams);
router.get("/profile", verifyToken, getTeamProfile);
router.get("/:id", getTeamById);

module.exports = router;