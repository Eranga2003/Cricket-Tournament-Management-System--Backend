const { db } = require("../config/firebase");

// Player "model" for Firestore
const COLLECTION_NAME = "players";

const createPlayer = async (playerData) => {
    const playerRef = db.collection(COLLECTION_NAME).doc(); // auto-ID
    const data = {
        ...playerData,
        is_active: true,
        total_runs: 0,
        total_wickets: 0,
        matches_played: 0,
        performance_score: 0,
        created_at: new Date(),
    };
    await playerRef.set(data);
    return { id: playerRef.id, ...data };
};

const listPlayersByTeam = async (team_id) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("team_id", "==", team_id).get();
    const players = [];
    snapshot.forEach(doc => {
        players.push({ id: doc.id, ...doc.data() });
    });
    return players;
};

module.exports = { createPlayer, listPlayersByTeam };