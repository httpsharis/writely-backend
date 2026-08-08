/**
 * @file authController.ts
 * @desc Controller handling authentication endpoints using Clerk
 */
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import User from "../user/userModel";

/**
 * @desc Get current authenticated user's profile and settings.
 * Relies on the AuthRequest populated by the JIT Clerk protect middleware.
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("GetCurrentUser Error:", error);
    res.status(500).json({ error: "Server error fetching user" });
  }
};
