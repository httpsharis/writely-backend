/**
 * @file writingStatModel.ts
 * @desc High-frequency telemetry model. Tracks words written per session/chapter.
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWritingStat extends Document {
  _id: Types.ObjectId; 
  userId: Types.ObjectId;
  novelId: Types.ObjectId;
  chapterId: Types.ObjectId;
  wordCountSnapshot: number;
  createdAt: Date;
}

const WritingStatSchema = new Schema<IWritingStat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    novelId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    wordCountSnapshot: { type: Number, required: true, min: 0 },
  },
  { timestamps: { updatedAt: false } }, // Stats are immutable; no updates needed
);

WritingStatSchema.index({ userId: 1, createdAt: -1 });
WritingStatSchema.index({ chapterId: 1, createdAt: -1 });

export default mongoose.model<IWritingStat>("WritingStat", WritingStatSchema);
