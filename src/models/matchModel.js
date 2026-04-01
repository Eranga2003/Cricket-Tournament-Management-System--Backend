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
const assignTeams = async (match_id, team1_id, team2_id) => {
  const matchRef = db.collection(COLLECTION_NAME).doc(match_id);
  await matchRef.update({ team1_id, team2_id });
  return { id: match_id, team1_id, team2_id };
};

// Declare a formally completed match's winner
const setMatchWinner = async (match_id, winner_team_id) => {
  const matchRef = db.collection(COLLECTION_NAME).doc(match_id);
  await matchRef.update({ 
    winner_team_id,
    status: "completed"
  });
  return { id: match_id, winner_team_id, status: "completed" };
};

module.exports = {
  initializeMatches,
  getTourneyMatches,
  assignTeams,
  setMatchWinner
};
