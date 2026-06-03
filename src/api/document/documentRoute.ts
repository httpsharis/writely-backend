import { Router } from 'express';
import * as documentController from './documentController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// --- PUBLIC ROUTES (No auth required) ---
router.get('/public/:slug', documentController.getPublicDocument);

// --- PROTECTED ROUTES (Requires valid JWT) ---
router.use(protect); 

// Dashboard & Creation
router.post('/', documentController.createDocument);
router.get('/', documentController.getMyDocuments);

// TRASH ROUTES (Must be placed BEFORE /:id wildcards)
router.get('/trash', documentController.getTrash);
router.patch('/trash/:id/restore', documentController.restoreFromTrash);

// EDITOR ACTIONS (Wildcards)
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

export default router;