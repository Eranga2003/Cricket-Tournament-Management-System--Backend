const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

let db, bucket;

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "softballtournamentapp.appspot.com",
  });

  db = admin.firestore();
  bucket = admin.storage().bucket();

  console.log("✅ Firebase connected successfully"); // <-- confirms connection
} catch (err) {
  console.error("❌ Firebase connection failed:", err); // <-- shows error
  process.exit(1); // stop server if Firebase fails
}

module.exports = { admin, db, bucket };