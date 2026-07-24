import { Router } from 'express';
import { upload } from '../../middleware/uploadMiddleware';
import { protect } from '../../middleware/authMiddleware';
import * as uploadController from './uploadController';

const router = Router();

// Protect the route so random bots can't upload images
router.use(protect);

// 1. First, it passes through the 'upload' middleware (sends to Cloudinary)
// 2. Then, it hits the 'uploadController' (returns the URL to the frontend)
router.post('/', upload.single('image'), uploadController.uploadImage);

export default router;