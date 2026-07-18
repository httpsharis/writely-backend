import { Router } from 'express';
import { googleLogin, getCurrentUser, devDummyLogin, refreshToken, logout, register, login } from './authController';
import { protect } from '../../middleware/authMiddleware';
import { authLimiter } from '../../middleware/rateLimitMiddleware';
import { RequestHandler } from 'express';

const router = Router();

// Apply the strict limiter ONLY to the login routes
router.post('/register', authLimiter, register as RequestHandler);
router.post('/login', authLimiter, login as RequestHandler);
router.post('/google-login', authLimiter, googleLogin as RequestHandler);
router.post('/dev-login', authLimiter, devDummyLogin as RequestHandler);

// Token routes (Unprotected, handles its own validation)
router.post('/refresh', refreshToken as RequestHandler);
router.post('/logout', logout as RequestHandler);

// Protected routes
router.get('/me', protect as RequestHandler, getCurrentUser);

export default router;