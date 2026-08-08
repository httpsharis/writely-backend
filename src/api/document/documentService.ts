/**
 * @file documentService.ts
 * @desc Core business logic for Novel and Chapter management.
 */

import * as crypto from "crypto";
import mongoose from "mongoose";
import Document, { IDocument } from "./documentModel";
import Character from "../character/characterModel";
import { NotFoundError } from "../../utils/errors";

// Interface for clean function signatures
interface CreateDocDTO {
  title?: string;
  parentId?: string | null;
  type?: "novel" | "chapter";
  coverImage?: string;
  synopsis?: string;
  tags?: string[];
  targetWords?: number;
}

export type PopulatedPublicDoc = Omit<IDocument, "owner"> & {
  owner: { _id: mongoose.Types.ObjectId; name: string };
  characters?: any[];
};

const generateSlug = (title: string): string => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const randomString = crypto.randomBytes(3).toString("hex");
  return `${baseSlug || "doc"}-${randomString}`;
};

export const createDocument = async (
  ownerId: string,
  data: CreateDocDTO,
): Promise<IDocument> => {
  return Document.create({
    ...data,
    owner: ownerId,
    slug: generateSlug(data.title || "Untitled"),
    // Explicit mapping to prevent undefined overriding defaults
    title: data.title || "Untitled",
    type: data.type || "novel",
    parentId: data.parentId || null,
  });
};

export const getUserDocuments = async (
  ownerId: string,
  type?: string
): Promise<IDocument[]> => {
  const query: any = { owner: ownerId, deletedAt: null };
  if (type) {
    query.type = type;
  }
  
  return Document.find(query)
    .select("-content") // Exclude heavy payload
    .sort({ updatedAt: -1 })
    .lean();
};

export const getDocumentById = async (docId: string, ownerId: string) => {
  const isId = mongoose.Types.ObjectId.isValid(docId);

  const document = (await Document.findOne({
    ...(isId ? { _id: docId } : { slug: docId }),
    owner: ownerId,
    deletedAt: null,
  }).lean()) as IDocument;

  if (!document) return null;

  // 🟢 SENIOR FIX: Explicitly cast to ObjectId to ensure Mongoose matches the parentId
  const safeId = new mongoose.Types.ObjectId(document._id.toString());

  // Attach children dynamically
  document.chapters = (await Document.find({
    parentId: safeId,
    owner: ownerId,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean()) as IDocument[];

  return document;
};

export const getPublishedDocumentBySlug = async (
  slug: string,
): Promise<PopulatedPublicDoc | null> => {
  // 1. Fetch the main requested document
  const doc = await Document.findOne({ slug, status: "published", deletedAt: null })
    .populate("owner", "name")
    .lean();

  if (!doc) return null;

  // 2. If it is a NOVEL (The Hub Page), fetch all its published chapters and characters
  if (doc.type === "novel") {
    const safeId = new mongoose.Types.ObjectId(doc._id.toString());
    doc.chapters = await Document.find({
      parentId: safeId,
      type: "chapter",
      status: "published",
      deletedAt: null,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();
      
    const chars = await Character.find({ novel: safeId }).lean();
    (doc as any).characters = chars;
  }

  // 3. If it is a CHAPTER (The Reader Page), fetch its parent novel AND sibling chapters
  else if (doc.type === "chapter" && doc.parentId) {
    const safeParentId = new mongoose.Types.ObjectId(doc.parentId.toString());

    const parentNovel = await Document.findOne({
      _id: safeParentId,
      status: "published",
      deletedAt: null,
    })
      .populate("owner", "name")
      .lean();

    if (parentNovel) {
      const safeParentNovelId = new mongoose.Types.ObjectId(parentNovel._id.toString());
      parentNovel.chapters = await Document.find({
        parentId: safeParentNovelId,
        type: "chapter",
        status: "published",
        deletedAt: null,
      })
        .sort({ order: 1, createdAt: 1 })
        .lean();

      const chars = await Character.find({ novel: safeParentNovelId }).lean();
      (parentNovel as any).characters = chars;

      doc.novel = parentNovel as unknown as IDocument;
    }
  }

  return doc as unknown as PopulatedPublicDoc;
};

export const updateDocument = async (
  docId: string,
  ownerId: string,
  updateData: Partial<IDocument>,
): Promise<IDocument | null> => {
  delete updateData.owner; // 🔒 Security lock

  if (updateData.title) {
    updateData.slug = generateSlug(updateData.title);
  }

  const isId = mongoose.Types.ObjectId.isValid(docId);

  // Safely cast parentId to ObjectId if it's being updated
  if (updateData.parentId && typeof updateData.parentId === "string") {
    updateData.parentId = new mongoose.Types.ObjectId(
      updateData.parentId,
    ) as unknown as typeof updateData.parentId;
  }

  return Document.findOneAndUpdate(
    {
      ...(isId ? { _id: docId } : { slug: docId }),
      owner: ownerId,
      deletedAt: null,
    },
    { $set: updateData },
    { returnDocument: "after", runValidators: true },
  ).lean();
};

export const softDeleteDocument = async (
  docId: string,
  ownerId: string,
): Promise<IDocument | null> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doc = await Document.findOneAndUpdate(
      { _id: docId, owner: ownerId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true, session },
    );

    if (!doc) throw new NotFoundError("Document not found or already deleted");

    if (doc.type === "novel") {
      await Document.updateMany(
        { parentId: docId, owner: ownerId, deletedAt: null },
        { deletedAt: new Date() },
        { session },
      );
    }

    await session.commitTransaction();
    return doc;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getTrashedDocuments = async (
  ownerId: string,
): Promise<IDocument[]> => {
  return Document.find({ owner: ownerId, deletedAt: { $ne: null } })
    .select("title type deletedAt")
    .sort({ deletedAt: -1 })
    .lean();
};

export const restoreDocument = async (
  docId: string,
  ownerId: string,
): Promise<IDocument | null> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doc = await Document.findOneAndUpdate(
      { _id: docId, owner: ownerId, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, session },
    );

    if (!doc) throw new NotFoundError("Document not found in trash");

    if (doc.type === "novel") {
      await Document.updateMany(
        { parentId: docId, owner: ownerId, deletedAt: { $ne: null } },
        { deletedAt: null },
        { session },
      );
    }

    await session.commitTransaction();
    return doc;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * @desc Atomically increments the view count of a published document.
 */
export const incrementViewCount = async (slug: string) => {
  return Document.findOneAndUpdate(
    { slug, status: "published", deletedAt: null },
    { $inc: { viewsCount: 1 } },
    { new: true, select: "viewsCount" }, // Only return the updated count to save bandwidth
  );
};

/**
 * @desc Atomically increments the like count of a published document.
 */
export const incrementLikeCount = async (slug: string) => {
  return Document.findOneAndUpdate(
    { slug, status: "published", deletedAt: null },
    { $inc: { likesCount: 1 } },
    { new: true, select: "likesCount" },
  );
};
