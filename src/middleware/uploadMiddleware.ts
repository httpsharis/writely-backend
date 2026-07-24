/**
 * @file uploadMiddleware.ts
 * @desc Configures Multer to intercept image uploads and stream them directly
 * to Cloudinary, entirely bypassing the local server disk.
 */
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary"; // Ensure this points to your configured v2 instance

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Strip spaces and special characters from the original filename
    // e.g., "My Epic Cover!.jpg" -> "my-epic-cover-"
    const safeName = file.originalname
      .split(".")[0]
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();

    return {
      folder: "writely_uploads",
      allowed_formats: ["jpg", "jpeg", "png", "webp"], // Strict extension allowlist
      public_id: `${Date.now()}-${safeName}`,
    };
  },
});

/**
 * @desc Exported middleware to drop into routes.
 * Rejects any file larger than 5MB before it even starts uploading to Cloudinary.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
});
