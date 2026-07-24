/**
 * @file uploadController.ts
 * @desc Handles the final step of the image upload process.
 * Assumes the image has already been securely uploaded to Cloudinary via middleware.
 */
import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";

export const uploadImage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 🟢 Fast Fail: If Multer/Cloudinary failed, req.file won't exist
    if (!req.file) {
      throw new AppError("No image file provided or upload failed", 400);
    }

    // Return the secure Cloudinary URL back to the frontend
    res.status(200).json({
      message: "Image uploaded successfully",
      url: req.file.path,
    });
  },
);
