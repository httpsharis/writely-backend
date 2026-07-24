/**
 * @file likeRoutes.ts
 * @desc Routing definitions for document interactions.
 */
import { Router } from "express";
import * as likeController from "./likeController";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

router.use(protect); // Ensure only authenticated users can interact

router.post("/:documentId", likeController.toggleLikeStatus);
router.get("/:documentId/status", likeController.getLikeStatus);

export default router;
