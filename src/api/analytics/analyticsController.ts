/**
 * @file analyticsController.ts
 * @desc Handles incoming HTTP requests for telemetry and statistics.
 */
import { Response } from "express";
import { z } from "zod";
import * as analyticsService from "./analyticsService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

export const SnapshotSchema = z.object({
  chapterId: z.string(),
  novelId: z.string(),
  wordCount: z.number().min(0).max(500000),
});

export const recordSnapshot = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { chapterId, novelId, wordCount } = req.body;
    const snapshot = await analyticsService.recordSnapshot(
      req.user!.userId,
      chapterId,
      novelId,
      wordCount,
    );
    res.status(200).json({ recorded: !!snapshot, snapshot });
  },
);

export const getDashboardAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const summary = await analyticsService.getDashboardSummary(
      req.user!.userId,
    );
    res.status(200).json(summary);
  },
);
