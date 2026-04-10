const { createTeam, getTeams } = require("../models/teamModel");
const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadImage } = require("../services/storageService"); // Added storage service

exports.registerTeam = async (req, res) => {
  try {
    const { captain_id, team_name, username, team_email, password, location } = req.body;
    let { logo_url } = req.body;
    
    if (!captain_id || !team_name || !username || !password) {
      return res.status(400).json({ msg: "captain_id, team_name, username, and password strictly required natively" });
    }

    // Check if username already exists
    const userSnapshot = await db.collection("teams").where("username", "==", username).get();
    if (!userSnapshot.empty) return res.status(400).json({ msg: "Username already in use by another team" });

    // Handle image upload to Supabase if a file exists
    if (req.file) {
      try {
        logo_url = await uploadImage(req.file);
        console.log(`✅ Logo uploaded to Supabase: ${logo_url}`);
      } catch (uploadErr) {
        console.error("❌ Failed to upload image to Supabase:", uploadErr.message);
        return res.status(500).json({ msg: "Error uploading image to Supabase", error: uploadErr.message });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const team = await createTeam({
      team_email: team_email || "",
      username,
      password_hash: hashedPassword,
      captain_id,
      team_name,
      location: location || "",
      logo_url: logo_url || "" // Store the Supabase URL in Firebase
    });

    console.log(`🛡️ Dedicated Team Profile built: ${team_name}`);

    // Clean critical hashes from the network trace
    delete team.password_hash;
    
    res.json({ msg: "Team Account effectively created!", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginTeam = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: "Username and password strictly required" });

    // Check only username
    let snapshot = await db.collection("teams").where("username", "==", username).get();

    if (snapshot.empty) return res.status(400).json({ msg: "Invalid Team credentials" });

    const teamDoc = snapshot.docs[0];
    const teamData = teamDoc.data();

    const isMatch = await bcrypt.compare(password, teamData.password_hash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Team credentials" });

    const token = jwt.sign(
      { id: teamDoc.id, role: "team" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Team Authentication Successful!",
      token,
      team: { 
          id: teamDoc.id, 
          team_name: teamData.team_name, 
          username: teamData.username,
          team_email: teamData.team_email,
          role: "team"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await getTeams();
    // Vigorously scrub hashes globally
    const safeTeams = teams.map(t => { delete t.password_hash; return t; });
    res.json({ teams: safeTeams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection("teams").doc(id).get();
        if (!doc.exists) return res.status(404).json({ msg: "Team not found" });
        const data = doc.data();
        delete data.password_hash;
        res.json({ team: { id: doc.id, ...data } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTeamProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let teamData = null;
        let teamId = null;

        if (role === 'team') {
            const doc = await db.collection("teams").doc(userId).get();
            if (doc.exists) {
                teamData = doc.data();
                teamId = doc.id;
            }
        } else if (role === 'captain') {
            const snapshot = await db.collection("teams").where("captain_id", "==", userId).get();
            if (!snapshot.empty) {
                teamData = snapshot.docs[0].data();
                teamId = snapshot.docs[0].id;
            }
        }

        if (!teamData) return res.status(404).json({ msg: "Team profile not found for this user context" });

        delete teamData.password_hash;
        res.json({ team: { id: teamId, ...teamData } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};