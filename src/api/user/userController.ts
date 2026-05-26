import { Response, NextFunction } from 'express';
import * as userService from './userService';
import { AuthRequest } from '../../middleware/authMiddleware';

export const getDashboardFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const dashboardData = await userService.getMinimalDashboard(userId);
        res.status(200).json(dashboardData);
    } catch (error) {
        next(error);
    }
};

export const getProfileDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const profileData = await userService.getProfileAnalytics(userId);
        res.status(200).json(profileData);
    } catch (error) {
        next(error);
    }
};