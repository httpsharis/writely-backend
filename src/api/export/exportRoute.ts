/**
 * @file exportRoutes.ts
 * @desc Routing for application data exports.
 */
import { Router } from "express";
import * as exportController from "./exportController";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

// Apply JWT protection to all export routes
router.use(protect);

router.get("/novel/:novelId", exportController.exportNovel);

export default router;
