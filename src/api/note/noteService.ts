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

    return await Note.create({ ...noteData, novelId, owner: userId });
};

export const createInboxNote = async (userId: string, noteData: Partial<INote>): Promise<INote> => {
    return await Note.create({ ...noteData, owner: userId });
};

export const getInboxNotes = async (
    userId: string, 
    page: number = 1,
    limit: number = 50
): Promise<{ notes: INote[], total: number }> => {
    const query = { owner: userId, novelId: { $exists: false } }; // Unassigned notes only

    const [notes, total] = await Promise.all([
        Note.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
        Note.countDocuments(query)
    ]);

    return { notes, total };
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

    // SECURITY: Verify the user owns the note directly, OR owns the parent novel
    if (note.owner && note.owner.toString() !== userId) {
        throw new UnauthorizedError('Unauthorized to edit this note');
    } else if (!note.owner) {
        // Fallback for legacy notes created before 'owner' was added to the schema
        const novel = await Document.findOne({ _id: note.novelId, owner: userId, type: 'novel' });
        if (!novel) throw new UnauthorizedError('Unauthorized to edit this note');
    }

    return await Note.findByIdAndUpdate(
        noteId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

export const deleteNote = async (noteId: string, userId: string): Promise<boolean> => {
    const note = await Note.findById(noteId);
    if (!note) return false; // Controller will handle 404

    // SECURITY: Verify the user owns the note directly, OR owns the parent novel
    if (note.owner && note.owner.toString() !== userId) {
        throw new UnauthorizedError('Unauthorized to delete this note');
    } else if (!note.owner) {
        const novel = await Document.findOne({ _id: note.novelId, owner: userId, type: 'novel' });
        if (!novel) throw new UnauthorizedError('Unauthorized to delete this note');
    }

    await note.deleteOne();
    return true;
};