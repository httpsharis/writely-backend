import { Response, NextFunction } from 'express';
import * as exportService from './exportService';
import { AuthRequest } from '../../middleware/authMiddleware';

export const exportNovel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { novelId } = req.params;

        if (!userId) { 
            res.status(401).json({ error: 'Unauthorized' }); 
            return; 
        }

        const { filename, content } = await exportService.compileNovelForExport(novelId, userId);

        // Tell the browser to download this response as a file
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/markdown');
        
        // Send the raw compiled text
        res.status(200).send(content);
    } catch (error) {
        next(error);
    }
};