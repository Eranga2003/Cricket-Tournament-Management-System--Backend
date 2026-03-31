// src/controllers/organizerController.js

const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");

// ----------------- REGISTER ORGANIZER -----------------
exports.registerOrganizer = async (req, res) => {
  try {
    const { org_name, email, password, phone, logo_url, sponsor_details } = req.body;

    if (!org_name || !email || !password) {
      return res.status(400).json({ msg: "Organization name, email, and password are required" });
    }

    // Check if email already exists
    const snapshot = await db.collection("organizers").where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ msg: "Organizer with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const organizerRef = db.collection("organizers").doc();
    const organizerData = {
      org_name,
      email,
      password: hashedPassword,
      phone: phone || "",
      logo_url: logo_url || "",
      sponsor_details: sponsor_details || [],
      total_tournaments: 0,
      contact_visible: true,
      is_active: true,
      created_at: new Date(),
    };

    await organizerRef.set(organizerData);

    // ✅ Terminal log
    console.log(`🎉 Organizer Created: ${org_name} (${email})`);

    res.json({
      msg: "Organizer registered successfully",
      organizer: { id: organizerRef.id, ...organizerData },
    });
  } catch (err) {
    console.error("❌ Organizer registration error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ----------------- LOGIN ORGANIZER -----------------
exports.loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email & password required" });
    }

    // Find organizer by email
    const snapshot = await db.collection("organizers").where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const organizer = snapshot.docs[0].data();
    const organizerId = snapshot.docs[0].id;

    // Compare password
    const isMatch = await bcrypt.compare(password, organizer.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    // ✅ Terminal log
    console.log(`✅ Organizer Logged In: ${organizer.org_name} (${email})`);

    res.json({
      msg: "Login successful",
      organizer: {
        id: organizerId,
        org_name: organizer.org_name,
        email: organizer.email,
        phone: organizer.phone,
        logo_url: organizer.logo_url,
      },
    });
  } catch (err) {
    console.error("❌ Organizer login error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ----------------- LIST ALL ORGANIZERS -----------------
exports.listOrganizers = async (req, res) => {
  try {
    const snapshot = await db.collection("organizers").get();

    if (snapshot.empty) {
      return res.json({ msg: "No organizers found", organizers: [] });
    }

    const organizers = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      organizers.push({
        id: doc.id,
        org_name: data.org_name,
        email: data.email,
        phone: data.phone,
        logo_url: data.logo_url,
        total_tournaments: data.total_tournaments,
        is_active: data.is_active,
        created_at: data.created_at,
      });
    });

    // ✅ Terminal log
    console.log(`📋 Listed ${organizers.length} organizers`);

    res.json({
      msg: "Organizers retrieved successfully",
      count: organizers.length,
      organizers,
    });
  } catch (err) {
    console.error("❌ List organizers error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
