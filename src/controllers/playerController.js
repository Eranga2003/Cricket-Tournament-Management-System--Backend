const { createPlayer, listPlayersByTeam } = require("../models/playerModel");

// Register a new player
exports.registerPlayer = async (req, res) => {
    try {
        const { team_id, name, mobile_number, role, image_url, birthday, is_captain } = req.body;

        if (!team_id || !name || !mobile_number || !role) {
            return res.status(400).json({ msg: "Team ID, name, mobile number, and role are required" });
        }

        const player = await createPlayer({
            team_id,
            name,
            mobile_number,
            role,
            image_url: image_url || "",
            birthday: birthday || "",
            is_captain: is_captain || false,
        });

        console.log(`🎉 Player Created: ${name} (${mobile_number})`);
        res.json({ msg: "Player registered successfully", player });
    } catch (err) {
        console.error("❌ Player registration error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// List players of a team
exports.getPlayersByTeam = async (req, res) => {
    try {
        const { team_id } = req.params;
        const players = await listPlayersByTeam(team_id);
        res.json({ players });
    } catch (err) {
        console.error("❌ List players error:", err.message);
        res.status(500).json({ error: err.message });
    }
};