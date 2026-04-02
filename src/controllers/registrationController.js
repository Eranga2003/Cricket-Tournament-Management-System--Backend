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
    // 🔥 NEW REQUIREMENT: Reject Captain Tokens! MUST be a Team Token!
    if (req.user.role !== "team") {
       return res.status(403).json({ msg: "Forbidden Pipeline Guard: You explicitly must login via /api/teams/login and use the Team Token to submit an application natively." });
    }
    const team_id = req.user.id; // Securely enforced via Team JWT extraction
    
    // Notice we removed team_id from frontend body since it's securely tracked via Token.
    const { tournament_id, selected_players } = req.body;

    if (!tournament_id) {
      return res.status(400).json({ msg: "tournament_id is required" });
    }

    // Safely dynamically pull the associated Captain ID directly from the Team DB Account
    const teamData = await getTeamById(team_id);
    if (!teamData) return res.status(404).json({ msg: "Corrupted Team Identity System Error" });

    const registration = await applyForTournament({
      tournament_id,
      team_id,
      captain_id: teamData.captain_id, // Automatically dynamically binds the original Captain to keep /my endpoint completely operational!
      selected_players: selected_players || []
    });

    console.log(`📋 Secure Team Account applied for Tournament ${tournament_id}`);
    res.json({ msg: "Team Account successfully firmly recorded its application!", registration });

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
