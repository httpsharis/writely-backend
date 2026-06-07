import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as analyticsService from './analyticsService';
import { AuthRequest } from '../../middleware/authMiddleware';
import WritingGoal from './writingGoalModel';

const SnapshotSchema = z.object({
    chapterId: z.string(),
    novelId: z.string(),
    wordCount: z.number().min(0).max(500000) 
});

const GoalSchema = z.object({
    type: z.enum(['daily', 'weekly', 'novel_total']),
    targetWords: z.number().min(1),
    novelId: z.string().optional(),
    deadline: z.string().optional()
});

export const recordSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const parsedData = SnapshotSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const { chapterId, novelId, wordCount } = parsedData.data;

        const snapshot = await analyticsService.recordSnapshot(userId, chapterId, novelId, wordCount);
        
        res.status(200).json({ recorded: !!snapshot, snapshot });
    } catch (error) {
        next(error);
    }
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const summary = await analyticsService.getDashboardSummary(userId);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const parsedData = GoalSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const goal = await WritingGoal.create({ ...parsedData.data, userId });
        res.status(201).json(goal);
    } catch (error) {
        next(error);
    }
};

export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const goals = await WritingGoal.find({ userId, isActive: true });
        res.status(200).json(goals);
    } catch (error) {
        next(error);
    }
};