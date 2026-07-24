/**
 * @file uploadRoutes.ts
 * @desc Secure routing for Cloudinary image uploads.
 */
import { Router } from "express";
import { upload } from "../../middleware/uploadMiddleware";
import { protect } from "../../middleware/authMiddleware";
import * as uploadController from "./uploadController";

const router = Router();

// Prevent anonymous bots from flooding your Cloudinary storage
router.use(protect);

/**
 * @route POST /api/upload
 * @desc 1. upload.single('image') -> Streams file directly to Cloudinary
 * 2. uploadController.uploadImage -> Returns the secure URL
 */
router.post("/", upload.single("image"), uploadController.uploadImage);

export default router;
