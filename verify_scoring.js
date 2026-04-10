const { startMatchInnings, processBall, updateBattingOrder, swapBatsman, swapBowler } = require('./src/models/scoringModel');
const { db } = require('./src/config/firebase');

async function runTest() {
    console.log("🚀 Starting Scoring Logic Verification...\n");

    const match_id = "VERIFY_MATCH_" + Date.now();
    
    // Create dummy players for the test
    console.log("Step 0: Creating dummy players...");
    const players = ["P1", "P2", "P3", "P4", "P5", "B1"];
    for (const pid of players) {
        await db.collection("players").doc(pid).set({
            name: "Player " + pid,
            total_runs: 0,
            total_wickets: 0
        }, { merge: true });
    }
    console.log("✅ Players ready.\n");

    // 1. INITIALIZE INNINGS
    console.log("Step 1: Initializing Innings (2 Overs, 6 Balls per over)");
    const setupData = {
        batting_team_id: "TEAM_A",
        bowling_team_id: "TEAM_B",
        total_overs: 2,
        balls_per_over: 6,
        batting_order: ["P1", "P2", "P3", "P4", "P5"],
        bowler_id: "B1"
    };
    
    let ls = await startMatchInnings(match_id, setupData);
    console.log(`✅ Started. Striker: ${ls.striker_id}, Non-Striker: ${ls.non_striker_id}\n`);

    // 2. RECORD 1 RUN (Rotation Test)
    console.log("Step 2: Recording 1 run (Expect Strike Rotation)");
    ls = await processBall(match_id, { runs: 1 });
    console.log(`✅ Score: ${ls.total_runs}, Striker: ${ls.striker_id}, Non-Striker: ${ls.non_striker_id}\n`);

    // 3. RECORD 4 RUNS (No Rotation Test)
    console.log("Step 3: Recording 4 runs (Expect No Rotation)");
    ls = await processBall(match_id, { runs: 4 });
    console.log(`✅ Score: ${ls.total_runs}, Striker: ${ls.striker_id}, Non-Striker: ${ls.non_striker_id}\n`);

    // 4. RECORD WIDE (Extra Test)
    console.log("Step 4: Recording Wide (Expect Score +1, No ball count)");
    const ballsBefore = ls.balls_in_over;
    ls = await processBall(match_id, { runs: 0, extra_type: 'wide' });
    console.log(`✅ Score: ${ls.total_runs}, Balls in Over: ${ls.balls_in_over} (Previous: ${ballsBefore})\n`);

    // 5. RECORD WICKET (Wicket Test)
    console.log("Step 5: Recording Strike Wicket");
    ls = await processBall(match_id, { is_wicket: true });
    console.log(`✅ Total Wickets: ${ls.total_wickets}, Striker: ${ls.striker_id} (Expected null for selection)`);
    
    // Select new batsman (3rd in order)
    ls = await swapBatsman(match_id, "P3");
    console.log(`✅ New Striker selected: ${ls.striker_id}\n`);

    // 6. COMPLETE OVER (Over Rotation Test)
    console.log("Step 6: Completing the over (Need 4 more valid balls)");
    await processBall(match_id, { runs: 0 }); // ball 3
    await processBall(match_id, { runs: 0 }); // ball 4
    await processBall(match_id, { runs: 0 }); // ball 5
    ls = await processBall(match_id, { runs: 0 }); // ball 6
    
    console.log(`✅ Over Complete. Current Over: ${ls.current_over}, Balls: ${ls.balls_in_over}`);
    console.log(`✅ Striker after over rotation: ${ls.striker_id}, Bowler: ${ls.bowler_id} (Expected null)\n`);

    // 7. CHECK PLAYER STATS
    console.log("Step 7: Final Player Stats Check");
    console.log("Stats:", JSON.stringify(ls.player_stats, null, 2));

    console.log("\n✨ Verification Complete!");
    process.exit(0);
}

runTest().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
