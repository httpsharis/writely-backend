import { Router } from "express";
import * as characterController from "./characterController";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();

router.use(protect); // Require JWT for all character endpoints

// Novel/Global Routes
router.post(
  "/novel/:novelId",
  validateRequest(characterController.CharacterSchema),
  characterController.createCharacter,
);
router.get("/novel/:novelId", characterController.getNovelCharacters);

// Specific Character Routes
router.put(
  "/:characterId",
  validateRequest(characterController.CharacterSchema.partial()),
  characterController.updateCharacter,
);
router.delete("/:characterId", characterController.deleteCharacter);

export default router;
