import { Router } from 'express';
import { createTestUser } from './userController';

const router = Router();

// This will automatically be prefixed with whatever we set in server.ts
router.post('/test', createTestUser);

export default router;