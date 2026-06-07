import { Router } from 'express';
import * as searchController from './searchController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', searchController.searchDocuments);

export default router;