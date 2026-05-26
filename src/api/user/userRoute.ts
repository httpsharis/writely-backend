import { Router } from 'express';
import * as userController from './userController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Protect all user routes
router.use(protect);

router.get('/dashboard', userController.getDashboardFeed);

router.get('/profile', userController.getProfileDashboard);

export default router;