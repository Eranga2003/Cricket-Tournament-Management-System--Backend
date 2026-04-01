const { db } = require("../config/firebase");
const admin = require("firebase-admin"); // Required for atomic increments

const MATCHES_COL = "matches";
const PLAYERS_COL = "players";

// Initialize the live_score object locally inside the match document
const startMatchInnings = async (match_id, data) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  
  const liveScore = {
    batting_team_id: data.batting_team_id,
    bowling_team_id: data.bowling_team_id,
    striker_id: data.striker_id,
    non_striker_id: data.non_striker_id,
    bowler_id: data.bowler_id,
    total_runs: 0,
    total_wickets: 0,
    current_over: 0,
    balls_in_over: 0
  };

  await matchRef.update({ live_score: liveScore, status: "live" });
  return liveScore;
};

// Process an individual ball recursively 
const processBall = async (match_id, ballData) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const matchSnap = await matchRef.get();
  
  if (!matchSnap.exists) throw new Error("Match not found");
  
  let ls = matchSnap.data().live_score;
  if (!ls) throw new Error("Innings formally have not started yet");

  const { runs = 0, is_wicket = false, extra_type = null } = ballData;

  let total_runs_to_add = runs;
  let is_valid_ball = true;

  // 1. Math for Wides and No-Balls (They typically add 1 extra run cleanly and don't cost a ball)
  if (extra_type === "wide" || extra_type === "no-ball") {
    total_runs_to_add += 1;
    is_valid_ball = false; 
  }

  ls.total_runs += total_runs_to_add;

  // 2. Mathematically Process Wickets
  if (is_wicket) {
    ls.total_wickets += 1;
    ls.striker_id = null; // Triggers frontend to actively force new batsman selection
    
    // Natively auto-update the Bowler's permanent Player Profile in Firestore!
    if (ls.bowler_id) {
       await db.collection(PLAYERS_COL).doc(ls.bowler_id).update({
         total_wickets: admin.firestore.FieldValue.increment(1)
       });
    }
  }

  // 3. Process Valid Balls (Increment overs, rotate strike natively, update batsman runs)
  if (is_valid_ball) {
    ls.balls_in_over += 1;

    // Securely natively increment Batsman's permanent Profile runs!
    if (ls.striker_id && extra_type !== "bye" && extra_type !== "leg-bye") {
        await db.collection(PLAYERS_COL).doc(ls.striker_id).update({
            total_runs: admin.firestore.FieldValue.increment(runs)
        });
    }

    // Auto-Rotate Strike logically for odd runs (1, 3)
    if ((runs === 1 || runs === 3) && ls.striker_id && ls.non_striker_id) {
      const temp = ls.striker_id;
      ls.striker_id = ls.non_striker_id;
      ls.non_striker_id = temp;
    }

    // Process Over Completion
    if (ls.balls_in_over === 6) {
      ls.current_over += 1;
      ls.balls_in_over = 0;
      ls.bowler_id = null; // Triggers frontend to pick the next over's bowler

      // Over change physically automatically rotates the strike
      if (ls.striker_id && ls.non_striker_id) {
        const temp = ls.striker_id;
        ls.striker_id = ls.non_striker_id;
        ls.non_striker_id = temp;
      }
    }
  }

  // Atomic database update
  await matchRef.update({ live_score: ls });
  return ls;
};

// Frontend API hook for new Batsman
const swapBatsman = async (match_id, new_batsman_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const matchSnap = await matchRef.get();
  let ls = matchSnap.data().live_score;

  ls.striker_id = new_batsman_id;
  await matchRef.update({ live_score: ls });
  return ls;
};

// Frontend API hook for new Bowler
const swapBowler = async (match_id, new_bowler_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const matchSnap = await matchRef.get();
  let ls = matchSnap.data().live_score;

  ls.bowler_id = new_bowler_id;
  await matchRef.update({ live_score: ls });
  return ls;
};

module.exports = {
  startMatchInnings,
  processBall,
  swapBatsman,
  swapBowler
};
