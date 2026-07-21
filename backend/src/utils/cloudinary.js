import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary.
 * Uses resource_type: "raw" to support documents (PDF, Word, DOCX, TXT, etc.).
 * @param {string} localFilePath - Local temporary file path.
 * @param {string} originalName - Original name of the document.
 * @returns {Promise<Object>} The Cloudinary upload response object.
 */
export const uploadToCloudinary = async (localFilePath, originalName) => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name_here'
    ) {
      throw new Error("Cloudinary credentials are not configured in the .env file yet.");
    }

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
      folder: "customer_support_docs",
      public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`,
    });

    return uploadResult;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};

export default cloudinary;
