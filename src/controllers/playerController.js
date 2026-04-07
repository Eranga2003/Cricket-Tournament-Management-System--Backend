const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createPlayer, listPlayersByTeam } = require("../models/playerModel");
const { uploadImage } = require("../services/storageService");
const { db } = require("../config/firebase");

// Register a new player
exports.registerPlayer = async (req, res) => {
    try {
        const { team_id, name, mobile_number, role, birthday, is_captain, username, password } = req.body;
        let { image_url } = req.body;

        if (!team_id || !name || !username || !password) {
            return res.status(400).json({ msg: "Team ID, name, username, and password are required" });
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle image upload to Supabase if a file exists
        if (req.file) {
            try {
                const bucketName = process.env.SUPABASE_BUCKET || "logos";
                image_url = await uploadImage(req.file, bucketName);
                console.log(`✅ Player photo uploaded to Supabase bucket: ${bucketName}`);
            } catch (uploadErr) {
                console.error("❌ Failed to upload player photo:", uploadErr.message);
                return res.status(500).json({ msg: "Error uploading player photo", error: uploadErr.message });
            }
        }

        const player = await createPlayer({
            team_id,
            name,
            username,
            password_hash: hashedPassword,
            mobile_number: mobile_number || "",
            role: role || "Batsman",
            image_url: image_url || "",
            birthday: birthday || "",
            is_captain: is_captain || false,
        });

        console.log(`🎉 Player Registered: ${username} (${name})`);
        res.json({ msg: "Player registered successfully", player });
    } catch (err) {
        console.error("❌ Player registration error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Login player
exports.loginPlayer = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ msg: "Username and password are required" });

        const snapshot = await db.collection("players").where("username", "==", username).get();
        if (snapshot.empty) return res.status(400).json({ msg: "Invalid credentials" });

        const playerDoc = snapshot.docs[0];
        const player = playerDoc.data();

        const isMatch = await bcrypt.compare(password, player.password_hash);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign(
            { id: playerDoc.id, role: "player", team_id: player.team_id },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );

        res.json({
            msg: "Login successful",
            token,
            player: { id: playerDoc.id, name: player.name, username: player.username, role: "player", team_id: player.team_id }
        });
    } catch (err) {
        console.error("❌ Player login error:", err.message);
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