const { createPlayer, listPlayersByTeam } = require("../models/playerModel");
const { uploadImage } = require("../services/storageService");

// Register a new player
exports.registerPlayer = async (req, res) => {
    try {
        const { team_id, name, mobile_number, role, birthday, is_captain } = req.body;
        let { image_url } = req.body;

        if (!team_id || !name || !mobile_number || !role) {
            return res.status(400).json({ msg: "Team ID, name, mobile number, and role are required" });
        }

        // Handle image upload to Supabase if a file exists
        if (req.file) {
            try {
                image_url = await uploadImage(req.file, "profiles");
                console.log(`✅ Player photo uploaded: ${image_url}`);
            } catch (uploadErr) {
                console.error("❌ Failed to upload player photo:", uploadErr.message);
                return res.status(500).json({ msg: "Error uploading player photo", error: uploadErr.message });
            }
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