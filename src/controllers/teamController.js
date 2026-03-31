const { createTeam, listTeams } = require("../models/teamModel");

// Register / Create Team
exports.registerTeam = async (req, res) => {
    try {
        const { captain_id, team_name, logo_url, join_link } = req.body;

        if (!captain_id || !team_name) {
            return res.status(400).json({
                msg: "Captain ID and team name are required",
            });
        }

        const newTeam = await createTeam({ captain_id, team_name, logo_url, join_link });

        // ✅ Show in terminal
        console.log(`🏏 Team Created: ${team_name} by Captain ID: ${captain_id}`);

        res.json({
            msg: "Team created successfully",
            team: newTeam,
        });
    } catch (err) {
        console.error("❌ Team creation error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// List all teams
exports.getTeams = async (req, res) => {
    try {
        const teams = await listTeams();
        res.json({ teams });
    } catch (err) {
        console.error("❌ List teams error:", err.message);
        res.status(500).json({ error: err.message });
    }
};