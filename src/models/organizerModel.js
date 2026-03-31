const { db } = require("../config/firebase");

// Create a new organizer
async function createOrganizer(data) {
  const docRef = db.collection("organizers").doc(); // auto-generated ID
  await docRef.set({
    name: data.name,
    email: data.email,
    phone: data.phone,
    logo: data.logo || "",
    totalTournaments: 0,
    sponsors: data.sponsors || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

// Get all organizers (optional)
async function getOrganizers() {
  const snapshot = await db.collection("organizers").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = { createOrganizer, getOrganizers };