// In: src/api/auth/authRoutes.ts
import { Router } from 'express';
import { getCurrentUser } from './authController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user's data
 * @access Private
 */
router.get('/me', protect, getCurrentUser);

export default router;
