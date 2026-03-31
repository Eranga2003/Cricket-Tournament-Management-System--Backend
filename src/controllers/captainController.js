const bcrypt = require("bcryptjs");
const { createCaptain } = require("../models/captainModel");

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

        // ✅ Terminal log
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