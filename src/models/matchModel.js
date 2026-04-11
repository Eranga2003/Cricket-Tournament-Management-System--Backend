const { db } = require("../config/firebase");

const COLLECTION_NAME = "matches";

// Create placeholder matches based on total count
const initializeMatches = async (tournament_id, total_matches) => {
  const matches = [];
  const batch = db.batch();

  for (let i = 1; i <= total_matches; i++) {
    const matchRef = db.collection(COLLECTION_NAME).doc();
    const is_final = i === total_matches; // The last chronological match is the grand final
    
    const matchData = {
      tournament_id,
      match_number: i,
      team1_id: null,
      team2_id: null,
      winner_team_id: null,
      status: "scheduled", // scheduled, live, completed
      total_overs: 10, // Default 10 overs
      balls_per_over: 6, // Default 6 balls
      is_final,
      created_at: new Date()
    };
    
    batch.set(matchRef, matchData);
    matches.push({ id: matchRef.id, ...matchData });
  }

  await batch.commit();
  return matches;
};

// Get all matches for a tournament
const getTourneyMatches = async (tournament_id) => {
  const snapshot = await db.collection(COLLECTION_NAME)
    .where("tournament_id", "==", tournament_id)
    .get();

  const matches = [];
  snapshot.forEach(doc => matches.push({ id: doc.id, ...doc.data() }));
  
  // Sort heavily in memory to completely bypass complex manual Firestore Composite Indexing setups for the user
  return matches.sort((a, b) => a.match_number - b.match_number);
};

// Update teams for a match
const assignTeams = async (match_id, team1_id, team2_id, team1_name, team2_name) => {
  const matchRef = db.collection(COLLECTION_NAME).doc(match_id);
  await matchRef.update({ 
    team1_id, 
    team2_id,
    team1_name: team1_name || "Team 1",
    team2_name: team2_name || "Team 2"
  });
  return { id: match_id, team1_id, team2_id, team1_name, team2_name };
};

// Declare a formally completed match's winner
const setMatchWinner = async (match_id, winner_team_id) => {
  const matchRef = db.collection(COLLECTION_NAME).doc(match_id);
  await matchRef.update({ 
    winner_team_id,
    status: "Completed"
  });
  return { id: match_id, winner_team_id, status: "Completed" };
};

// Create a single match manually (Ad-Hoc)
const createAdHocMatch = async (data) => {
  const matchRef = db.collection(COLLECTION_NAME).doc();
  const matchData = {
    tournament_id: data.tournament_id,
    match_number: data.match_number || 1,
    team1_id: data.team1_id,
    team2_id: data.team2_id,
    team1_name: data.team1_name,
    team2_name: data.team2_name,
    status: "scheduled",
    total_overs: data.total_overs || 10,
    balls_per_over: data.balls_per_over || 6,
    is_final: data.is_final || false,
    created_at: new Date()
  };
  await matchRef.set(matchData);
  return { id: matchRef.id, ...matchData };
};

module.exports = {
  initializeMatches,
  getTourneyMatches,
  assignTeams,
  setMatchWinner,
  createAdHocMatch
};

