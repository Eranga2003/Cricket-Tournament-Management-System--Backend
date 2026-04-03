const express = require("express");
const app = express();

// Middlewares
app.use(express.json());

// Catch SyntaxError in JSON (e.g. malformed JSON in request body)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Malformed JSON request received:", err.message);
    return res.status(400).json({
      msg: "Invalid JSON format. Please ensure all keys and string values are wrapped in double quotes (\").",
      error: err.message,
    });
  }
  next();
});

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const teamRoutes = require("./routes/teamRoutes");

console.log("📌 Starting route initialization...");

// Routes
console.log("📌 Starting route initialization...");


try {
  console.log("⏳ Loading organizerRoutes...");
  const organizerRoutes = require("./routes/organizerRoutes");
  console.log("✅ organizerRoutes loaded:", typeof organizerRoutes);
  console.log("⏳ Registering organizerRoutes middleware...");
  app.use("/api/organizers", organizerRoutes);
  console.log("✅ organizerRoutes registered successfully");
} catch (err) {
  console.error("❌ Error with organizerRoutes:", err.message);
  console.error("   Stack:", err.stack);
}

// Test route
app.get("/", (req, res) => res.send("API Running 🚀"));

// DB Health Check Route
app.get("/api/test-db", async (req, res) => {
  try {
    const { firebaseInitialized, db } = require("./src/config/firebase");
    if (!firebaseInitialized) {
      return res.status(500).json({ status: "error", message: "Firebase not initialized" });
    }
    // Try a simple read to confirm connection
    await db.collection("captains").limit(1).get();
    res.json({ status: "success", message: "Firebase connection is healthy", details: { initialized: true } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.use("/api/tournaments", require("./routes/tournamentRoutes"));
app.use("/api/captains", require("./routes/captainRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/players", require("./routes/playerRoutes"));
app.use("/api/registrations", require("./routes/registrationRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/scoring", require("./routes/scoringRoutes"));

console.log("📌 Route initialization complete");

module.exports = app;