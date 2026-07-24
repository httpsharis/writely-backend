/**
 * @file writingGoalModel.ts
 * @desc Configuration model. Stores user-defined writing targets.
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWritingGoal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: "daily" | "weekly" | "novel_total";
  targetWords: number;
  novelId?: Types.ObjectId;
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WritingGoalSchema = new Schema<IWritingGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["daily", "weekly", "novel_total"],
      required: true,
    },
    targetWords: { type: Number, required: true, min: 1 },
    novelId: { type: Schema.Types.ObjectId, ref: "Document" },
    deadline: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

WritingGoalSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IWritingGoal>("WritingGoal", WritingGoalSchema);
