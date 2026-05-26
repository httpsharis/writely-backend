import { Router } from 'express';
import * as characterController from './characterController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Protect all world-building routes
router.use(protect);

// Routes tied directly to the Novel
router.post('/novel/:novelId', characterController.createCharacter);
router.get('/novel/:novelId', characterController.getNovelCharacters);

// Routes tied to a specific Character
router.put('/:characterId', characterController.updateCharacter);
router.delete('/:characterId', characterController.deleteCharacter);

export default router;