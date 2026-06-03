import { Router } from 'express';
import * as noteController from './noteController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Protect all note routes
router.use(protect);

// Routes tied to the parent Novel
router.post('/novel/:novelId', noteController.createNote);
router.get('/novel/:novelId', noteController.getNovelNotes);

// Routes tied directly to the Note ID
router.put('/:noteId', noteController.updateNote);
router.delete('/:noteId', noteController.deleteNote);

export default router;