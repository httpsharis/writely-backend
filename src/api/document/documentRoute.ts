import { Router } from 'express';
import * as documentController from './documentController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// --- PUBLIC ROUTES (No auth required) ---
// Readers fetch articles using the slug URL (e.g. /api/documents/public/my-first-chapter-a8f3b2)
router.get('/public/:slug', documentController.getPublicDocument);

// --- PROTECTED ROUTES (Requires valid JWT) ---
router.use(protect); // Applies 'protect' to all routes below this line

// Dashboard & Creation
router.post('/', documentController.createDocument);
router.get('/', documentController.getMyDocuments);

// Editor Actions
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

export default router;