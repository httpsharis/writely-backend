import { Router } from "express";
import * as documentController from "./documentController";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/public/:slug", documentController.getPublicDocument);

// --- PROTECTED ROUTES ---
router.use(protect);

// Dashboard & Creation
// 🟢 SENIOR FIX: Catch bad data before it hits the controller
router.post(
  "/",
  validateRequest(documentController.CreateDocumentSchema),
  documentController.createDocument,
);
router.get("/", documentController.getMyDocuments);

// Trash
router.get("/trash", documentController.getTrash);
router.patch("/trash/:id/restore", documentController.restoreFromTrash);

// Editor Actions
router.get("/:id", documentController.getDocumentById);
router.put(
  "/:id",
  validateRequest(documentController.UpdateDocumentSchema),
  documentController.updateDocument,
);
router.delete("/:id", documentController.deleteDocument);

// --- PUBLIC ROUTES (No auth required) ---
router.get("/public/:slug", documentController.getPublicDocument);
router.post("/public/:slug/view", documentController.recordView); 

export default router;
