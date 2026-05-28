import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as analyticsService from './analyticsService';
import { AuthRequest } from '../../middleware/authMiddleware';

const SnapshotSchema = z.object({
    chapterId: z.string(),
    novelId: z.string(),
    wordCount: z.number().min(0).max(500000) // Upper bound to prevent frontend bugs corrupting data
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
        
        // If it was throttled, snapshot will be null. We still return 200 OK so the frontend doesn't throw errors.
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