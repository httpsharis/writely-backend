import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { googleLogin, getCurrentUser, postmanTestLogin } from './authController';
import { protect } from '../../middleware/authMiddleware';
import { RequestHandler } from 'express'

const router = Router();

// Strict limiter: Only 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, try again later.' }
});

// Remove this before going to production!
router.post('/bypass', postmanTestLogin);

// Apply the strict limiter ONLY to the login route
router.post('/google-login', authLimiter, googleLogin as RequestHandler);

// Protected route
router.get('/me', protect as RequestHandler, getCurrentUser);

export default router;