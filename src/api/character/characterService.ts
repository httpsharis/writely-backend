import Character, { ICharacter } from './characterModel';
import Document from '../document/documentModel';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

export const createCharacter = async (novelId: string, userId: string, characterData: Partial<ICharacter>): Promise<ICharacter> => {
    // SECURITY: Verify the novel exists and belongs to the author
    const novel = await Document.findOne({ _id: novelId, owner: userId, type: 'novel' });
    if (!novel) {
        throw new NotFoundError('Novel not found or access denied');
    }

    return await Character.create({ ...characterData, novelId });
};

export const getCharactersByNovel = async (novelId: string, userId: string): Promise<ICharacter[]> => {
    // SECURITY: Prevent unauthorized users from reading private character sheets
    const novel = await Document.findOne({ _id: novelId, owner: userId, type: 'novel' });
    if (!novel) {
        throw new NotFoundError('Novel not found or access denied');
    }

    return await Character.find({ novelId })
        .populate('relationships.targetCharacterId', 'name role avatarUrl')
        .sort({ role: 1, name: 1 });
};

export const updateCharacter = async (characterId: string, userId: string, updateData: Partial<ICharacter>): Promise<ICharacter | null> => {
    const character = await Character.findById(characterId);
    if (!character) throw new NotFoundError('Character not found');

    // SECURITY: Verify the parent novel belongs to the user trying to update
    const novel = await Document.findOne({ _id: character.novelId, owner: userId, type: 'novel' });
    if (!novel) throw new UnauthorizedError('Unauthorized to edit this character');

    delete updateData.novelId;

    return await Character.findByIdAndUpdate(
        characterId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('relationships.targetCharacterId', 'name role avatarUrl');
};

export const deleteCharacter = async (characterId: string, userId: string): Promise<boolean> => {
    const character = await Character.findById(characterId);
    if (!character) return false;

    // SECURITY: Verify the parent novel belongs to the user trying to delete
    const novel = await Document.findOne({ _id: character.novelId, owner: userId, type: 'novel' });
    if (!novel) throw new UnauthorizedError('Unauthorized to delete this character');

    await character.deleteOne();
    return true;
};