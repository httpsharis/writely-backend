/**
 * @file exportController.ts
 * @desc Handles HTTP requests for exporting novels and manuscripts.
 */
import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as exportService from "./exportService";

/**
 * @route GET /api/export/novel/:novelId
 * @desc Compiles a novel and its chapters into a downloadable Markdown file.
 */
export const exportNovel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { filename, content } = await exportService.compileNovelForExport(
      req.params.novelId,
      req.user!.userId,
    );

    // Tell the browser to download this response as a file
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8"); // Added UTF-8 for smart quotes/em-dashes

    // Send the raw compiled text
    res.status(200).send(content);
  },
);

/**
 * @route GET /api/export/library
 * @desc Exports the entire user's library (novels, characters, notes, profile) as JSON.
 */
export const exportLibrary = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const backupData = await exportService.exportLibrary(req.user!.userId);

    const safeDate = new Date().toISOString().split("T")[0];
    const filename = `writely-backup-${safeDate}.json`;

    // Tell the browser to download this response as a file
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // Send the JSON backup
    res.status(200).json(backupData);
  },
);
