const { db } = require("../config/firebase"); // Firebase admin import

// ===============================
// Register a new Organizer
// ===============================
exports.registerOrganizer = async (req, res) => {
  try {
    const { name, email, phone, logo, sponsors } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ msg: "Name, email and phone are required" });
    }

    // Create new Firestore document
    const organizerRef = db.collection("organizers").doc(); 
    const organizerData = {
      name,
      email,
      phone,
      logo: logo || "",
      sponsors: sponsors || [],
      totalTournaments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await organizerRef.set(organizerData);

    // ✅ Show in terminal
    console.log(`🎉 Organizer Created: ${name} (${email})`);

    res.json({
      msg: "Organizer registered successfully",
      organizer: { id: organizerRef.id, ...organizerData },
    });
  } catch (err) {
    console.error("❌ Organizer registration error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// List all Organizers
// ===============================
exports.listOrganizers = async (req, res) => {
  try {
    const snapshot = await db.collection("organizers").get();

    if (snapshot.empty) {
      console.log("⚠️ No organizers found yet");
      return res.json({ organizers: [] });
    }

    const organizers = [];
    snapshot.forEach((doc) => {
      organizers.push({ id: doc.id, ...doc.data() });
    });

    res.json({ organizers });
  } catch (err) {
    console.error("❌ List organizers error:", err.message);
    res.status(500).json({ error: err.message });
  }
};