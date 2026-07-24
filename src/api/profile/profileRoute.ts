/**
 * @file profileRoute.ts
 * @desc Routing for author portfolios and profile management.
 */
import { Router } from "express";
import * as profileController from "./profileController";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();

// 🟢 PUBLIC ROUTE: Anyone on the internet can view an author's portfolio
router.get("/:username", profileController.getPublicProfile);

// 🔒 PROTECTED ROUTE: Only the logged-in author can edit their profile
router.put(
  "/",
  protect,
  validateRequest(profileController.UpdateProfileSchema),
  profileController.updateProfile,
);

export default router;
