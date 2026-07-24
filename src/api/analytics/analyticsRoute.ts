import { Router } from "express";
import * as analyticsController from "./analyticsController";
import * as goalController from "./goalController";
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();

// Require JWT for all analytics and goals
router.use(protect);

// --- TELEMETRY & STATS ---
router.post(
  "/snapshot",
  validateRequest(analyticsController.SnapshotSchema),
  analyticsController.recordSnapshot,
);
router.get("/dashboard", analyticsController.getDashboardAnalytics);

// --- WRITING GOALS ---
router.post(
  "/goals",
  validateRequest(goalController.GoalSchema),
  goalController.createGoal,
);
router.get("/goals", goalController.getGoals);

export default router;
