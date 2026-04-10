const { db } = require("../config/firebase"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadImage } = require("../services/storageService");

exports.registerOrganizer = async (req, res) => {
  try {
    const { org_name, email, phone, password, sponsors } = req.body;
    let { logo } = req.body;

    if (!org_name || !email || !phone || !password) {
      return res.status(400).json({ msg: "org_name, email, phone, and password are required" });
    }

    if (req.file) {
      try {
        logo = await uploadImage(req.file);
      } catch (uploadErr) {
        return res.status(500).json({ msg: "Error uploading image to Supabase", error: uploadErr.message });
      }
    }

    const existing = await db.collection("organizers").where("email", "==", email).get();
    if (!existing.empty) {
      return res.status(400).json({ msg: "Organizer with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizerRef = db.collection("organizers").doc();
    const organizerData = {
      org_name,
      email,
      phone,
      password: hashedPassword,
      logo: logo || "",
      sponsors: sponsors || [],
      totalTournaments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await organizerRef.set(organizerData);

    res.json({
      msg: "Organizer registered successfully",
      organizer: { id: organizerRef.id, ...organizerData },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listOrganizers = async (req, res) => {
  try {
    const snapshot = await db.collection("organizers").get();
    if (snapshot.empty) return res.json({ organizers: [] });

    const organizers = [];
    snapshot.forEach((doc) => organizers.push({ id: doc.id, ...doc.data() }));

    res.json({ organizers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Email and password are required" });

    const snapshot = await db.collection("organizers").where("email", "==", email).get();
    if (snapshot.empty) return res.status(400).json({ msg: "Invalid credentials" });

    const organizerDoc = snapshot.docs[0];
    const organizer = organizerDoc.data();

    const isMatch = await bcrypt.compare(password, organizer.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: organizerDoc.id, role: "organizer" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Login successful",
      token,
      organizer: {
        id: organizerDoc.id,
        org_name: organizer.org_name,
        email: organizer.email,
        phone: organizer.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrganizerProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const doc = await db.collection("organizers").doc(id).get();
    if (!doc.exists) return res.status(404).json({ msg: "Organizer not found" });
    const data = doc.data();
    delete data.password;
    res.json({ id: doc.id, ...data, role: "organizer" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};