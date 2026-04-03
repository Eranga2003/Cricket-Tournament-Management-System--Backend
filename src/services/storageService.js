const { supabase } = require("../config/supabase");

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param {Object} file - The file object from multer (req.file)
 * @param {string} bucketName - The name of the Supabase bucket
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
const uploadImage = async (file, bucketName = process.env.SUPABASE_BUCKET || "logos") => {
  try {
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("❌ Storage Service Error:", err.message);
    throw err;
  }
};

module.exports = { uploadImage };
