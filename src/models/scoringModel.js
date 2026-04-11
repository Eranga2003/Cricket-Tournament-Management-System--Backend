const { db } = require("../config/firebase");
const admin = require("firebase-admin");

const MATCHES_COL = "matches";
const PLAYERS_COL = "players";
const LIVE_SCORES_COL = "live_scores";

/**
 * Robust Helper: Retrieves the CURRENT ACTIVE innings document
 */
const getActiveLiveScore = async (match_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const matchSnap = await matchRef.get();
  
  if (!matchSnap.exists) throw new Error("Match not found");
  
  const mData = matchSnap.data();
  // We use current_innings_id to know exactly which doc to fetch
  const activeId = mData.current_innings_id || `${match_id}_inn1`;
  
  const liveScoreRef = db.collection(LIVE_SCORES_COL).doc(activeId);
  const lsSnap = await liveScoreRef.get();
  
  if (lsSnap.exists) return { ref: liveScoreRef, data: lsSnap.data() };

  // Compatibility Fallback: If no suffix doc exists, check the legacy matchId doc
  const legacyRef = db.collection(LIVE_SCORES_COL).doc(match_id);
  const legacySnap = await legacyRef.get();
  if (legacySnap.exists) {
      console.log(`[MIGRATION] Matching legacy doc for ${match_id}`);
      return { ref: legacyRef, data: legacySnap.data() };
  }

  throw new Error("Live scoring session not initialized. Please start the match first.");
};

// Initialize Innings 1
const startMatchInnings = async (match_id, data) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const inn1_id = `${match_id}_inn1`;
  const liveScoreRef = db.collection(LIVE_SCORES_COL).doc(inn1_id);
  
  const liveScore = {
    match_id: match_id,
    innings_id: inn1_id,
    innings_number: 1,
    batting_team_id: data.batting_team_id,
    bowling_team_id: data.bowling_team_id,
    total_overs: parseInt(data.total_overs) || 0,
    balls_per_over: parseInt(data.balls_per_over) || 6,
    batting_order: data.batting_order || [], 
    striker_id: data.striker_id || (data.batting_order ? data.batting_order[0] : null),
    non_striker_id: data.non_striker_id || (data.batting_order ? data.batting_order[1] : null),
    bowler_id: data.bowler_id || null,
    total_runs: 0,
    total_wickets: 0,
    current_over: 0,
    balls_in_over: 0,
    wickets_list: [], 
    player_stats: {}, 
    ball_history: [],
    innings_complete: false,
    last_updated: new Date()
  };

  if (data.batting_order) {
    data.batting_order.forEach(pid => {
      liveScore.player_stats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
    });
  }

  await liveScoreRef.set(liveScore);
  
  // Link the innings in the main match doc
  await matchRef.update({ 
    status: "live", 
    innings1_doc_id: inn1_id,
    current_innings_id: inn1_id,
    total_runs: 0, 
    total_wickets: 0,
    has_live_score: true
  });

  return liveScore;
};

// Switch to Innings 2
const switchInnings = async (match_id, data = {}) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const { data: ls1 } = await getActiveLiveScore(match_id);
  
  const inn2_id = `${match_id}_inn2`;
  const liveScoreRef = db.collection(LIVE_SCORES_COL).doc(inn2_id);

  const liveScore = {
    match_id: match_id,
    innings_id: inn2_id,
    innings_number: 2,
    target_runs: ls1.total_runs + 1,
    batting_team_id: ls1.bowling_team_id,
    bowling_team_id: ls1.batting_team_id,
    total_overs: ls1.total_overs,
    balls_per_over: ls1.balls_per_over,
    batting_order: data.batting_order || [],
    striker_id: data.striker_id || (data.batting_order ? data.batting_order[0] : null),
    non_striker_id: data.non_striker_id || (data.batting_order ? data.batting_order[1] : null),
    bowler_id: data.bowler_id || null,
    total_runs: 0,
    total_wickets: 0,
    current_over: 0,
    balls_in_over: 0,
    wickets_list: [], 
    player_stats: {}, 
    ball_history: [],
    innings1_history: ls1.ball_history || [],
    innings1_player_stats: ls1.player_stats || {}, 
    innings1_wickets_list: ls1.wickets_list || [],
    innings1_team_id: ls1.batting_team_id,
    innings_complete: false,
    last_updated: new Date()
  };

  if (data.batting_order) {
    data.batting_order.forEach(pid => {
      liveScore.player_stats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
    });
  }

  await liveScoreRef.set(liveScore);

  await matchRef.update({ 
    innings2_doc_id: inn2_id,
    current_innings_id: inn2_id,
    total_runs: 0, 
    total_wickets: 0
  });

  return liveScore;
};


// --- Standard Operations (Modified to use the active ID automatically) ---

const updateBattingOrder = async (match_id, batting_order) => {
  const { ref, data: ls } = await getActiveLiveScore(match_id);
  ls.batting_order = batting_order;
  batting_order.forEach(pid => {
    if (!ls.player_stats[pid]) {
      ls.player_stats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
    }
  });
  await ref.update({ batting_order, player_stats: ls.player_stats, last_updated: new Date() });
  return batting_order;
};

