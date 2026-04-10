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
    console.log("✅ Firebase initialized successfully with service account");
    console.log(`📌 Project ID: ${serviceAccount.project_id}`);
  }

  db = admin.firestore();
  
  // Storage bucket initialization
  try {
    bucket = admin.storage().bucket();
  } catch (storageErr) {
    console.warn("⚠️  Firebase Storage initialization failed:", storageErr.message);
    bucket = null;
  }

} catch (err) {
  console.warn("⚠️  Firebase initialization failed:", err.message);
  if (err.message.includes("16 UNAUTHENTICATED")) {
    console.error("❌ CRITICAL: Firebase Authentication failed. Please check your serviceAccountKey.json and Google Cloud project permissions.");
  }
  console.log("📝 Falling back to Mock Database mode for development");

  // Create an in-memory storage for the mock database
  const mockStorage = {};

  // Create a mock db object that simulates Firestore for development
  db = {
    collection: (name) => {
      if (!mockStorage[name]) mockStorage[name] = {};
      return {
        add: async (data) => {
          const id = "mock-" + Math.random().toString(36).substr(2, 9);
          mockStorage[name][id] = { ...data, id };
          return { id };
        },
        doc: (id) => {
          const docId = id || "mock-" + Math.random().toString(36).substr(2, 9);
          return {
            id: docId,
            get: async () => ({
              exists: !!mockStorage[name][docId],
              data: () => mockStorage[name][docId] || {},
            }),
            set: async (data) => {
              mockStorage[name][docId] = { ...data, id: docId };
            },
            update: async (data) => {
              if (mockStorage[name][docId]) {
                mockStorage[name][docId] = { ...mockStorage[name][docId], ...data };
              }
            },
            delete: async () => {
              delete mockStorage[name][docId];
            },
          };
        },
        where: (field, op, value) => ({
          get: async () => {
            const docs = Object.values(mockStorage[name])
              .filter((d) => d[field] === value)
              .map((d) => ({ id: d.id, data: () => d }));
            return {
              docs,
              empty: docs.length === 0,
              forEach: (cb) => docs.forEach(cb),
            };
          },
        }),
        get: async () => {
          const docs = Object.values(mockStorage[name]).map((d) => ({
            id: d.id,
            data: () => d,
          }));
          return {
            docs,
            empty: docs.length === 0,
            forEach: (cb) => docs.forEach(cb),
          };
        },
      };
    },
  };

  firebaseInitialized = false;
}

module.exports = { admin, db, bucket, firebaseInitialized };