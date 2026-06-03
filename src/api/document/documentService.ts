import * as crypto from 'crypto';
import mongoose from 'mongoose';
import Document, { IDocument } from './documentModel';
import { NotFoundError } from '../../utils/errors';

// Generates a URL-safe, unique string (e.g., "my-first-chapter-a8f3b2")
const generateSlug = (title: string): string => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomString = crypto.randomBytes(3).toString('hex');
    return `${baseSlug || 'doc'}-${randomString}`;
};

export const createDocument = async (
    ownerId: string,
    title: string = 'Untitled Document',
    parentId: string | null = null,
    type: 'novel' | 'chapter' = 'novel'): Promise<IDocument> => {
    return await Document.create({
        title,
        slug: generateSlug(title),
        owner: ownerId,
        parentId,
        type
    });
};

export const getUserDocuments = async (ownerId: string): Promise<IDocument[]> => {
    // Only return documents that are NOT soft-deleted
    return await Document.find({ owner: ownerId, deletedAt: null })
        .select('-content') // Exclude heavy content payloads for the dashboard list
        .sort({ updatedAt: -1 });
};

export const getDocumentById = async (docId: string, ownerId: string): Promise<IDocument | null> => {
    const isId = mongoose.Types.ObjectId.isValid(docId);
    return await Document.findOne({
        ...(isId ? { _id: docId } : { slug: docId }),
        owner: ownerId,
        deletedAt: null
    });
};

export const getPublishedDocumentBySlug = async (slug: string): Promise<IDocument | null> => {
    // Only fetch if it's published and not deleted
    return await Document.findOne({ slug, status: 'published', deletedAt: null })
        .populate('owner', 'name'); // Attach the author's name for the public reader UI
};

export const updateDocument = async (docId: string, ownerId: string, updateData: Partial<IDocument>): Promise<IDocument | null> => {
    // Security: Never allow ownership transfer via update
    delete updateData.owner;

    // Note: If they update the title, we do NOT regenerate the slug. 
    // Changing a slug would break all existing public links to this document.

    const isId = mongoose.Types.ObjectId.isValid(docId);

    return await Document.findOneAndUpdate(
        {
            ...(isId ? { _id: docId } : { slug: docId }),
            owner: ownerId,
            deletedAt: null
        },
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
    );
};

export const softDeleteDocument = async (docId: string, ownerId: string): Promise<IDocument | null> => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // 1. Delete the parent document
        const doc = await Document.findOneAndUpdate(
            { _id: docId, owner: ownerId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true, session }
        );

        if (!doc) {
            throw new NotFoundError('Document not found or already deleted');
        }

        // 2. Cascade: If it's a novel, soft-delete all child chapters automatically
        if (doc.type === 'novel') {
            await Document.updateMany(
                { parentId: docId, owner: ownerId, deletedAt: null },
                { deletedAt: new Date() },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return doc;
    } catch (error) {
        await session.abortTransaction();
        session.endSession()
        throw error
    }
};

export const getTrashedDocuments = async (ownerId: string): Promise<IDocument[]> => {
    return await Document.find({
        owner: ownerId,
        deletedAt: { $ne: null } // Fetch only items where deletedAt is NOT null
    })
        .select('title type deletedAt')
        .sort({ deletedAt: -1 })
        .lean();
};

// Restore from Trash
export const restoreDocument = async (docId: string, ownerId: string): Promise<IDocument | null> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const doc = await Document.findOneAndUpdate(
            { _id: docId, owner: ownerId, deletedAt: { $ne: null } },
            { deletedAt: null }, // Remove the trash timestamp
            { new: true, session }
        );

        if (!doc) throw new NotFoundError('Document not found in trash');

        // Cascade Restore: Bring back the child chapters too
        if (doc.type === 'novel') {
            await Document.updateMany(
                { parentId: docId, owner: ownerId, deletedAt: { $ne: null } },
                { deletedAt: null },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return doc;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};