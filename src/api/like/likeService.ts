/**
 * @file likeService.ts
 * @desc Business logic for toggling likes and safely updating aggregate counters.
 */
import mongoose from "mongoose";
import Like from "./likeModel";
import Document from "../document/documentModel";
import { NotFoundError } from "../../utils/errors";

export const toggleLike = async (
  documentId: string,
  userId: string,
): Promise<{ isLiked: boolean; likesCount: number }> => {
  // 🟢 SENIOR FIX: Use a transaction to ensure both DB updates succeed, or both fail.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingLike = await Like.findOne({ documentId, userId }).session(
      session,
    );

    let updatedDoc;
    let isLikedNow = false;

    if (existingLike) {
      // UNLIKE: Remove record and decrement counter
      await Like.findByIdAndDelete(existingLike._id).session(session);
      updatedDoc = await Document.findByIdAndUpdate(
        documentId,
        { $inc: { likesCount: -1 } },
        { new: true, session },
      );
    } else {
      // LIKE: Create record and increment counter
      await Like.create([{ documentId, userId }], { session });
      updatedDoc = await Document.findByIdAndUpdate(
        documentId,
        { $inc: { likesCount: 1 } },
        { new: true, session },
      );
      isLikedNow = true;
    }

    if (!updatedDoc) {
      throw new NotFoundError("Document not found");
    }

    await session.commitTransaction();
    return { isLiked: isLikedNow, likesCount: updatedDoc.likesCount };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const checkUserLiked = async (
  documentId: string,
  userId: string,
): Promise<boolean> => {
  // 🟢 Use .exists() instead of .findOne() for a massive speed boost
  const likeExists = await Like.exists({ documentId, userId });
  return !!likeExists;
};
