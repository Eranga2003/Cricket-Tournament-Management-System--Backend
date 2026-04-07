const { 
  applyForTournament, 
  getRegistrationsByTournament, 
  getRegistrationsByCaptain, 
  updateRegistrationStatus,
  verifyAndScanRegistration
} = require("../models/registrationModel");
const { getTeamById } = require("../models/teamModel");

exports.applyTournament = async (req, res) => {
  try {
    // 🔥 UPDATED: Allow both Captains and Team-Accounts to apply natively
    if (req.user.role !== "team" && req.user.role !== "captain") {
       return res.status(403).json({ msg: "Forbidden role access: Only Captains or Teams can submit applications." });
    }

    const { tournament_id, selected_players, team_name, contact_number, payment_done } = req.body;
    let team_id = req.user.id;
    let captain_id = req.user.id;

    // Logic: If user is Captain, find their team_id dynamically
    if (req.user.role === "captain") {
       const snapshot = await db.collection("teams").where("captain_id", "==", req.user.id).get();
       if (snapshot.empty) return res.status(404).json({ msg: "You must build a Squad Profile first before applying to tournaments." });
       team_id = snapshot.docs[0].id;
    } else {
       // If user is Team role, find the captain_id
       const teamData = await getTeamById(team_id);
       if (!teamData) return res.status(404).json({ msg: "Corrupted Team Identity System Error" });
       captain_id = teamData.captain_id;
    }

    if (!tournament_id) {
      return res.status(400).json({ msg: "tournament_id is required" });
    }

    const registration = await applyForTournament({
      tournament_id,
      team_id,
      team_name: team_name || "Unknown Team",
      contact_number: contact_number || "N/A",
      captain_id,
      selected_players: selected_players || [],
      payment_status: payment_done ? "paid" : "pending"
    });

    console.log(`📋 Tournament Application recorded for Team: ${team_name}`);
    res.json({ msg: "Application successful!", registration });

  } catch (err) {
    console.error("❌ Apply tournament error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getTournamentRegistrations = async (req, res) => {
  try {
    const { id } = req.params; 
    const registrations = await getRegistrationsByTournament(id);
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const captain_id = req.user.id; // This stays purely functionally tied to Captains querying their profile arrays!
    const registrations = await getRegistrationsByCaptain(captain_id);
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveOrReject = async (req, res) => {
  try {
    const { id } = req.params; 
    const { status } = req.body; 

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Status natively must be 'approved' or 'rejected'" });
    }

    let qr_code = null;
    if (status === "approved") {
      qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-${id}`;
    }

    const updated = await updateRegistrationStatus(id, status, qr_code);

    res.json({ msg: `Registration perfectly set to ${status}`, registration: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.scanQRCode = async (req, res) => {
  try {
    const { qr_data } = req.body; 
    if (!qr_data || !qr_data.startsWith("REG-")) {
      return res.status(400).json({ msg: "Invalid QR System format natively. Expected 'REG-xxxx'" });
    }
    
    const registrationId = qr_data.split("REG-")[1];
    const organizerId = req.user.id; 

    const scannedReg = await verifyAndScanRegistration(registrationId, organizerId);
    
    console.log(`📱 Team physical check-in validated securely!`);
    res.json({ msg: "Team arrived properly! Gate securely unlocked.", registration: scannedReg });
  } catch(err) {
    res.status(400).json({ error: err.message });
  }
};
