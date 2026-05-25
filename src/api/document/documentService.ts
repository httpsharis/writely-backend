import crypto from 'crypto';
import mongoose from 'mongoose';
import Document, { IDocument } from './documentModel';

// Generates a URL-safe, unique string (e.g., "my-first-chapter-a8f3b2")
const generateSlug = (title: string): string => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomString = crypto.randomBytes(3).toString('hex');
    return `${baseSlug || 'doc'}-${randomString}`;
};

export const createDocument = async (ownerId: string, title: string = 'Untitled Document', parentId: string | null = null): Promise<IDocument> => {
    return await Document.create({
        title,
        slug: generateSlug(title),
        owner: ownerId,
        parentId
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
    // We just stamp the current date on 'deletedAt'. It vanishes from standard queries but stays in the DB.
    const isId = mongoose.Types.ObjectId.isValid(docId);
    
    return await Document.findOneAndUpdate(
        { 
            ...(isId ? { _id: docId } : { slug: docId }), 
            owner: ownerId, 
            deletedAt: null 
        },
        { deletedAt: new Date() },
        { returnDocument: 'after' }
    );
};