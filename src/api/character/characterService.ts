/**
 * @file characterService.ts
 * @desc Core business and database logic for Character models.
 */

import Character, { ICharacter } from "./characterModel";
import Document from "../document/documentModel";
import { NotFoundError } from "../../utils/errors";

export const createCharacter = async (
  novelId: string | null,
  userId: string,
  data: Partial<ICharacter>,
) => {
  // Only check the novel database if this ISN'T a global character
  if (novelId) {
    const novelExists = await Document.exists({
      _id: novelId,
      owner: userId,
      type: "novel",
      deletedAt: null,
    });
    if (!novelExists)
      throw new NotFoundError("Novel not found or access denied");
  }
  return Character.create({ ...data, novelId, userId }); // Explicitly bind the owner
};

export const getCharactersByNovel = async (
  novelId: string | null,
  userId: string,
) => {
  if (novelId) {
    const novelExists = await Document.exists({
      _id: novelId,
      owner: userId,
      type: "novel",
      deletedAt: null,
    });
    if (!novelExists)
      throw new NotFoundError("Novel not found or access denied");
  }

  // Use .lean() for faster GET requests
  return Character.find({ novelId, userId })
    .populate("relationships.targetCharacterId", "name role avatarUrl")
    .sort({ role: 1, name: 1 })
    .lean();
};

export const updateCharacter = async (
  characterId: string,
  userId: string,
  updateData: Partial<ICharacter>,
) => {
  delete updateData.novelId; // 🔒 Security: Prevent moving characters across novels maliciously
  delete updateData.userId; // 🔒 Security: Prevent ownership transfer

  const character = await Character.findOneAndUpdate(
    { _id: characterId, userId }, // Ensure the user actually owns this character!
    { $set: updateData },
    { new: true, runValidators: true },
  ).populate("relationships.targetCharacterId", "name role avatarUrl");

  if (!character)
    throw new NotFoundError("Character not found or unauthorized");
  return character;
};

export const deleteCharacter = async (characterId: string, userId: string) => {
  // Delete immediately based on dual constraints (ID + Owner). Throws 404 if it fails.
  const result = await Character.findOneAndDelete({ _id: characterId, userId });
  if (!result) throw new NotFoundError("Character not found or unauthorized");
  return true;
};
