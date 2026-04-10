const admin = require("firebase-admin");
const serviceAccount = require("./src/config/serviceAccountKey.json");

async function testConnection() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    const db = admin.firestore();
    console.log("Attempting to list collections...");
    const collections = await db.listCollections();
    console.log("Success! Collections found:", collections.length);
    collections.forEach(c => console.log("- ", c.id));
  } catch (err) {
    console.error("Test failed with error:", err.code, err.message);
    if (err.stack) console.error(err.stack);
  }
}

testConnection();
