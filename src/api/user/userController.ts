/**
 * @file userController.ts
 * @desc Handles incoming HTTP requests for user dashboards, profiles, and settings.
 */

import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as userService from "./userService";

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  bio: z.string().optional(),
  coverImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  socialLinks: z.object({
    twitter: z.string().optional().or(z.literal("")),
    instagram: z.string().optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),
  }).optional(),
});

/**
 * @route GET /api/users/dashboard
 * @desc Fetches lightweight dashboard data (recent docs, today's word count).
 */
export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await userService.getMinimalDashboard(req.user!.userId);
    res.status(200).json(data);
  },
);

/**
 * @route GET /api/users/analytics
 * @desc Fetches heavy profile analytics (heatmaps, streaks, goals).
 */
export const getAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await userService.getProfileAnalytics(req.user!.userId);
    res.status(200).json(data);
  },
);

/**
 * @route PUT /api/users/profile
 * @desc Updates the authenticated user's profile metadata securely.
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { name, username, bio, coverImageUrl, socialLinks } = req.body;

    // Check if they are trying to claim a username someone else already owns
    if (username) {
      const existingUser = await userService.findUserByUsername(username);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    const user = await userService.updateUserProfile(userId, {
      name,
      username,
      bio,
      coverImageUrl,
      socialLinks,
    });
    res.status(200).json({ user });
  },
);

/**
 * @route GET /api/users/:username
 * @desc Fetches a public author profile and their published novels.
 */
export const getPublicProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await userService.getPublicAuthorProfile(req.params.username);
    res.status(200).json(data);
  },
);
