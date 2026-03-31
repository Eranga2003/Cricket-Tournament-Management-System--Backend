const {
    applyForTournament,
    getRegistrationsByTournament,
    getRegistrationsByCaptain,
    updateRegistrationStatus
} = require("../models/registrationModel");

exports.applyTournament = async (req, res) => {
    try {
        const captain_id = req.user.id; // from JWT
        const { tournament_id, team_id, selected_players } = req.body;

        if (!tournament_id || !team_id) {
            return res.status(400).json({ msg: "tournament_id and team_id are required" });
        }

        const registration = await applyForTournament({
            tournament_id,
            team_id,
            captain_id,
            selected_players: selected_players || []
        });

        console.log(`📋 Team ${team_id} applied for Tournament ${tournament_id}`);
        res.json({ msg: "Registration applied successfully", registration });

    } catch (err) {
        console.error("❌ Apply tournament error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getTournamentRegistrations = async (req, res) => {
    try {
        const { id } = req.params; // tournament_id
        const registrations = await getRegistrationsByTournament(id);
        res.json({ registrations });
    } catch (err) {
        console.error("❌ Fetch tournament registrations error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getMyRegistrations = async (req, res) => {
    try {
        const captain_id = req.user.id; // from JWT
        const registrations = await getRegistrationsByCaptain(captain_id);
        res.json({ registrations });
    } catch (err) {
        console.error("❌ Fetch my registrations error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.approveOrReject = async (req, res) => {
    try {
        const { id } = req.params; // registration id
        const { status } = req.body; // 'approved' or 'rejected'

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ msg: "Status must be 'approved' or 'rejected'" });
        }

        let qr_code = null;
        if (status === "approved") {
            qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-${id}`;
        }

        const updated = await updateRegistrationStatus(id, status, qr_code);

        res.json({ msg: `Registration ${status}`, registration: updated });
    } catch (err) {
        console.error("❌ Update status error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
