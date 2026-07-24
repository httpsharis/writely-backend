import { Router } from 'express';
import * as userController from './userController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Readers can visit /api/users/public/12345 to see the author's page
router.get('/public/:userId', userController.getPublicProfile);

// Protect all user routes
router.use(protect);

router.get('/dashboard', userController.getDashboardFeed);

router.get('/profile', userController.getProfileDashboard);

export default router;