import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import Document from '../document/documentModel';

export const searchDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const searchTerm = req.query.q as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!searchTerm) {
            res.status(200).json([]);
            return;
        }

        // This text pattern ignores uppercase and lowercase letters.
        const searchPattern = new RegExp(searchTerm, 'i');

        const results = await Document.find({
            owner: userId,
            title: searchPattern
        })
        .select('title type slug updatedAt')
        .limit(10)
        .lean();

        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};