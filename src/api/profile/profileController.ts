/**
 * @file profileController.ts
 * @desc Handles HTTP requests for public author portfolios and private profile edits.
 */
import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middleware/authMiddleware";
import * as profileService from "./profileService";

// Validation schema for incoming profile updates
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
});

/**
 * @route GET /api/profile/:username
 * @desc Fetches the public portfolio for a specific author. (No Auth Required)
 */
export const getPublicProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;

    // Pass to service layer to aggregate the data
    const profileData =
      await profileService.getPublicProfileByUsername(username);

    res.status(200).json(profileData);
  },
);

/**
 * @route PUT /api/profile
 * @desc Updates the authenticated user's profile information.
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Pass the strictly validated req.body and the user's ID to the service
    const updatedProfile = await profileService.updateUserProfile(
      req.user!.userId,
      req.body,
    );

    res.status(200).json({ profile: updatedProfile });
  },
);