const processBall = async (match_id, ballData) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const { ref: liveScoreRef, data: ls } = await getActiveLiveScore(match_id);

  const { runs = 0, is_wicket = false, extra_type = null, out_batsman_id = null } = ballData;
  let total_runs_to_add = runs;
  let is_valid_ball = true;
  let batsman_runs = runs;

  if (extra_type === "wide" || extra_type === "no-ball") {
    total_runs_to_add = runs + 1;
    if (extra_type === "wide") batsman_runs = 0;
    is_valid_ball = false;
  } else if (extra_type === "bye" || extra_type === "leg-bye") {
    batsman_runs = 0;
  }

  ls.total_runs += total_runs_to_add;

  if (is_wicket) {
    ls.total_wickets += 1;
    const targetWicketIdStr = String(out_batsman_id || ls.striker_id);
    ls.wickets_list.push(targetWicketIdStr);
    
    if (String(ls.striker_id) === targetWicketIdStr) ls.striker_id = null;
    else if (String(ls.non_striker_id) === targetWicketIdStr) ls.non_striker_id = null;

    if (ls.bowler_id) {
       if (!ls.player_stats[ls.bowler_id]) ls.player_stats[ls.bowler_id] = { wickets:0, runs_conceded:0, balls_bowled:0 };
       ls.player_stats[ls.bowler_id].wickets += 1;
       await db.collection(PLAYERS_COL).doc(ls.bowler_id).update({ total_wickets: admin.firestore.FieldValue.increment(1) });
    }
  }

  if (ls.striker_id) {
    if (!ls.player_stats[ls.striker_id]) ls.player_stats[ls.striker_id] = { runs:0, balls:0 };
    ls.player_stats[ls.striker_id].runs += batsman_runs;
    if (is_valid_ball) ls.player_stats[ls.striker_id].balls += 1;
    if (batsman_runs > 0) await db.collection(PLAYERS_COL).doc(ls.striker_id).update({ total_runs: admin.firestore.FieldValue.increment(batsman_runs) });
  }

  if (ls.bowler_id) {
    if (!ls.player_stats[ls.bowler_id]) ls.player_stats[ls.bowler_id] = { wickets:0, runs_conceded:0, balls_bowled:0 };
    ls.player_stats[ls.bowler_id].runs_conceded += total_runs_to_add;
    if (is_valid_ball) ls.player_stats[ls.bowler_id].balls_bowled += 1;
  }

  if ((runs === 1 || runs === 3) && ls.striker_id && ls.non_striker_id) {
    const temp = ls.striker_id; ls.striker_id = ls.non_striker_id; ls.non_striker_id = temp;
  }

  if (is_valid_ball) {
    ls.balls_in_over += 1;
    if (ls.balls_in_over >= ls.balls_per_over) {
      ls.current_over += 1; ls.balls_in_over = 0; ls.bowler_id = null;
      // Always swap strikers at end of over to handle shift in bowling end
      const temp = ls.striker_id; ls.striker_id = ls.non_striker_id; ls.non_striker_id = temp;
      
      if (ls.current_over >= ls.total_overs) ls.innings_complete = true;
    }
  }

  if (ls.innings_number === 2 && ls.target_runs && ls.total_runs >= ls.target_runs) ls.innings_complete = true;

  ls.ball_history = ls.ball_history || [];
  ls.ball_history.push({ 
    over:ls.current_over, 
    ball:ls.balls_in_over, 
    runs, 
    total_score:ls.total_runs, 
    extra:extra_type, 
    is_wicket, 
    striker:ls.striker_id, 
    nonStriker:ls.non_striker_id, 
    bowler:ls.bowler_id, 
    timestamp:new Date() 
  });
  // Removed shift() to preserve full history for analytics X-Y charts

  // --- WINNER CONCLUSION LOGIC ---
  if (ls.innings_complete) {
    let winner_team_id = null;
    let match_summary = "";

    if (ls.innings_number === 2) {
      const matchData = (await matchRef.get()).data();
      const teamAName = matchData.team1_name || "Team A";
      const teamBName = matchData.team2_name || "Team B";

      if (ls.total_runs >= ls.target_runs) {
        winner_team_id = ls.batting_team_id;
        match_summary = `${teamBName} won by ${10 - ls.total_wickets} wickets!`;
      } else {
        winner_team_id = ls.bowling_team_id;
        match_summary = `${teamAName} won by ${ls.target_runs - ls.total_runs - 1} runs!`;
      }
      
      // --- MVP CALCULATION ---
      let best_batsman_id = null;
      let max_runs = -1;
      let best_bowler_id = null;
      let max_wickets = -1;

      // Pool all players from both innings to find the ultimate match MVP
      const combinedStats = {};
      [ls.innings1_player_stats, ls.player_stats].forEach(ps => {
          if (!ps) return;
          Object.entries(ps).forEach(([pid, stats]) => {
              if (!combinedStats[pid]) combinedStats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
              combinedStats[pid].runs += (stats.runs || 0);
              combinedStats[pid].balls += (stats.balls || 0);
              combinedStats[pid].wickets += (stats.wickets || 0);
              combinedStats[pid].runs_conceded += (stats.runs_conceded || 0);
              combinedStats[pid].balls_bowled += (stats.balls_bowled || 0);
          });
      });

      Object.entries(combinedStats).forEach(([pid, stats]) => {
          if (stats.runs > max_runs) {
              max_runs = stats.runs;
              best_batsman_id = pid;
          }
          if (stats.wickets > max_wickets) {
              max_wickets = stats.wickets;
              best_bowler_id = pid;
          } else if (stats.wickets === max_wickets && stats.wickets >= 0) {
              // Tie-break for bowler: fewer runs conceded
              const currentBest = combinedStats[best_bowler_id] || { runs_conceded: 9999 };
              if (stats.runs_conceded < currentBest.runs_conceded) {
                  best_bowler_id = pid;
              }
          }
      });

      await matchRef.update({ 
        winner_team_id, 
        match_summary, 
        status: "completed",
        best_batsman_id,
        best_bowler_id
      });
    }
  }

  await liveScoreRef.update({ ...ls, last_updated: new Date() });
  await matchRef.update({ total_runs: ls.total_runs, total_wickets: ls.total_wickets });


  return ls;
};

