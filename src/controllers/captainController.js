const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createCaptain } = require("../models/captainModel");
const { db } = require("../config/firebase");

// ===============================
// REGISTER CAPTAIN
// ===============================
exports.registerCaptain = async (req, res) => {
    try {
        const { name, email, mobile, password, profile_image_url } = req.body;

        // ✅ Validation
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                msg: "name, email, mobile, password are required"
            });
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to captains collection
        const captain = await createCaptain({
            name,
            email,
            mobile,
            password_hash: hashedPassword,
            profile_image_url
        });

        // Also create a entry in players collection so they have a profile
        await db.collection("players").doc(captain.captain_id).set({
            name,
            username: email, // Use email as initial username for captain profile
            password_hash: hashedPassword,
            mobile_number: mobile,
            is_captain: true,
            team_id: null,
            role: "Captain",
            image_url: profile_image_url || "",
            created_at: new Date()
        });

        console.log(`👨‍✈️ Captain Registered & Player Profile Created: ${name} (${email})`);

        res.json({
            msg: "Captain registered successfully",
            captain
        });

    } catch (err) {
        console.error("❌ Captain registration error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// LOGIN CAPTAIN
// ===============================
exports.loginCaptain = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: "Email and password are required" });

        const snapshot = await db.collection("captains").where("email", "==", email).get();
        if (snapshot.empty) return res.status(400).json({ msg: "Invalid credentials" });

        const captainDoc = snapshot.docs[0];
        const captain = captainDoc.data();

        const isMatch = await bcrypt.compare(password, captain.password_hash);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign(
            { id: captainDoc.id, role: "captain", team_id: captain.team_id },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );

        res.json({
            msg: "Login successful",
            token,
            captain: { 
                id: captainDoc.id, 
                name: captain.name, 
                email: captain.email, 
                team_id: captain.team_id, 
                role: "captain" 
            }
        });
    } catch (err) {
        console.error("❌ Captain login error:", err.message);
        res.status(500).json({ error: err.message });
    }
};