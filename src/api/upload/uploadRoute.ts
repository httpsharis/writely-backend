import { Router, Response } from 'express';
import { upload } from '../../middleware/uploadMiddleware';
import { protect, AuthRequest } from '../../middleware/authMiddleware';

const router = Router();

// Protect the route so random bots can't upload images and run up your Cloudinary bill
router.use(protect);

// The 'image' string here must match the field name the frontend uses when appending to FormData
router.post('/', upload.single('image'), (req: AuthRequest, res: Response): void => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        // Multer-Cloudinary automatically attaches the secure Cloudinary URL to req.file.path
        res.status(200).json({ 
            message: 'Image uploaded successfully',
            url: req.file.path 
        });
    } catch (error) {
        res.status(500).json({ error: 'Image upload failed' });
    }
});

export default router;