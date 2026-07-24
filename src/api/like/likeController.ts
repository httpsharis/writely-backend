/**
 * @file likeController.ts
 * @desc Handles incoming HTTP requests for the Like/Interaction domain.
 */
import { Response } from "express";
import * as likeService from "./likeService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

/**
 * @route POST /api/likes/:documentId
 * @desc Toggles a like for the authenticated user on a specific document.
 */
export const toggleLikeStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await likeService.toggleLike(
      req.params.documentId,
      req.user!.userId,
    );
    res.status(200).json(result);
  },
);

/**
 * @route GET /api/likes/:documentId/status
 * @desc Checks if the authenticated user has already liked the document.
 */
export const getLikeStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const isLiked = await likeService.checkUserLiked(
      req.params.documentId,
      req.user!.userId,
    );
    res.status(200).json({ isLiked });
  },
);
