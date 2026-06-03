import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as characterService from './characterService';
import { AuthRequest } from '../../middleware/authMiddleware';
import { ICharacter } from './characterModel';

const CharacterSchema = z.object({
    name: z.string().min(1, "Character name is required"),
    role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
    bio: z.string().optional(),
    traits: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    status: z.enum(['alive', 'dead', 'unknown']).optional(),
    avatarUrl: z.string().optional(),

    relationships: z.array(z.object({
        targetCharacterId: z.string(),
        relationshipType: z.string(),
    })).optional()
});

export const createCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { novelId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const parsedData = CharacterSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const character = await characterService.createCharacter(novelId, userId, parsedData.data as unknown as Partial<ICharacter>);
        res.status(201).json({ character });
    } catch (error) {
        next(error);
    }
};

export const getNovelCharacters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { novelId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const characters = await characterService.getCharactersByNovel(novelId, userId);
        res.status(200).json({ characters });
    } catch (error) {
        next(error);
    }
};

export const updateCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { characterId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const parsedData = CharacterSchema.partial().safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const updatedCharacter = await characterService.updateCharacter(characterId, userId, parsedData.data as unknown as Partial<ICharacter>);
        res.status(200).json({ character: updatedCharacter });
    } catch (error) {
        next(error);
    }
};

export const deleteCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { characterId } = req.params;

        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const isDeleted = await characterService.deleteCharacter(characterId, userId);

        if (!isDeleted) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};