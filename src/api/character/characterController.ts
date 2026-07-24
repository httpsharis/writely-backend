/**
 * @file characterController.ts
 * @desc Handles HTTP requests for Character management, supporting both Novel-specific and Global characters.
 */

import { Response } from "express";
import { z } from "zod";
import * as characterService from "./characterService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

// 🟢 Zod Schema exported strictly for Route Middleware validation
export const CharacterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor"]).optional(),
  bio: z.string().optional(),
  traits: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  status: z.enum(["alive", "dead", "unknown"]).optional(),
  avatarUrl: z.string().optional(),
  relationships: z
    .array(
      z.object({
        targetCharacterId: z.string(),
        relationshipType: z.string(),
      }),
    )
    .optional(),
});

/**
 * @route POST /api/characters/novel/:novelId
 */
export const createCharacter = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const novelId = req.params.novelId === "global" ? null : req.params.novelId;
    const character = await characterService.createCharacter(
      novelId,
      req.user!.userId,
      req.body,
    );
    res.status(201).json({ character });
  },
);

/**
 * @route GET /api/characters/novel/:novelId
 */
export const getNovelCharacters = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const novelId = req.params.novelId === "global" ? null : req.params.novelId;
    const characters = await characterService.getCharactersByNovel(
      novelId,
      req.user!.userId,
    );
    res.status(200).json({ characters });
  },
);

/**
 * @route PUT /api/characters/:characterId
 */
export const updateCharacter = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const character = await characterService.updateCharacter(
      req.params.characterId,
      req.user!.userId,
      req.body,
    );
    res.status(200).json({ character });
  },
);

/**
 * @route DELETE /api/characters/:characterId
 */
export const deleteCharacter = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await characterService.deleteCharacter(
      req.params.characterId,
      req.user!.userId,
    );
    res.status(204).send();
  },
);
