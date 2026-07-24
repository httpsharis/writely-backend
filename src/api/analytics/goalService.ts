/**
 * @file goalService.ts
 * @desc Pure database operations for Writing Goals.
 */
import WritingGoal, { IWritingGoal } from "./writingGoalModel";

export const createGoal = async (userId: string, data: Partial<IWritingGoal>) =>
  WritingGoal.create({ ...data, userId });

export const getActiveGoals = async (userId: string) =>
  WritingGoal.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