const swapBatsman = async (match_id, new_batsman_id) => {
  const { ref, data: ls } = await getActiveLiveScore(match_id);
  
  // Intelligent Slot Filling: Detect which slot is null and fill it
  if (!ls.striker_id) {
    ls.striker_id = new_batsman_id;
  } else if (!ls.non_striker_id) {
    ls.non_striker_id = new_batsman_id;
  } else {
    // Default to striker if both are somehow filled or null
    ls.striker_id = new_batsman_id;
  }

  await ref.update({ 
    striker_id: ls.striker_id, 
    non_striker_id: ls.non_striker_id, 
    last_updated: new Date() 
  });
  return ls;
};

const swapBowler = async (match_id, new_bowler_id) => {
  const { ref, data: ls } = await getActiveLiveScore(match_id);
  ls.bowler_id = new_bowler_id;
  await ref.update({ bowler_id: new_bowler_id, last_updated: new Date() });
  return ls;
};

const reverseBall = async (match_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const { ref, data: ls } = await getActiveLiveScore(match_id);
  if (!ls.ball_history || ls.ball_history.length === 0) throw new Error("No balls to undo!");
  const lastBall = ls.ball_history.pop();
  const runs_to_remove = (lastBall.runs || 0) + (lastBall.extra ? 1 : 0);
  ls.total_runs -= runs_to_remove;
  if (lastBall.is_wicket) ls.total_wickets -= 1;
  ls.current_over = lastBall.over; ls.balls_in_over = lastBall.ball;
  ls.striker_id = lastBall.striker;
  ls.non_striker_id = lastBall.nonStriker; // Restore both slots
  ls.bowler_id = lastBall.bowler;
  if (lastBall.is_wicket) ls.wickets_list.pop();
  await ref.update({ ...ls, last_updated: new Date() });
  await matchRef.update({ total_runs: ls.total_runs, total_wickets: ls.total_wickets });
  return ls;
};

const resetMatchInnings = async (match_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const { ref, data: ls } = await getActiveLiveScore(match_id);
  ls.total_runs = 0; ls.total_wickets = 0; ls.current_over = 0; ls.balls_in_over = 0; ls.wickets_list = []; ls.ball_history = []; ls.innings_complete = false;
  Object.keys(ls.player_stats).forEach(pid => { ls.player_stats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 }; });
  await ref.set(ls);
  await matchRef.update({ total_runs: 0, total_wickets: 0 });
  return ls;
};

const archiveFinalMatchReport = async (match_id) => {
  const matchRef = db.collection(MATCHES_COL).doc(match_id);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) throw new Error("Match not found");
  const matchData = matchSnap.data();

  const inn1_id = `${match_id}_inn1`;
  const inn2_id = `${match_id}_inn2`;

  const inn1Snap = await db.collection(LIVE_SCORES_COL).doc(inn1_id).get();
  const inn2Snap = await db.collection(LIVE_SCORES_COL).doc(inn2_id).get();

  const report = {
    match_id,
    tournament_id: matchData.tournament_id,
    match_details: matchData,
    innings1: inn1Snap.exists ? inn1Snap.data() : null,
    innings2: inn2Snap.exists ? inn2Snap.data() : null,
    archived_at: new Date(),
    summary: matchData.match_summary || "Match completed",
    winner_team_id: matchData.winner_team_id || null,
    mvps: {
        best_batsman_id: matchData.best_batsman_id || null,
        best_bowler_id: matchData.best_bowler_id || null
    }
  };

  // Securely store the final record
  await db.collection("completed_match_reports").doc(match_id).set(report);

  // Update original match doc
  await matchRef.update({
    status: "completed",
    is_archived: true,
    archived_at: new Date()
  });

  return report;
};

module.exports = {
  startMatchInnings,
  updateBattingOrder,
  processBall,
  swapBatsman,
  swapBowler,
  reverseBall,
  resetMatchInnings,
  switchInnings,
  archiveFinalMatchReport
};
