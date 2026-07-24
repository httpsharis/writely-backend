/**
 * @file documentController.ts
 * @desc Handles incoming HTTP requests for the Document domain.
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as documentService from "./documentService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

// --- Zod Schemas for Middleware ---
export const CreateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").optional().default("Untitled"),
  type: z.enum(["novel", "chapter"]).optional().default("novel"),
  parentId: z.string().nullable().optional(),
  coverImage: z.string().url().optional(),
  synopsis: z.string().optional(),
  tags: z.array(z.string()).optional(),
  targetWords: z.number().optional(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(), // TipTap JSON
  status: z.enum(["draft", "published", "archived"]).optional(),
  coverImage: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

/**
 * @route POST /api/documents
 */
export const createDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const document = await documentService.createDocument(
      req.user!.userId,
      req.body,
    );
    res.status(201).json({ document });
  },
);

/**
 * @route GET /api/documents
 */
export const getMyDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const documents = await documentService.getUserDocuments(req.user!.userId);
    res.status(200).json({ documents });
  },
);

/**
 * @route GET /api/documents/:id
 */
export const getDocumentById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user!.userId,
    );
    if (!document) return res.status(404).json({ error: "Document not found" });
    res.status(200).json({ document });
  },
);

/**
 * @route PUT /api/documents/:id
 */
export const updateDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const updatedDocument = await documentService.updateDocument(
      req.params.id,
      req.user!.userId,
      req.body,
    );
    if (!updatedDocument)
      return res.status(404).json({ error: "Document not found" });
    res.status(200).json({ document: updatedDocument });
  },
);

/**
 * @route DELETE /api/documents/:id
 */
export const deleteDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const deletedDoc = await documentService.softDeleteDocument(
      req.params.id,
      req.user!.userId,
    );
    if (!deletedDoc)
      return res.status(404).json({ error: "Document not found" });
    res.status(200).json({ message: "Document moved to trash" });
  },
);

/**
 * @route GET /api/documents/public/:slug
 */
export const getPublicDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const document = await documentService.getPublishedDocumentBySlug(
      req.params.slug,
    );
    if (!document)
      return res
        .status(404)
        .json({ error: "Document not found or is private" });
    res.status(200).json({ document });
  },
);

/**
 * @route GET /api/documents/trash
 */
export const getTrash = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const trashedDocs = await documentService.getTrashedDocuments(
      req.user!.userId,
    );
    res.status(200).json(trashedDocs);
  },
);

/**
 * @route PATCH /api/documents/trash/:id/restore
 */
export const restoreFromTrash = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restoredDoc = await documentService.restoreDocument(
      req.params.id,
      req.user!.userId,
    );
    res.status(200).json(restoredDoc);
  },
);

/**
 * @route POST /api/documents/public/:slug/view
 * @desc Records a valid "read" (view) after the frontend verifies the 10-second rule.
 */
export const recordView = asyncHandler(async (req: Request, res: Response) => {
    const doc = await documentService.incrementViewCount(req.params.slug);
    
    if (!doc) {
        res.status(404).json({ error: 'Document not found or private' });
        return;
    }

    res.status(200).json({ success: true, viewsCount: doc.viewsCount });
});