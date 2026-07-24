import express from "express";
import { getProfileDashboard } from "../profile/profileController";
import { protect } from "../../middleware/authMiddleware";
// Import your auth middleware to protect this route!
// import { requireAuth } from "../middleware/auth.middleware";

const router = express.Router();

// Add requireAuth here later to ensure only logged-in users access this
router.get("/dashboard", protect, getProfileDashboard);

export default router;
