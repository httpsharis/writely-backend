import { Router } from 'express';
import * as analyticsController from './analyticsController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);

// POST /api/analytics/snapshot -> Triggered by frontend auto-save loop
router.post('/snapshot', analyticsController.recordSnapshot);

// GET /api/analytics/dashboard -> Called when the user logs in
router.get('/dashboard', analyticsController.getDashboardAnalytics);

export default router;