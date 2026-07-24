/**
 * @file goalController.ts
 * @desc Handles incoming HTTP requests for user writing goals.
 */
import { Response } from "express";
import { z } from "zod";
import * as goalService from "./goalService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

export const GoalSchema = z.object({
  type: z.enum(["daily", "weekly", "novel_total"]),
  targetWords: z.number().min(1),
  novelId: z.string().optional(),
  deadline: z.string().optional(),
});

export const createGoal = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const goal = await goalService.createGoal(req.user!.userId, req.body);
    res.status(201).json(goal);
  },
);

export const getGoals = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const goals = await goalService.getActiveGoals(req.user!.userId);
    res.status(200).json(goals);
  },
);
