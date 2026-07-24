/**
 * @file noteModel.ts
 * @desc Mongoose schema for Notes. Notes can be global (inbox) or tied to a specific novel.
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface INote extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  novelId?: Types.ObjectId | null;
  title: string;
  content: any; // TipTap JSON
  type: "lore" | "plot" | "worldbuilding" | "research" | "timeline" | "misc";
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    novelId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    title: {
      type: String,
      required: true,
      default: "Untitled Note",
      trim: true,
    },
    content: { type: Schema.Types.Mixed, default: {} },
    type: {
      type: String,
      enum: ["lore", "plot", "worldbuilding", "research", "timeline", "misc"],
      default: "misc",
    },
  },
  { timestamps: true },
);

NoteSchema.index({ novelId: 1, owner: 1, type: 1 });
NoteSchema.index({ owner: 1, novelId: 1 }); // For Inbox queries (where novelId is null/missing)
NoteSchema.index({ title: "text" }, { name: "NoteTextIndex" });

export default mongoose.model<INote>("Note", NoteSchema);
