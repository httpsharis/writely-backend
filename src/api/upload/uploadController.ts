import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';

export const uploadImage = (req: AuthRequest, res: Response): void => {
    try {
        // By the time this controller runs, the uploadMiddleware has ALREADY 
        // sent the image to Cloudinary. 
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        // We just grab the secure URL Cloudinary sent back and return it to the frontend
        res.status(200).json({ 
            message: 'Image uploaded successfully',
            url: req.file.path 
        });
    } catch (error) {
        res.status(500).json({ error: 'Image upload failed' });
    }
};