import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as noteService from './noteService';
import { AuthRequest } from '../../middleware/authMiddleware';
import { AppError } from '../../utils/errors';

const NoteSchema = z.object({
    title: z.string().min(1, "Note title is required"),
    content: z.any().optional(),
    type: z.enum(['lore', 'plot', 'worldbuilding', 'research', 'timeline', 'misc']).optional()
});

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { novelId } = req.params;
        
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const parsedData = NoteSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const note = await noteService.createNote(novelId, userId, parsedData.data);
        res.status(201).json({ note });
    } catch (error) {
        next(error);
    }
};

export const getNovelNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { novelId } = req.params;
        const { type, page, limit } = req.query;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;

        const result = await noteService.getNotesByNovel(novelId, userId, type as string, pageNum, limitNum);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { noteId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        // Use .partial() so the user doesn't have to send the entire note object just to update one field
        const parsedData = NoteSchema.partial().safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const updatedNote = await noteService.updateNote(noteId, userId, parsedData.data);
        res.status(200).json({ note: updatedNote });
    } catch (error) {
        next(error);
    }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { noteId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const isDeleted = await noteService.deleteNote(noteId, userId);
        
        if (!isDeleted) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        
        // 204 No Content is the standard RESTful response for a successful deletion
        res.status(204).send(); 
    } catch (error) {
        next(error);
    }
};