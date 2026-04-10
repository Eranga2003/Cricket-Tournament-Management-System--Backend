const { 
  applyForTournament, 
  getRegistrationById,
  getRegistrationsByTournament, 
  getRegistrationsByCaptain, 
  getRegistrationsByTeam,
  getRegistrationsByOrganizer,
  updateRegistrationStatus,
  verifyAndScanRegistration
} = require("../models/registrationModel");
const { getTeamById } = require("../models/teamModel");
const { getTournamentById } = require("../models/tournamentModel");
const { db } = require("../config/firebase");

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

    // Fetch tournament to get organizer_id
    const tournament = await getTournamentById(tournament_id);
    if (!tournament) {
      return res.status(404).json({ msg: "Tournament not found" });
    }

    const registration = await applyForTournament({
      tournament_id,
      organizer_id: tournament.organizer_id, // Store organizer ID for easier dashboard queries
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
    const userId = req.user.id;
    const role = req.user.role;
    
    let registrations = [];
    if (role === "team") {
        registrations = await getRegistrationsByTeam(userId);
    } else {
        registrations = await getRegistrationsByCaptain(userId);
    }

    // 🔥 ENHANCEMENT: Join tournament details (name, date, status) for the frontend view
    const enriched = await Promise.all(registrations.map(async (reg) => {
        const tournamentDoc = await db.collection("tournaments").doc(reg.tournament_id).get();
        const tournamentData = tournamentDoc.exists ? tournamentDoc.data() : {};
        
        return {
            ...reg,
            tournament_name: tournamentData.name || "Unknown Tournament",
            tournament_date: tournamentData.date_time || "N/A",
            tournament_location: tournamentData.location || "N/A"
        };
    }));

    res.json({ registrations: enriched });
  } catch (err) {
    console.error("❌ Get my registrations error:", err.message);
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
      const regData = await getRegistrationById(id);
      if (regData) {
        const tourneySnap = await db.collection("tournaments").doc(regData.tournament_id).get();
        const tourneyName = tourneySnap.exists ? tourneySnap.data().name : "Unknown Tournament";
        
        const payload = JSON.stringify({
          reg_id: id,
          team: regData.team_name,
          tournament: tourneyName,
          contact: regData.contact_number,
          v: "1.0"
        });
        
        qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payload)}`;
      } else {
        // Fallback for missing record (shouldn't happen)
        qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-${id}`;
      }
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
    if (!qr_data) return res.status(400).json({ msg: "No QR data provided" });

    let registrationId;

    if (qr_data.startsWith("{") || qr_data.includes('"reg_id"')) {
      try {
          const parsed = JSON.parse(qr_data);
          registrationId = parsed.reg_id;
      } catch (e) {
          return res.status(400).json({ msg: "Malformed JSON QR data" });
      }
    } else if (qr_data.startsWith("REG-")) {
      registrationId = qr_data.split("REG-")[1];
    } else {
      return res.status(400).json({ msg: "Invalid QR System format natively. Expected JSON or 'REG-xxxx'" });
    }
    
    const organizerId = req.user.id; 

    const scannedReg = await verifyAndScanRegistration(registrationId, organizerId);
    
    console.log(`📱 Team physical check-in validated securely!`);
    res.json({ msg: "Team arrived properly! Gate securely unlocked.", registration: scannedReg });
  } catch(err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrganizerRegistrations = async (req, res) => {
  try {
    const organizer_id = req.user.id;
    const registrations = await getRegistrationsByOrganizer(organizer_id);
    
    // Enrich with tournament and team details
    const enriched = await Promise.all(registrations.map(async (reg) => {
        // Fetch tournament name
        const tournamentDoc = await db.collection("tournaments").doc(reg.tournament_id).get();
        const tournamentData = tournamentDoc.exists ? tournamentDoc.data() : {};
        
        // Fetch team logo
        const teamDoc = await db.collection("teams").doc(reg.team_id).get();
        const teamData = teamDoc.exists ? teamDoc.data() : {};
        
        return {
            ...reg,
            tournament_name: tournamentData.name || "Unknown Tournament",
            team_logo: teamData.logo_url || null
        };
    }));

    res.json({ registrations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
