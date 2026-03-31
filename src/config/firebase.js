const admin = require("firebase-admin");

let db, bucket, firebaseInitialized = false;

try {
  // Try to load real service account key
  const serviceAccount = require("./serviceAccountKey.json");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "cricket-tournament-management.firebasestorage.app",
    });
    firebaseInitialized = true;
    console.log("✅ Firebase initialized with service account");
  }

  db = admin.firestore();
  bucket = admin.storage ? admin.storage().bucket() : null;

} catch (err) {
  console.warn("⚠️  Firebase initialization failed:", err.message);
  console.log("📝 Using mock database mode for development");

  // Create a mock db object that simulates Firestore for development
  db = {
    collection: (name) => ({
      add: async (data) => ({
        id: "mock-" + Math.random().toString(36).substr(2, 9),
      }),
      doc: (id) => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async (data) => ({}),
        update: async (data) => ({}),
        delete: async () => ({}),
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
      }),
      get: async () => ({
        docs: [],
        forEach: () => { },
      }),
    }),
  };

  firebaseInitialized = false;
}

module.exports = { admin, db, bucket, firebaseInitialized };