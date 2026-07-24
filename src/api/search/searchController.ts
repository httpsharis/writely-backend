/**
 * @file searchController.ts
 * @desc Handles incoming HTTP requests for global application search.
 */
import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as searchService from "./searchService";

/**
 * @route GET /api/search?q=your_term
 * @desc Performs a global omni-search across documents, characters, and notes.
 */
export const searchDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const searchTerm = req.query.q as string;

    // If the user hasn't typed anything yet, return an empty omni-search structure
    if (!searchTerm || searchTerm.trim().length === 0) {
      res
        .status(200)
        .json({ documents: [], characters: [], notes: [], totalResults: 0 });
      return;
    }

    const results = await searchService.executeOmniSearch(
      req.user!.userId,
      searchTerm,
    );

    res.status(200).json(results);
  },
);
