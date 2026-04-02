const { createTeam, getTeams } = require("../models/teamModel");
const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerTeam = async (req, res) => {
  try {
    const { captain_id, team_name, team_email, password, location, logo_url } = req.body;
    
    if (!captain_id || !team_name || !team_email || !password) {
      return res.status(400).json({ msg: "captain_id, team_name, team_email, and password strictly required natively" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const team = await createTeam({
      team_email,
      password_hash: hashedPassword,
      captain_id,
      team_name,
      location,
      logo_url
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
    const { team_email, password } = req.body;
    if (!team_email || !password) return res.status(400).json({ msg: "Both credentials intensely required" });

    const snapshot = await db.collection("teams").where("team_email", "==", team_email).get();
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
      team: { id: teamDoc.id, team_name: teamData.team_name, team_email: teamData.team_email }
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