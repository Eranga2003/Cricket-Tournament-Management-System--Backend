// Initialize environment variables FIRST
require("dotenv").config();

// Initialize Firebase BEFORE loading app (since app loads controllers that use Firebase)
const { db, admin } = require("./src/config/firebase");

const express = require("express");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Firebase Connected Successfully`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();