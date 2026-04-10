const { db } = require("../config/firebase");

const COLLECTION_NAME = "registrations";
const TOURNAMENTS_COLLECTION = "tournaments";

// Get single registration by ID
const getRegistrationById = async (id) => {
    const regSnap = await db.collection(COLLECTION_NAME).doc(id).get();
    return regSnap.exists ? { id: regSnap.id, ...regSnap.data() } : null;
};

// Apply for a tournament
const applyForTournament = async (data) => {
    const regRef = db.collection(COLLECTION_NAME).doc();
    const registrationData = {
        tournament_id: data.tournament_id,
        organizer_id: data.organizer_id, // Added: Store organizer ID for direct dashboard lookups
        team_id: data.team_id,
        team_name: data.team_name, 
        contact_number: data.contact_number, 
        captain_id: data.captain_id,
        selected_players: data.selected_players || [],
        status: "pending", 
        payment_status: data.payment_status || "pending", 
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

// Team Account views their statuses
const getRegistrationsByTeam = async (team_id) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("team_id", "==", team_id).get();
    const registrations = [];
    snapshot.forEach(doc => registrations.push({ id: doc.id, ...doc.data() }));
    return registrations;
};

// Organizer views all registrations for their tournaments
const getRegistrationsByOrganizer = async (organizer_id) => {
    // Strategy 1: Direct lookup (best for new registrations)
    const directSnapshot = await db.collection(COLLECTION_NAME).where("organizer_id", "==", organizer_id).get();
    const directResults = [];
    directSnapshot.forEach(doc => directResults.push({ id: doc.id, ...doc.data() }));

    // Strategy 2: Tournament-based lookup (best for legacy registrations or data consistency)
    const tournamentSnap = await db.collection("tournaments").where("organizer_id", "==", organizer_id).get();
    const tournamentIds = [];
    tournamentSnap.forEach(doc => tournamentIds.push(doc.id));

    if (tournamentIds.length === 0) return directResults;

    // Fetch registrations for these tournaments
    // Note: Firestore 'in' limit is 30, so if there are more than 30 tournaments, we might need multiple queries.
    // For now, we'll do a simple batch or just one if it's small.
    const legacyResults = [];
    // Split into chunks of 30 if needed
    for (let i = 0; i < tournamentIds.length; i += 30) {
        const chunk = tournamentIds.slice(i, i + 30);
        const legacySnap = await db.collection(COLLECTION_NAME).where("tournament_id", "in", chunk).get();
        legacySnap.forEach(doc => {
            if (!directResults.some(r => r.id === doc.id)) {
                legacyResults.push({ id: doc.id, ...doc.data() });
            }
        });
    }

    return [...directResults, ...legacyResults];
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
    getRegistrationById,
    getRegistrationsByTournament,
    getRegistrationsByCaptain,
    getRegistrationsByTeam,
    getRegistrationsByOrganizer,
    updateRegistrationStatus,
    verifyAndScanRegistration
};
