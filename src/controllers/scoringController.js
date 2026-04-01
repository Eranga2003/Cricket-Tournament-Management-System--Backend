const {
  startMatchInnings,
  processBall,
  swapBatsman,
  swapBowler
} = require("../models/scoringModel");
const { db } = require("../config/firebase");

// 👮 Verify Logged-In Organizer securely legally owns the Match they are actively scoring
const verifyMatchOrganizer = async (match_id, organizer_id) => {
  const matchSnap = await db.collection("matches").doc(match_id).get();
  if (!matchSnap.exists) throw new Error("Match missing");
  
  const tourneySnap = await db.collection("tournaments").doc(matchSnap.data().tournament_id).get();
  if (!tourneySnap.exists || tourneySnap.data().organizer_id !== organizer_id) {
     throw new Error("Unauthorized Security Stop: You aren't natively the organizer of this tournament's live game.");
  }
};

exports.startInnings = async (req, res) => {
  try {
    const { match_id } = req.params;
    await verifyMatchOrganizer(match_id, req.user.id);
    
    // Explicitly mapping team components as requested
    const { batting_team_id, bowling_team_id, striker_id, non_striker_id, bowler_id } = req.body;

    const liveScore = await startMatchInnings(match_id, {
      batting_team_id,
      bowling_team_id,
      striker_id,
      non_striker_id,
      bowler_id
    });

    res.json({ msg: "Innings permanently started!", liveScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recordBall = async (req, res) => {
  try {
    const { match_id } = req.params;
    await verifyMatchOrganizer(match_id, req.user.id);

    const { runs, is_wicket, extra_type } = req.body;
    
    const liveScore = await processBall(match_id, { runs, is_wicket, extra_type });

    res.json({ msg: "Ball actively processed!", liveScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeBatsman = async (req, res) => {
  try {
    const { match_id } = req.params;
    await verifyMatchOrganizer(match_id, req.user.id);
    
    const { new_batsman_id } = req.body;
    const liveScore = await swapBatsman(match_id, new_batsman_id);
    res.json({ msg: "Batsman effortlessly rotated in!", liveScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeBowler = async (req, res) => {
  try {
    const { match_id } = req.params;
    await verifyMatchOrganizer(match_id, req.user.id);
    
    const { new_bowler_id } = req.body;
    const liveScore = await swapBowler(match_id, new_bowler_id);
    res.json({ msg: "Bowler firmly changed natively!", liveScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
