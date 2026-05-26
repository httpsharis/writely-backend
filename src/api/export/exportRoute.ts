import { Router } from 'express';
import * as exportController from './exportController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);

// GET /api/export/novel/:novelId
router.get('/novel/:novelId', exportController.exportNovel);

export default router;