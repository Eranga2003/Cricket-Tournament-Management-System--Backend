const express = require("express");
const app = express();
require("./config/firebase"); // Initialize Firebase Admin SDK
const authRoutes = require("./routes/authRoutes");

// Middlewares
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => res.send("API Running 🚀"));

// Add this near the top, after auth routes
app.use("/api/organizers", require("./routes/organizerRoutes"));
module.exports = app;