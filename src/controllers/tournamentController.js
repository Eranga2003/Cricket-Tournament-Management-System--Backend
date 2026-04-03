const { db } = require("../config/firebase");
const { uploadImage } = require("../services/storageService");
const { getWeatherByLocation } = require("../services/weatherService"); // Added weather service

// ===============================
// GET TOURNAMENT BY ID (with Weather)
// ===============================
exports.getTournamentById = async (req, res) => {
    try {
        const { id } = req.params;
        const tournamentDoc = await db.collection("tournaments").doc(id).get();

        if (!tournamentDoc.exists) {
            return res.status(404).json({ msg: "Tournament not found" });
        }

        const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() };

        // Attempt to fetch weather for the tournament date and location
        let weather = null;
        if (tournamentData.location && tournamentData.date_time) {
            weather = await getWeatherByLocation(tournamentData.location, tournamentData.date_time);
        }

        res.json({
            msg: "Tournament details retrieved",
            tournament: tournamentData,
            weather: weather // This will contain the forecast
        });

    } catch (err) {
        console.error("❌ Get tournament by ID error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

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
            near_city
        } = req.body;

        let { ground_images } = req.body;
        if (!Array.isArray(ground_images)) ground_images = [];

        // Handle multiple image uploads if they exist (from req.files)
        if (req.files && req.files.length > 0) {
            try {
                const bucketName = process.env.SUPABASE_BUCKET || "logos";
                const uploadPromises = req.files.map(file => uploadImage(file, bucketName));
                const uploadedUrls = await Promise.all(uploadPromises);
                ground_images = [...ground_images, ...uploadedUrls];
                console.log(`✅ ${req.files.length} ground images uploaded to Supabase bucket: ${bucketName}`);
            } catch (uploadErr) {
                console.error("❌ Multiple image upload error:", uploadErr.message);
                return res.status(500).json({ msg: "Error uploading tournament images", error: uploadErr.message });
            }
        }

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
            near_city: near_city || "",
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

// ===============================
// GET WEATHER DATA (Wrapper for weatherService)
// ===============================
exports.getWeather = async (req, res) => {
    try {
        const { location, date } = req.query;

        if (!location || !date) {
            return res.status(400).json({ msg: "Location and date are required" });
        }

        const weather = await getWeatherByLocation(location, date);
        res.json(weather); 

    } catch (err) {
        console.error("❌ Get weather error:", err.message);
        res.status(500).json({ error: err.message });
    }
};