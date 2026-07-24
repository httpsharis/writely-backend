/**
 * @file noteController.ts
 * @desc Handles incoming HTTP requests for global and project-specific notes.
 */
import { Response } from "express";
import { z } from "zod";
import * as noteService from "./noteService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

// --- Validation Schemas ---
export const NoteSchema = z.object({
  title: z.string().min(1, "Note title is required").optional(),
  content: z.any().optional(),
  type: z
    .enum(["lore", "plot", "worldbuilding", "research", "timeline", "misc"])
    .optional(),
  novelId: z.string().optional().nullable(),
});

// --- Handlers ---
export const createNote = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const note = await noteService.createNote(
      req.params.novelId,
      req.user!.userId,
      req.body,
    );
    res.status(201).json({ note });
  },
);

export const createInboxNote = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const note = await noteService.createInboxNote(req.user!.userId, req.body);
    res.status(201).json({ note });
  },
);

export const getNovelNotes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { type, page, limit } = req.query;
    const result = await noteService.getNotesByNovel(
      req.params.novelId,
      req.user!.userId,
      type as string,
      Number(page) || 1,
      Number(limit) || 20,
    );
    res.status(200).json(result);
  },
);

export const getInboxNotes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = req.query;
    const result = await noteService.getInboxNotes(
      req.user!.userId,
      Number(page) || 1,
      Number(limit) || 50,
    );
    res.status(200).json(result);
  },
);

export const updateNote = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const updatedNote = await noteService.updateNote(
      req.params.noteId,
      req.user!.userId,
      req.body,
    );
    res.status(200).json({ note: updatedNote });
  },
);

export const deleteNote = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await noteService.deleteNote(req.params.noteId, req.user!.userId);
    res.status(204).send(); // Standard REST response for successful deletion
  },
);
