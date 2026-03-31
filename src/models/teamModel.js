const { db } = require("../config/firebase"); // Firebase admin

// Collection name
const TEAM_COLLECTION = "teams";

// Function to create a new team
const createTeam = async ({
    captain_id,
    team_name,
    logo_url,
    join_link,
}) => {
    const teamRef = db.collection(TEAM_COLLECTION).doc(); // new doc id
    const teamData = {
        captain_id,
        team_name,
        logo_url: logo_url || "",
        join_link: join_link || "",
        total_wins: 0,
        total_losses: 0,
        total_trophies: 0,
        rank: null,
        member_count: 0,
        is_active: true,
        top_performer_id: null,
        created_at: new Date(),
    };

    await teamRef.set(teamData);
    return { id: teamRef.id, ...teamData };
};

// Function to list teams (optional)
const listTeams = async () => {
    const snapshot = await db.collection(TEAM_COLLECTION).get();
    const teams = [];
    snapshot.forEach((doc) => teams.push({ id: doc.id, ...doc.data() }));
    return teams;
};

module.exports = { createTeam, listTeams };