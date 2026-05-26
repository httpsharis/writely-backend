import { Response, NextFunction } from 'express';
import * as likeService from './likeService';
import { AuthRequest } from '../../middleware/authMiddleware';

export const toggleLikeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { documentId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await likeService.toggleLike(documentId, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getLikeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { documentId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isLiked = await likeService.checkUserLiked(documentId, userId);
        res.status(200).json({ isLiked });
    } catch (error) {
        next(error);
    }
};