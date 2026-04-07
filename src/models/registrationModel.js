const { db } = require("../config/firebase");

const COLLECTION_NAME = "registrations";

// Apply for a tournament
const applyForTournament = async (data) => {
    const regRef = db.collection(COLLECTION_NAME).doc();
    const registrationData = {
        tournament_id: data.tournament_id,
        team_id: data.team_id,
        team_name: data.team_name, // Store team name for fast organizer lookups
        contact_number: data.contact_number, // Store mobile contact summary
        captain_id: data.captain_id,
        selected_players: data.selected_players || [],
        status: "pending", // pending, approved, arrived, rejected
        payment_status: data.payment_status || "pending", // Capture initial payment status
        qr_code: null,
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

// Match-Day: Scan QR code logic
const verifyAndScanRegistration = async (registrationId, organizerId) => {
    const regRef = db.collection(COLLECTION_NAME).doc(registrationId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) throw new Error("Registration not found");
    const registration = regSnap.data();

    // Verify the logged-in user actually owns this tournament
    const tourneySnap = await db.collection("tournaments").doc(registration.tournament_id).get();
    if (!tourneySnap.exists || tourneySnap.data().organizer_id !== organizerId) {
        throw new Error("Unauthorized restriction: You do not natively own this tournament");
    }

    // Prevent double scans or sneaking in
    if (registration.status !== "approved") {
        throw new Error(`Cannot scan this code. The team's active status is currently: ${registration.status}`);
    }

    // Update their status instantly to arrived
    await regRef.update({ status: "arrived" });
    return { id: registrationId, ...registration, status: "arrived" };
};

module.exports = {
    applyForTournament,
    getRegistrationsByTournament,
    getRegistrationsByCaptain,
    updateRegistrationStatus,
    verifyAndScanRegistration
};
