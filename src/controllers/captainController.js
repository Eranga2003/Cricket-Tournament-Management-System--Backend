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

        // Save to DB
        const captain = await createCaptain({
            name,
            email,
            mobile,
            password_hash: hashedPassword,
            profile_image_url
        });

        console.log(`👨‍✈️ Captain Registered: ${name} (${email})`);

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
            { id: captainDoc.id, role: "captain" },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );

        res.json({
            msg: "Login successful",
            token,
            captain: { id: captainDoc.id, name: captain.name, email: captain.email }
        });
    } catch (err) {
        console.error("❌ Captain login error:", err.message);
        res.status(500).json({ error: err.message });
    }
};