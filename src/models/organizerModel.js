// src/models/Organizer.js
const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");

const createOrganizer = async ({
  org_name,
  email,
  password,
  phone,
  logo_url,
  sponsor_details,
}) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const organizerRef = db.collection("organizers").doc(); // new doc
  const data = {
    org_name,
    email,
    password: hashedPassword,
    phone: phone || "",
    logo_url: logo_url || "",
    sponsor_details: sponsor_details || [],
    total_tournaments: 0,
    contact_visible: true,
    is_active: true,
    created_at: new Date(),
  };

  await organizerRef.set(data);
  return { id: organizerRef.id, ...data };
};

module.exports = { createOrganizer };