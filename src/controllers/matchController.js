const {
  initializeMatches,
  getTourneyMatches,
  assignTeams,
  setMatchWinner
} = require("../models/matchModel");
const { db } = require("../config/firebase");

// 👮 Internal middleware helper: Verify logged-in Organizer actually manages the target tournament safely
const verifyOrganizer = async (tournament_id, organizer_id) => {
  const tSnap = await db.collection("tournaments").doc(tournament_id).get();
  if (!tSnap.exists || tSnap.data().organizer_id !== organizer_id) {
    throw new Error("Unauthorized Security Block: You do not own this tournament layout.");
  }
};

exports.setupSchedule = async (req, res) => {
  try {
    const { tournament_id, total_matches } = req.body;
    if (!tournament_id || !total_matches) {
      return res.status(400).json({ msg: "Provide identically both tournament_id and total_matches" });
    }

    await verifyOrganizer(tournament_id, req.user.id);

    const matches = await initializeMatches(tournament_id, total_matches);
    console.log(`🏟️ Match layout created! ${total_matches} games scheduled natively.`);
    res.json({ msg: `Successfully instantly generated ${total_matches} matches!`, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.slotTeams = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { team1_id, team2_id } = req.body;

    const matchSnap = await db.collection("matches").doc(match_id).get();
    if (!matchSnap.exists) return res.status(404).json({ msg: "Match completely missing" });

    await verifyOrganizer(matchSnap.data().tournament_id, req.user.id);

    const updated = await assignTeams(match_id, team1_id, team2_id);
    res.json({ msg: "Teams elegantly assigned to the match!", match: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.declareWinner = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { winner_team_id } = req.body;

    const matchSnap = await db.collection("matches").doc(match_id).get();
    if (!matchSnap.exists) return res.status(404).json({ msg: "Match utterly missing" });

    await verifyOrganizer(matchSnap.data().tournament_id, req.user.id);

    const updated = await setMatchWinner(match_id, winner_team_id);
    const isFinal = matchSnap.data().is_final;

    res.json({ 
      msg: isFinal ? "🏆 GRAND FINAL WINNER OFFICIALLY CROWNED!" : "Match winner properly recorded!", 
      match: updated 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const matches = await getTourneyMatches(tournament_id);
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
