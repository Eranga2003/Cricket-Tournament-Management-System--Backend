const express = require("express");
const app = express();

// Middlewares
app.use(express.json());
const teamRoutes = require("./routes/teamRoutes");

console.log("📌 Starting route initialization...");

// Routes
try {
  console.log("⏳ Loading authRoutes...");
  const authRoutes = require("./routes/authRoutes");
  console.log("✅ authRoutes loaded:", typeof authRoutes);
  app.use("/api/auth", authRoutes);
  console.log("✅ authRoutes registered");
} catch (err) {
  console.error("❌ Error with authRoutes:", err.message);
}

try {
  console.log("⏳ Loading organizationRoutes...");
  const organizationRoutes = require("./routes/organizationRoutes");
  console.log("✅ organizationRoutes loaded:", typeof organizationRoutes);
  app.use("/api/organizations", organizationRoutes);
  console.log("✅ organizationRoutes registered");
} catch (err) {
  console.error("❌ Error with organizationRoutes:", err.message);
}

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
app.use("/api/tournaments", require("./routes/tournamentRoutes"));
app.use("/api/captains", require("./routes/captainRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));

console.log("📌 Route initialization complete");

module.exports = app;