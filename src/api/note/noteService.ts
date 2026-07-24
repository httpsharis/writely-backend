/**
 * @file noteService.ts
 * @desc Core business logic for Note CRUD operations.
 * Enforces strict ownership checks directly at the database query level.
 */
import Note, { INote } from "./noteModel";
import Document from "../document/documentModel";
import { NotFoundError } from "../../utils/errors";

export const createNote = async (
  novelId: string,
  userId: string,
  noteData: Partial<INote>,
) => {
  // Only checks if the document exists, doesn't download it.
  const novelExists = await Document.exists({
    _id: novelId,
    owner: userId,
    type: "novel",
  });
  if (!novelExists) throw new NotFoundError("Novel not found or access denied");

  return Note.create({ ...noteData, novelId, owner: userId });
};

export const createInboxNote = async (
  userId: string,
  noteData: Partial<INote>,
) => Note.create({ ...noteData, owner: userId });

export const getInboxNotes = async (
  userId: string,
  page: number = 1,
  limit: number = 50,
) => {
  // Queries for notes that explicitly have no novel assigned
  const query = { owner: userId, novelId: null };
  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Note.countDocuments(query),
  ]);
  return { notes, total };
};

export const getNotesByNovel = async (
  novelId: string,
  userId: string,
  typeFilter?: string,
  page: number = 1,
  limit: number = 20,
) => {
  const novelExists = await Document.exists({
    _id: novelId,
    owner: userId,
    type: "novel",
  });
  if (!novelExists) throw new NotFoundError("Novel not found or access denied");

  const query: Record<string, unknown> = { novelId, owner: userId };
  if (typeFilter) query.type = typeFilter;

  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Note.countDocuments(query),
  ]);
  return { notes, total };
};

export const updateNote = async (
  noteId: string,
  userId: string,
  updateData: Partial<INote>,
) => {
  // Ensures the note both exists AND belongs to the user in one step
  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: userId },
    { $set: updateData },
    { new: true, runValidators: true },
  );
  if (!note) throw new NotFoundError("Note not found or unauthorized");
  return note;
};

export const deleteNote = async (noteId: string, userId: string) => {
  const note = await Note.findOneAndDelete({ _id: noteId, owner: userId });
  if (!note) throw new NotFoundError("Note not found or unauthorized");
  return true;
};
