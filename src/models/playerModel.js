const { db } = require("../config/firebase");

// Player "model" for Firestore
const COLLECTION_NAME = "players";

const createPlayer = async (playerData) => {
    const playerRef = db.collection(COLLECTION_NAME).doc(); // auto-ID
    const data = {
        name: playerData.name,
        username: playerData.username,
        password_hash: playerData.password_hash,
        team_id: playerData.team_id || null,
        mobile_number: playerData.mobile_number || "",
        role: playerData.role || "Batsman",
        image_url: playerData.image_url || "",
        birthday: playerData.birthday || "",
        is_captain: playerData.is_captain || false,
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

const getPlayerByUsername = async (username) => {
    const snapshot = await db.collection(COLLECTION_NAME).where("username", "==", username).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
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