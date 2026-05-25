import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  title: string;
  slug: string;
  content: any;
  owner: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  parentId: mongoose.Types.ObjectId | null;
  coverImage?: string;
  icon?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: "Untitled Document" },
    slug: { type: String, required: true, unique: true },
    content: { type: Schema.Types.Mixed, default: {} },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    parentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    coverImage: { type: String },
    icon: { type: String },
    deletedAt: { type: Date, default: null }, // Soft delete mechanism
  },
  { timestamps: true },
);

// Performance Indexes
DocumentSchema.index({ owner: 1, updatedAt: -1 }); // Dashboard query: "My docs, newest first"
DocumentSchema.index({ status: 1, owner: 1 }); // Security query
DocumentSchema.index({ parentId: 1 }); // Lobby/Chapter query

export default mongoose.model<IDocument>("Document", DocumentSchema);
