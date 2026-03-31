const { db } = require("../config/firebase");

// ===============================
// CREATE CAPTAIN
// ===============================
const createCaptain = async (data) => {
    const captainRef = db.collection("captains").doc();

    const captainData = {
        captain_id: captainRef.id,

        team_id: null, // will assign later
        player_id: null, // optional

        name: data.name,
        email: data.email,
        mobile: data.mobile,
        password_hash: data.password_hash,

        profile_image_url: data.profile_image_url || "",

        total_tournaments_joined: 0,
        is_active: true,
        last_login_at: null,

        captaincy_transferred_to: null,

        created_at: new Date()
    };

    await captainRef.set(captainData);

    return captainData;
};

module.exports = {
    createCaptain
};