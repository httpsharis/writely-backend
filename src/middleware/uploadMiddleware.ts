import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'writely_uploads', // Creates a clean folder in your Cloudinary dashboard
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Prevents malicious file uploads
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Generates a unique name
        };
    },
});

// We set a 5MB limit to prevent users from uploading massive raw image files
export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});