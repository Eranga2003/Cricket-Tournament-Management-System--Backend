const {
  initializeMatches,
  getTourneyMatches,
  assignTeams,
  setMatchWinner,
  createAdHocMatch
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
    const { team1_id, team2_id, team1_name, team2_name } = req.body;

    const matchSnap = await db.collection("matches").doc(match_id).get();
    if (!matchSnap.exists) return res.status(404).json({ msg: "Match completely missing" });

    await verifyOrganizer(matchSnap.data().tournament_id, req.user.id);

    const updated = await assignTeams(match_id, team1_id, team2_id, team1_name, team2_name);
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

exports.getMatchById = async (req, res) => {
  try {
    const { match_id } = req.params;
    const matchSnap = await db.collection("matches").doc(match_id).get();
    
    if (!matchSnap.exists) {
      return res.status(404).json({ msg: "Match totally missing from the stadium records" });
    }

    const matchData = matchSnap.data();
    
    // Joint Fetch: Check for dedicated live score across dual-innings architecture
    let live_score = matchData.live_score || null;
    try {
        // Resolve the active innings ID: Priority 1: Pointer, P2: Innings 1 Suffix, P3: Legacy Match ID
        const activeLSId = matchData.current_innings_id || `${match_id}_inn1`;
        
        let lsSnap = await db.collection("live_scores").doc(activeLSId).get();
        
        // Final fallback: Check for legacy absolute ID if the others are missing
        if (!lsSnap.exists && activeLSId !== match_id) {
            lsSnap = await db.collection("live_scores").doc(match_id).get();
        }

        if (lsSnap.exists) {
            live_score = lsSnap.data();
        }
    } catch (err) {
        console.warn("Live score synchronization bridge failed:", err);
    }

    
    // Enrich with Team Names & Logos (Prioritize stored names, fallback to lookups)
    let team1_name = matchData.team1_name || "Team 1";
    let team2_name = matchData.team2_name || "Team 2";
    let team1_logo = matchData.team1_logo || "";
    let team2_logo = matchData.team2_logo || "";

    if (matchData.team1_id && (!matchData.team1_logo || team1_logo === "")) {
        const t1Snap = await db.collection("teams").doc(matchData.team1_id).get();
        if (t1Snap.exists) {
            team1_name = t1Snap.data().team_name || t1Snap.data().name || team1_name;
            team1_logo = t1Snap.data().logo_url || "";
        }
    }
    if (matchData.team2_id && (!matchData.team2_logo || team2_logo === "")) {
        const t2Snap = await db.collection("teams").doc(matchData.team2_id).get();
        if (t2Snap.exists) {
            team2_name = t2Snap.data().team_name || t2Snap.data().name || team2_name;
            team2_logo = t2Snap.data().logo_url || "";
        }
    }

    res.json({ 
        match: { 
            id: matchSnap.id, 
            ...matchData,
            live_score, // Unified scoring object
            team1_name,
            team2_name,
            team1_logo,
            team2_logo
        } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createMatch = async (req, res) => {
  try {
    const { tournament_id, team1_id, team2_id, team1_name, team2_name, match_number } = req.body;
    
    if (!tournament_id || !team1_id || !team2_id) {
      return res.status(400).json({ msg: "Missing critical match data (Tournament or Teams)" });
    }

    await verifyOrganizer(tournament_id, req.user.id);

    const match = await createAdHocMatch({
      tournament_id,
      team1_id,
      team2_id,
      team1_name,
      team2_name,
      match_number
    });

    res.status(201).json({ msg: "Battle formally established!", match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
