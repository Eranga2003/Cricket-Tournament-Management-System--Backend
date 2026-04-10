// src/models/tournamentModel.js

const { db } = require("../config/firebase");

// ===============================
// CREATE TOURNAMENT
// ===============================
const createTournament = async (data) => {
    const tournamentRef = db.collection("tournaments").doc();

    const tournamentData = {
        organizer_id: data.organizer_id,
        name: data.name,
        date_time: data.date_time,

        registration_fee: data.registration_fee || 0,
        location: data.location || "",
        overs: data.overs || 0,
        balls_per_over: data.balls_per_over || 6,

        prize_1st: data.prize_1st || 0,
        prize_2nd: data.prize_2nd || 0,
        prize_3rd: data.prize_3rd || 0,

        contact_numbers: data.contact_numbers || [],
        ground_images: data.ground_images || [],

        share_link: `https://yourapp.com/tournament/${tournamentRef.id}`,

        status: "upcoming",
        is_live: false,

        created_at: new Date()
    };

    await tournamentRef.set(tournamentData);

    return { id: tournamentRef.id, ...tournamentData };
};

// ===============================
// GET ALL TOURNAMENTS
// ===============================
const getAllTournaments = async () => {
    const snapshot = await db.collection("tournaments").get();

    const tournaments = [];
    snapshot.forEach(doc => {
        tournaments.push({ id: doc.id, ...doc.data() });
    });

    return tournaments;
};

// ===============================
// GET TOURNAMENTS BY ORGANIZER
// ===============================
const getTournamentsByOrganizer = async (organizer_id) => {
    const snapshot = await db
        .collection("tournaments")
        .where("organizer_id", "==", organizer_id)
        .get();

    const tournaments = [];
    snapshot.forEach(doc => {
        tournaments.push({ id: doc.id, ...doc.data() });
    });

    return tournaments;
};

// ===============================
// GET TOURNAMENT BY ID
// ===============================
const getTournamentById = async (id) => {
    const doc = await db.collection("tournaments").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

module.exports = {
    createTournament,
    getAllTournaments,
    getTournamentsByOrganizer,
    getTournamentById
};