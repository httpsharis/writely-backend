/**
 * @file likeModel.ts
 * @desc Mongoose schema representing a user's 'Like' on a specific document.
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILike extends Document {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { updatedAt: false } },
);

// Prevent double-liking at the DB level, and optimize 'checkLike' queries
LikeSchema.index({ documentId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ILike>("Like", LikeSchema);
