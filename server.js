// Initialize environment variables FIRST
require("dotenv").config();

// Initialize Firebase BEFORE loading app (since app loads controllers that use Firebase)
const { db, admin } = require("./src/config/firebase");

const express = require("express");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
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