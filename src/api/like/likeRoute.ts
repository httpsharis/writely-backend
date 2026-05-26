import { Router } from 'express';
import * as likeController from './likeController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Protect all Like routes (guests cannot like documents)
router.use(protect);

// POST /api/likes/:documentId -> Toggles the like on or off
router.post('/:documentId', likeController.toggleLikeStatus);

// GET /api/likes/:documentId/status -> Checks if the logged-in user liked it
router.get('/:documentId/status', likeController.getLikeStatus);

export default router;