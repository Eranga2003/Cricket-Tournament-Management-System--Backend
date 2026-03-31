const { db } = require("../config/firebase");

const COLLECTION_NAME = "registrations";

// Apply for a tournament
const applyForTournament = async (data) => {
    const regRef = db.collection(COLLECTION_NAME).doc();
    const registrationData = {
        tournament_id: data.tournament_id,
        team_id: data.team_id,
        captain_id: data.captain_id,
        selected_players: data.selected_players || [],
        status: "pending", // pending, approved, rejected
        payment_status: "pending", // pending, paid
        qr_code: null, // generate upon approval
        created_at: new Date()
    };

    await regRef.set(registrationData);
    return { id: regRef.id, ...registrationData };
};

// Organizer views requests
const getRegistrationsByTournament = async (tournament_id) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("tournament_id", "==", tournament_id).get();
    const registrations = [];
    snapshot.forEach(doc => registrations.push({ id: doc.id, ...doc.data() }));
    return registrations;
};

// Captain views their team statuses
const getRegistrationsByCaptain = async (captain_id) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("captain_id", "==", captain_id).get();
    const registrations = [];
    snapshot.forEach(doc => registrations.push({ id: doc.id, ...doc.data() }));
    return registrations;
};

// Update registration status
const updateRegistrationStatus = async (id, status, qr_code = null) => {
    const regRef = db.collection(COLLECTION_NAME).doc(id);
    const updates = { status };
    if (qr_code) updates.qr_code = qr_code;

    await regRef.update(updates);
    return { id, status, qr_code };
};

module.exports = {
    applyForTournament,
    getRegistrationsByTournament,
    getRegistrationsByCaptain,
    updateRegistrationStatus
};
