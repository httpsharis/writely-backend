import Note, { INote } from './noteModel';
import Document from '../document/documentModel';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

interface NoteQuery {
    novelId: string;
    type?: string;
}

export const createNote = async (novelId: string, userId: string, noteData: Partial<INote>): Promise<INote> => {
    // SECURITY: Verify the novel exists AND belongs to the logged-in user
    const novel = await Document.findOne({ _id: novelId, owner: userId, type: 'novel' });
    if (!novel) {
        throw new NotFoundError('Novel not found or access denied');
    }

    return await Note.create({ ...noteData, novelId });
};

export const getNotesByNovel = async (
    novelId: string, 
    userId: string, 
    typeFilter?: string,
    page: number = 1,
    limit: number = 20
): Promise<{ notes: INote[], total: number }> => {
    // SECURITY: Prevent unauthorized users from reading private notes
    const novel = await Document.findOne({ _id: novelId, owner: userId, type: 'novel' });
    if (!novel) {
        throw new NotFoundError('Novel not found or access denied');
    }

    const query: any = { novelId };
    if (typeFilter) query.type = typeFilter;

    // Execute paginated queries in parallel for maximum speed
    const [notes, total] = await Promise.all([
        Note.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
        Note.countDocuments(query)
    ]);

    return { notes, total };
};

export const updateNote = async (noteId: string, userId: string, updateData: Partial<INote>): Promise<INote | null> => {
    const note = await Note.findById(noteId);
    if (!note) throw new NotFoundError('Note not found');

    // SECURITY: Verify the parent novel belongs to the user trying to update the note
    const novel = await Document.findOne({ _id: note.novelId, owner: userId, type: 'novel' });
    if (!novel) throw new UnauthorizedError('Unauthorized to edit this note');

    delete updateData.novelId;

    return await Note.findByIdAndUpdate(
        noteId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

export const deleteNote = async (noteId: string, userId: string): Promise<boolean> => {
    const note = await Note.findById(noteId);
    if (!note) return false; // Controller will handle 404

    // SECURITY: Verify the parent novel belongs to the user trying to delete the note
    const novel = await Document.findOne({ _id: note.novelId, owner: userId, type: 'novel' });
    if (!novel) throw new UnauthorizedError('Unauthorized to delete this note');

    await note.deleteOne();
    return true;
};