/**
 * @file noteRoutes.ts
 */
import { Router } from "express";
import * as noteController from "./noteController";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();
router.use(protect); // Secure all endpoints

// Global / Inbox routes
router.post(
  "/",
  validateRequest(noteController.NoteSchema),
  noteController.createInboxNote,
);
router.get("/", noteController.getInboxNotes);

// Routes tied to the parent Novel
router.post(
  "/novel/:novelId",
  validateRequest(noteController.NoteSchema),
  noteController.createNote,
);
router.get("/novel/:novelId", noteController.getNovelNotes);

// Routes tied directly to the Note ID
router.put(
  "/:noteId",
  validateRequest(noteController.NoteSchema.partial()),
  noteController.updateNote,
);
router.delete("/:noteId", noteController.deleteNote);

export default router;
