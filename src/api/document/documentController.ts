import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import * as documentService from './documentService';
import { AuthRequest } from '../../middleware/authMiddleware';

// Schema for updating a document (auto-save from the editor)
const UpdateDocumentSchema = z.object({
    title: z.string().optional(),
    content: z.any().optional(), // Accepts TipTap JSON
    status: z.enum(['draft', 'published', 'archived']).optional(),
    coverImage: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().nullable().optional()
});

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        
        // 1. EXTRACT ALL FIELDS FROM req.body
        const { title, parentId, type, coverImage, synopsis, tags, targetWords } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const docType = type || 'novel';
        
        // 2. PASS ALL FIELDS TO THE SERVICE
        const document = await documentService.createDocument(
            userId, 
            title, 
            parentId, 
            docType, 
            coverImage, 
            synopsis, 
            tags, 
            targetWords
        );

        res.status(201).json({ document });
    } catch (error) {
        next(error);
    }
};

export const getMyDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const documents = await documentService.getUserDocuments(userId);
        res.status(200).json({ documents });
    } catch (error) {
        next(error);
    }
};

export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        // Explicitly cast the route parameter to string
        const id = req.params.id as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const document = await documentService.getDocumentById(id, userId);
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.status(200).json({ document });
    } catch (error) {
        next(error);
    }
};

export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        // Explicitly cast the route parameter to string
        const id = req.params.id as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const parsedData = UpdateDocumentSchema.safeParse(req.body);
        if (!parsedData.success) {
            // Zod uses .issues, not .errors
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        // Convert string parentId to Mongoose ObjectId if present
        const updatePayload = {
            ...parsedData.data,
            parentId: parsedData.data.parentId
                ? new mongoose.Types.ObjectId(parsedData.data.parentId)
                : parsedData.data.parentId === null
                    ? null
                    : undefined
        };

        const updatedDocument = await documentService.updateDocument(id, userId, updatePayload as any);
        if (!updatedDocument) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.status(200).json({ document: updatedDocument });
    } catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        // Explicitly cast the route parameter to string
        const id = req.params.id as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const deletedDoc = await documentService.softDeleteDocument(id, userId);
        if (!deletedDoc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.status(200).json({ message: 'Document moved to trash' });
    } catch (error) {
        next(error);
    }
};

// --- PUBLIC ROUTE FOR READERS ---
export const getPublicDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Explicitly cast the route parameter to string
        const slug = req.params.slug as string;

        const document = await documentService.getPublishedDocumentBySlug(slug);

        // If it doesn't exist, OR if it's set to 'draft', this returns 404
        if (!document) {
            res.status(404).json({ error: 'Document not found or is private' });
            return;
        }

        res.status(200).json({ document });
    } catch (error) {
        next(error);
    }
};

export const getTrash = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const trashedDocs = await documentService.getTrashedDocuments(userId);
        res.status(200).json(trashedDocs);
    } catch (error) {
        next(error);
    }
};

export const restoreFromTrash = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const restoredDoc = await documentService.restoreDocument(id, userId);
        res.status(200).json(restoredDoc);
    } catch (error) {
        next(error);
    }
};