// In: src/api/auth/authRoutes.ts
import { Router } from 'express';
import { 
  googleLogin, 
  getCurrentUser, 
  refreshToken, 
  logout, 
  register, 
  login, 
} from './authController';
import { protect } from '../../middleware/authMiddleware';
import { authLimiter } from '../../middleware/rateLimitMiddleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user with email/password
 * @access Public
 */
router.post('/register', authLimiter, register);

/**
 * @route POST /api/auth/login
 * @desc Login with email/password
 * @access Public
 */
router.post('/login', authLimiter, login);

/**
 * @route POST /api/auth/google-login
 * @desc Login/Register via Google OAuth
 * @access Public
 */
router.post('/google-login', authLimiter, googleLogin);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using HTTP-only cookie
 * @access Public
 */
router.post('/refresh', refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Clear HTTP-only cookie and invalidate refresh token
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user's data
 * @access Private
 */
router.get('/me', protect, getCurrentUser);


export default router;