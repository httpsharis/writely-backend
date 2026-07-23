// In: src/api/user/userRoutes.ts
import { Router } from "express";
import { getDashboard, getAnalytics, updateProfile, getPublicProfile, UpdateProfileSchema } from "./userController"; // <-- Import Schema from userController now!
import { protect } from "../../middleware/authMiddleware";
import { validateRequest } from "../../middleware/validateMiddleware";

const router = Router();

// Private Routes (Require JWT Token)
router.use(protect); 

router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);
router.put("/profile", validateRequest(UpdateProfileSchema), updateProfile);

// Public Routes
router.get("/:username", getPublicProfile);

export default router;