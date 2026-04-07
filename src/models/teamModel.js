const { db } = require("../config/firebase");

const COLLECTION_NAME = "teams";

const createTeam = async (teamData) => {
  const teamRef = db.collection(COLLECTION_NAME).doc();
  const newTeam = {
    team_name: teamData.team_name,
    username: teamData.username,
    team_email: teamData.team_email,
    password_hash: teamData.password_hash,
    captain_id: teamData.captain_id,
    location: teamData.location,
    logo_url: teamData.logo_url || "",
    status: "active",
    created_at: new Date()
  };
  await teamRef.set(newTeam);
  return { id: teamRef.id, ...newTeam };
};

const getTeams = async () => {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const teams = [];
    snapshot.forEach(doc => teams.push({ id: doc.id, ...doc.data() }));
    return teams;
}

const getTeamById = async (id) => {
   const doc = await db.collection(COLLECTION_NAME).doc(id).get();
   if (!doc.exists) return null;
   return { id: doc.id, ...doc.data() };
};

module.exports = {
  createTeam, getTeams, getTeamById
};