import { Router } from 'express';
import { getUserProfile } from './userController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Protected route: Only valid JWT holders can get their profile
router.get('/profile', protect, getUserProfile);

export default router;