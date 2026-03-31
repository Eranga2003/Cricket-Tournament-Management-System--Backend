const { db } = require("../config/firebase");

// ===============================
// CREATE TOURNAMENT
// ===============================
exports.createTournament = async (req, res) => {
    try {
        const organizer_id = req.user.id; // From JWT

        const {
            name,
            date_time,
            registration_fee,
            location,
            overs,
            balls_per_over,
            prize_1st,
            prize_2nd,
            prize_3rd,
            contact_numbers,
            ground_images
        } = req.body;

        // ✅ Validation
        if (!name || !date_time) {
            return res.status(400).json({
                msg: "name and date_time are required"
            });
        }

        // Create tournament doc
        const tournamentRef = db.collection("tournaments").doc();

        const tournamentData = {
            organizer_id,
            name,
            date_time,
            registration_fee: registration_fee || 0,
            location: location || "",
            overs: overs || 0,
            balls_per_over: balls_per_over || 6,
            prize_1st: prize_1st || 0,
            prize_2nd: prize_2nd || 0,
            prize_3rd: prize_3rd || 0,
            contact_numbers: contact_numbers || [],
            ground_images: ground_images || [],
            share_link: `https://yourapp.com/tournament/${tournamentRef.id}`,
            status: "upcoming",
            is_live: false,
            created_at: new Date()
        };

        await tournamentRef.set(tournamentData);

        // ✅ Terminal log
        console.log(`🏆 Tournament Created: ${name} by Organizer: ${organizer_id}`);

        res.json({
            msg: "Tournament created successfully",
            tournament: { id: tournamentRef.id, ...tournamentData }
        });

    } catch (err) {
        console.error("❌ Tournament creation error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// GET ALL TOURNAMENTS
// ===============================
exports.getTournaments = async (req, res) => {
    try {
        const snapshot = await db.collection("tournaments").get();

        if (snapshot.empty) {
            return res.json({ tournaments: [] });
        }

        const tournaments = [];
        snapshot.forEach(doc => {
            tournaments.push({ id: doc.id, ...doc.data() });
        });

        res.json({ tournaments });

    } catch (err) {
        console.error("❌ Get tournaments error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// GET TOURNAMENTS OF LOGGED-IN ORGANIZER
// ===============================
exports.getMyTournaments = async (req, res) => {
    try {
        const organizer_id = req.user.id; // from JWT

        const snapshot = await db
            .collection("tournaments")
            .where("organizer_id", "==", organizer_id)
            .get();

        if (snapshot.empty) {
            return res.json({ tournaments: [] });
        }

        const tournaments = [];
        snapshot.forEach((doc) => {
            tournaments.push({ id: doc.id, ...doc.data() });
        });

        res.json({ tournaments });

    } catch (err) {
        console.error("❌ Fetch tournaments error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// GET TOURNAMENTS BY ORGANIZER (Public)
// ===============================
exports.getTournamentsByOrganizer = async (req, res) => {
    try {
        const { organizer_id } = req.params;

        const snapshot = await db
            .collection("tournaments")
            .where("organizer_id", "==", organizer_id)
            .get();

        const tournaments = [];
        snapshot.forEach(doc => {
            tournaments.push({ id: doc.id, ...doc.data() });
        });

        res.json({ tournaments });

    } catch (err) {
        console.error("❌ Organizer tournaments error:", err.message);
        res.status(500).json({ error: err.message });
    }
};